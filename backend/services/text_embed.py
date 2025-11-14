from __future__ import annotations
import torch
import clip
import numpy as np

_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
# Must match the model used by workers/embedder.py
_MODEL, _PREPROCESS = clip.load("ViT-B/32", device=_DEVICE)

def get_text_embedding(text: str) -> list[float]:
    """
    Encode text with CLIP and L2-normalize so it is cosine-compatible
    with image embeddings we stored.
    Returns a Python list[float] (length 512) for psycopg2 vector casting.
    """
    with torch.no_grad():
        token = clip.tokenize([text]).to(_DEVICE)
        vec = _MODEL.encode_text(token).float()
        vec = vec / vec.norm(dim=-1, keepdim=True)
        arr = vec.cpu().numpy()[0]  # shape (512,)
    return arr.tolist()
