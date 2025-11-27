from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import requests
from io import BytesIO
from PIL import Image
from functools import lru_cache
from urllib.parse import urlparse
import torch

router = APIRouter(prefix="/caption", tags=["caption"])


# -------------------------------------------------------------------
# Model loader: Florence-2-base (light + good captions)
# -------------------------------------------------------------------
@lru_cache(maxsize=1)
def get_caption_model():
    """
    Load Florence-2-base captioning model (cached).

    This uses AutoModelForCausalLM + AutoProcessor with trust_remote_code=True,
    which is how the official model card shows usage.
    """
    from transformers import AutoProcessor, AutoModelForCausalLM  # <-- FIX

    model_id = "microsoft/Florence-2-base"

    # Device: CUDA -> MPS (Apple GPU) -> CPU
    if torch.cuda.is_available():
        device = "cuda"
    elif torch.backends.mps.is_available():
        device = "mps"
    else:
        device = "cpu"

    torch_dtype = torch.float16 if device == "cuda" else torch.float32

    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch_dtype,
        trust_remote_code=True,
    ).to(device)

    processor = AutoProcessor.from_pretrained(
        model_id,
        trust_remote_code=True,
    )

    model.eval()
    return processor, model, device, torch_dtype


# -------------------------------------------------------------------
# Schemas
# -------------------------------------------------------------------
class CaptionRequest(BaseModel):
    image_url: str


class CaptionResponse(BaseModel):
    caption: str


class BatchCaptionRequest(BaseModel):
    frame_ids: List[int]


class FrameCaption(BaseModel):
    frame_id: int
    caption: str
    error: Optional[str] = None


class BatchCaptionResponse(BaseModel):
    captions: List[FrameCaption]


# -------------------------------------------------------------------
# Helper: run Florence-2 caption on a single PIL image
# -------------------------------------------------------------------
def caption_image_with_florence(image: Image.Image) -> str:
    """
    Run Florence-2 on a single image and return a detailed caption string.
    """
    processor, model, device, torch_dtype = get_caption_model()

    task_prompt = "<MORE_DETAILED_CAPTION>"  # very descriptive mode :contentReference[oaicite:1]{index=1}

    inputs = processor(
        text=task_prompt,
        images=image,
        return_tensors="pt",
    )

    # BatchEncoding has .to(device, dtype) just like tensors
    inputs = inputs.to(device, torch_dtype)

    with torch.no_grad():
        generated_ids = model.generate(
            input_ids=inputs["input_ids"],
            pixel_values=inputs["pixel_values"],
            max_new_tokens=256,
            do_sample=False,
            num_beams=3,
        )

    generated_text = processor.batch_decode(
        generated_ids,
        skip_special_tokens=False,
    )[0]

    parsed = processor.post_process_generation(
        generated_text,
        task=task_prompt,
        image_size=(image.width, image.height),
    )

    # parsed is usually a dict like: {"<MORE_DETAILED_CAPTION>": ["... text ..."]}
    caption: Optional[str] = None
    if isinstance(parsed, dict) and parsed:
        val = next(iter(parsed.values()))
        if isinstance(val, list) and val:
            caption = val[0]
        elif isinstance(val, str):
            caption = val

    if not caption:
        caption = str(parsed)

    return caption


# -------------------------------------------------------------------
# Single-caption endpoint
# -------------------------------------------------------------------
@router.post("", response_model=CaptionResponse, summary="Generate image caption")
def generate_caption(request: CaptionRequest):
    """
    Generate a caption for a single image URL using Florence-2-base.
    """
    try:
        if request.image_url.startswith("/media/"):
            raise HTTPException(status_code=400, detail="Please provide absolute URL")

        resp = requests.get(request.image_url, timeout=10)
        resp.raise_for_status()
        image = Image.open(BytesIO(resp.content)).convert("RGB")

        caption = caption_image_with_florence(image)
        return CaptionResponse(caption=caption)

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Caption generation failed: {str(e)}")


# -------------------------------------------------------------------
# Batch-caption endpoint
# -------------------------------------------------------------------
@router.post("/batch", response_model=BatchCaptionResponse, summary="Generate captions for multiple frames")
def generate_batch_captions(request: BatchCaptionRequest):
    """
    Generate captions for multiple frames by frame_id using Florence-2-base.
    Always returns one FrameCaption per requested frame_id.
    """
    from backend.db.postgres import get_conn
    from backend.services.drive import resolve_path, download_bytes
    from psycopg.rows import dict_row

    if not request.frame_ids:
        return BatchCaptionResponse(captions=[])

    placeholders = ",".join(["%s"] * len(request.frame_ids))
    sql = f"""
    SELECT 
        f.id AS frame_id,
        f.media_key,
        d.media_base_uri
    FROM navis.frames f
    JOIN navis.sequences s ON s.id = f.sequence_id
    JOIN navis.datasets d ON d.id = s.dataset_id
    WHERE f.id IN ({placeholders})
    """

    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, request.frame_ids)
        rows = cur.fetchall()

    frame_map = {row["frame_id"]: row for row in rows}
    results: List[FrameCaption] = []

    for frame_id in request.frame_ids:
        frame = frame_map.get(frame_id)
        if not frame:
            results.append(
                FrameCaption(
                    frame_id=frame_id,
                    caption="",
                    error="Frame not found in database",
                )
            )
            continue

        try:
            parsed_uri = urlparse(frame["media_base_uri"])
            root_id = parsed_uri.netloc

            file_id = resolve_path(root_id, frame["media_key"])
            if not file_id:
                raise Exception(f"Could not resolve path: {frame['media_key']}")

            img_bytes = download_bytes(file_id)
            image = Image.open(BytesIO(img_bytes)).convert("RGB")

            caption = caption_image_with_florence(image)

            results.append(
                FrameCaption(
                    frame_id=frame_id,
                    caption=caption,
                    error=None,
                )
            )

        except Exception as e:
            results.append(
                FrameCaption(
                    frame_id=frame_id,
                    caption="",
                    error=str(e),
                )
            )

    return BatchCaptionResponse(captions=results)
