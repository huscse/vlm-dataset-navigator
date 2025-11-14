"""
Run object detection on frames and store results in the database.
Uses YOLOv8 for fast, accurate detection.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ultralytics import YOLO
from backend.db.postgres import get_conn
from backend.services.drive import download_bytes, resolve_path
from urllib.parse import urlparse
import io
from PIL import Image
import numpy as np
from psycopg2.extras import RealDictCursor

# Initialize YOLO model (will download on first run)
model = YOLO('yolov8n.pt')  # nano model, fastest

# COCO class names that are relevant for autonomous driving
RELEVANT_CLASSES = {
    'person', 'bicycle', 'car', 'motorcycle', 'bus', 'truck',
    'traffic light', 'stop sign', 'parking meter', 'dog', 'cat'
}

def detect_and_store(frame_id: int, image_bytes: bytes):
    """Run YOLO on image bytes and return detections"""
    # Convert bytes to PIL Image
    img = Image.open(io.BytesIO(image_bytes))
    
    # Convert grayscale to RGB if needed
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Convert to numpy array
    img_array = np.array(img)
    
    # Run detection
    results = model(img_array, verbose=False)
    
    detections = []
    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls = int(box.cls[0])
            class_name = model.names[cls]
            confidence = float(box.conf[0])
            
            # Only store relevant classes with confidence > 0.3
            if class_name in RELEVANT_CLASSES and confidence > 0.3:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                detections.append({
                    'frame_id': frame_id,
                    'object_type': class_name,
                    'confidence': confidence,
                    'bbox_x1': x1,
                    'bbox_y1': y1,
                    'bbox_x2': x2,
                    'bbox_y2': y2
                })
    
    return detections

def process_frames(limit=None):
    """Process all frames without detections"""
    # Get list of frames to process
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Find frames without detections - ONLY from gdrive provider
            query = """
                SELECT f.id, f.media_key, d.media_base_uri
                FROM navis.frames f
                JOIN navis.sequences s ON f.sequence_id = s.id
                JOIN navis.datasets d ON s.dataset_id = d.id
                WHERE NOT EXISTS (
                    SELECT 1 FROM navis.frame_objects fo 
                    WHERE fo.frame_id = f.id
                )
                AND d.provider = 'gdrive'
                ORDER BY f.id
            """
            if limit:
                query += f" LIMIT {limit}"
            
            cur.execute(query)
            frames = cur.fetchall()
    
    print(f"Found {len(frames)} frames to process")
    
    for i, row in enumerate(frames):
        frame_id = row['id']
        media_key = row['media_key']
        media_base_uri = row['media_base_uri']
        
        print(f"[{i+1}/{len(frames)}] Processing frame {frame_id}: {media_key}")
        
        try:
            # Download image from Google Drive
            parsed = urlparse(media_base_uri)
            if parsed.scheme == 'gdrive':
                root_id = parsed.netloc
                file_id = resolve_path(root_id, media_key)
                if not file_id:
                    print(f"  ⚠️  Could not resolve path: {media_key}")
                    continue
                
                image_bytes = download_bytes(file_id)
            else:
                print(f"  ⚠️  Unsupported provider: {parsed.scheme}")
                continue
            
            # Detect objects
            detections = detect_and_store(frame_id, image_bytes)
            
            # Store in database with its own transaction
            if detections:
                try:
                    with get_conn() as conn:
                        with conn.cursor() as insert_cur:
                            for det in detections:
                                insert_cur.execute("""
                                    INSERT INTO navis.frame_objects 
                                    (frame_id, object_type, confidence, bbox_x1, bbox_y1, bbox_x2, bbox_y2)
                                    VALUES (%(frame_id)s, %(object_type)s, %(confidence)s, 
                                            %(bbox_x1)s, %(bbox_y1)s, %(bbox_x2)s, %(bbox_y2)s)
                                """, det)
                        conn.commit()
                    
                    # Show what was detected
                    obj_summary = {}
                    for det in detections:
                        obj_type = det['object_type']
                        obj_summary[obj_type] = obj_summary.get(obj_type, 0) + 1
                    
                    summary_str = ", ".join([f"{count}x {obj}" for obj, count in obj_summary.items()])
                    print(f"  ✓ Stored {len(detections)} detections: {summary_str}")
                except Exception as db_error:
                    print(f"  ✗ Database error: {db_error}")
            else:
                print(f"  ℹ️  No relevant objects detected")
        
        except Exception as e:
            print(f"  ✗ Error: {e}")
            continue

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=50, help='Number of frames to process')
    args = parser.parse_args()
    
    print("Starting object detection...")
    print("=" * 60)
    process_frames(limit=args.limit)
    print("=" * 60)
    print("Done!")