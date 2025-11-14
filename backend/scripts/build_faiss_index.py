import sys
from pathlib import Path
import numpy as np
import faiss
import json

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from db.postgres import get_conn

def build_faiss_index(dataset_slug='kitti'):
    """Build FAISS index from embeddings in Postgres"""
    
    with get_conn() as conn, conn.cursor() as cur:
        # Get all embeddings for this dataset
        cur.execute("""
            SELECT e.frame_id, e.emb
            FROM navis.embeddings e
            JOIN navis.frames f ON e.frame_id = f.id
            JOIN navis.sequences s ON f.sequence_id = s.id
            JOIN navis.datasets d ON s.dataset_id = d.id
            WHERE d.slug = %s
            ORDER BY e.frame_id
        """, (dataset_slug,))
        
        rows = cur.fetchall()
        
    if not rows:
        print(f"❌ No embeddings found for dataset: {dataset_slug}")
        return
    
    print(f"✅ Found {len(rows)} embeddings")
    
    # Extract frame_ids and embeddings
    frame_ids = []
    embeddings = []
    
    for row in rows:
        frame_id = row['frame_id'] if isinstance(row, dict) else row[0]
        emb = row['emb'] if isinstance(row, dict) else row[1]
        
        # Parse embedding if it's a string
        if isinstance(emb, str):
            emb = json.loads(emb)
        elif isinstance(emb, list):
            pass  # already a list
        else:
            print(f"Unknown embedding type: {type(emb)}")
            continue
        
        frame_ids.append(frame_id)
        embeddings.append(emb)
    
    # Convert to numpy array
    embeddings_np = np.array(embeddings, dtype=np.float32)
    print(f"Embeddings shape: {embeddings_np.shape}")
    
    # Build FAISS index (L2 distance, which works with normalized vectors for cosine similarity)
    d = embeddings_np.shape[1]  # dimension (512 for CLIP)
    index = faiss.IndexFlatL2(d)
    index.add(embeddings_np)
    
    print(f"✅ Built FAISS index with {index.ntotal} vectors")
    
    # Save index and mapping
    index_dir = BACKEND_ROOT / "faiss_indexes"
    index_dir.mkdir(exist_ok=True)
    
    index_path = index_dir / f"{dataset_slug}.index"
    mapping_path = index_dir / f"{dataset_slug}_mapping.npy"
    
    faiss.write_index(index, str(index_path))
    np.save(mapping_path, np.array(frame_ids, dtype=np.int32))
    
    print(f"✅ Saved FAISS index to: {index_path}")
    print(f"✅ Saved frame ID mapping to: {mapping_path}")

if __name__ == "__main__":
    build_faiss_index('kitti')