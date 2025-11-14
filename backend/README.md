# Navis Backend (Latitude AI)

End-to-end backend for semantic search over autonomous-driving datasets (nuScenes, KITTI).
Stack: **FastAPI** (query API) · **CLIP** (text/image encoders) · **FAISS** (vector index) · **Redis Streams** (async bus) · **Postgres** (catalog) · **Google Drive** (object storage) · **BLIP / Qwen** (captions & summaries).

> TL;DR flow:
>
> * **Workers** embed frames (images) from **Google Drive** with **CLIP** → publish vectors to Redis.
> * **Caption worker** generates BLIP/Qwen captions and stores them in Postgres.
> * **FAISS indexer** consumes vectors, updates the FAISS index, and writes periodic snapshots.
> * **FastAPI** serves `/search`: encodes the text query with CLIP → FAISS top-K → Postgres join (+ optional Drive preview links + captions).

---

## Table of Contents

* [Repository Layout](#repository-layout)
* [Concepts & Responsibilities](#concepts--responsibilities)
* [Installation](#installation)
* [Configuration](#configuration)
* [Running Locally (Docker Compose)](#running-locally-docker-compose)
* [Data Contracts](#data-contracts)
* [API Routes](#api-routes)
* [Workers](#workers)
* [Indexing & Snapshots](#indexing--snapshots)
* [Captions & Summaries](#captions--summaries)
* [Schema Notes](#schema-notes)
* [Development Workflow](#development-workflow)
* [Deployment Guide](#deployment-guide)
* [Troubleshooting](#troubleshooting)

---

## Repository Layout

```
backend/
  README.md
  .env.example
  docker-compose.yml
  pyproject.toml | requirements.txt
  secrets/                 # (local only) service account; excluded from git
    sa.json
  src/
    api/
      __init__.py
      main.py              # FastAPI entrypoint
      routes_search.py     # /search (semantic search) & /admin/reload
      deps.py              # (optional) shared FastAPI dependencies
    common/
      __init__.py
      settings.py          # config loader for env vars
      drive_storage.py     # Google Drive adapter (fileId -> PIL image/bytes)
      db.py                # Postgres helpers (fetch frames/joins)
      schema.py            # Pydantic models (request/response)
      caption_runtime.py   # BLIP/Qwen runtime for captions/summaries
    search/
      __init__.py
      clip_runtime.py      # CLIP text/image encoders (loaded once per process)
      faiss_runtime.py     # Load latest FAISS snapshot & perform queries
      snapshots/           # index_*.index + id_map_*.json (gitignored)
    workers/
      __init__.py
      embed_worker.py      # Consume frame messages -> image embed -> publish vector
      faiss_indexer.py     # Consume vectors -> update FAISS -> write snapshots
      caption_worker.py    # Consume frames -> generate caption/summary -> store in DB
```

---

## Concepts & Responsibilities

* **Google Drive (object storage)**
  All media (images) live in Drive. We reference files by **`drive_file_id`**.
  Each dataset row in `navis.datasets` stores `provider='gdrive'` and `media_base_uri='gdrive://<ROOT_FOLDER_ID>'`.

* **Postgres (catalog DB)**
  Structured metadata: `datasets`, `scenes`, `frames`, `annotations`, …
  Each `frame` should have `drive_file_id`. Captions live in `auto_labels`; scene summaries (optional) in `scene_summaries`.

* **Redis Streams (message bus)**

  * `ingest.frames`: new frames to embed/caption (`frame_id`, `drive_file_id`)
  * `vectors.new`: produced by `embed_worker` containing CLIP vector payloads
  * (optional) `index.commands`: control messages for indexer

* **FAISS (vector index)**
  In-memory index for cosine/inner-product similarity. Position→`frame_id` is tracked via `id_map`.
  Indexer writes **snapshots** so the API can reload without recomputing.

* **FastAPI (query service)**

  * `/search`: text query → CLIP→ FAISS→ Postgres join (+ captions) → results
  * `/admin/reload`: reload the newest FAISS snapshot (hot-swap)

---

## Installation

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

**Core dependencies**:

```
fastapi
uvicorn[standard]
redis
faiss-cpu             # or faiss-gpu with CUDA
torch
transformers
Pillow
google-api-python-client
google-auth
google-auth-httplib2
google-auth-oauthlib
psycopg2-binary
python-dotenv
pydantic
```

---

## Configuration

Copy `.env.example` → `.env` and fill in values:

```env
# App
APP_ENV=dev
PORT=8000

# CLIP model + device
CLIP_MODEL=openai/clip-vit-base-patch32
DEVICE=cpu

# Redis
REDIS_URL=redis://redis:6379/0

# FAISS
INDEX_SNAPSHOT_DIR=/data/faiss
INDEX_DIM=512

# Google Drive (Service Account JSON mounted in container)
GOOGLE_APPLICATION_CREDENTIALS=/secrets/sa.json

# Postgres (used by API to join metadata)
PG_DSN=postgresql://user:pass@postgres:5432/navis

# Captions/Summaries
CAPTION_MODEL=blip                 # blip | qwen
CAPTION_MAX_TOKENS=48
CAPTION_PROMPT=Brief caption.
ENABLE_SCENE_SUMMARY=false
SUMMARY_PROMPT=Summarize key objects and motion in 1-2 lines.
CAPTION_STREAM=ingest.frames       # reuse or set to a dedicated 'ingest.captions'
```

> **Service account**: share dataset folders with the SA email. `secrets/sa.json` is mounted in Docker.

---

## Running Locally (Docker Compose)

```bash
docker compose up --build
```

Services:

* **api** → FastAPI at `http://localhost:8000`
* **redis** → message bus
* **embed_worker** → Drive → CLIP → vectors
* **indexer** → FAISS add() + snapshot writer
* **caption_worker** → Drive → BLIP/Qwen → store `auto_labels`

Quick smoke test:

```python
# add one message to ingest.frames
import os, redis
r = redis.Redis.from_url(os.getenv("REDIS_URL","redis://localhost:6379/0"))
r.xadd("ingest.frames", {
  "frame_id":"123e4567-e89b-12d3-a456-426614174000",
  "drive_file_id":"<ACTUAL_DRIVE_FILE_ID>",
  "ops":"embed,caption"   # optional hint; caption_worker will ignore if not present
})
```

Then:

```
GET http://localhost:8000/search?q=red+car&k=20
```

---

## Data Contracts

### 1) `ingest.frames` (produced by ingestion/ETL)

```json
{
  "frame_id": "uuid",
  "drive_file_id": "string",
  "ops": "embed,caption"   // optional; workers can check or ignore
}
```

### 2) `vectors.new` (produced by `embed_worker`)

```json
{
  "frame_id": "uuid",
  "drive_file_id": "string",
  "model": "openai/clip-vit-base-patch32",
  "vector": "[float, float, ...]" // JSON-encoded list of float32
}
```

*No new stream for captions by default — caption worker reads `ingest.frames` unless you set `CAPTION_STREAM`.*

---

## API Routes

### `GET /search`

**Params**

* `q` (string, required): text query
* `k` (int, optional, default 20): number of results
* optional filters (e.g., `dataset`, `split`, …) if implemented in `db.py`

**Flow**

1. Encode `q` with CLIP (text encoder) → 512-d vector
2. FAISS `.search(q_vec, k)` → indices + scores
3. Map indices → `frame_id` via `id_map`
4. Join metadata in Postgres (`frames`, `scenes`, …)
5. **Left-join latest caption** from `auto_labels` (if present)
6. Return results *(with optional Drive thumbnail/share link if stored)*

**Response (example)**

```json
{
  "query": "red car turning left",
  "results": [
    {
      "frame_id": "uuid",
      "score": 0.74,
      "dataset": "nuscenes",
      "scene_id": "uuid",
      "drive_file_id": "1AbC...xyz",
      "title": "CAM_FRONT 000123",
      "caption": "A red sedan turning left at an intersection.",
      "ts": "2020-01-01T00:00:00Z",
      "preview_url": "https://..."
    }
  ]
}
```

### `POST /admin/reload`

Reload the newest FAISS snapshot from `search/snapshots/`.

---

## Workers

### `workers/embed_worker.py`

* **Consumes**: `ingest.frames`
* **Does**:

  * Fetch image via `drive_file_id` → `drive_storage.load_image_by_file_id`
  * Compute CLIP image embedding → normalized vector
  * Publish to `vectors.new`

### `workers/faiss_indexer.py`

* **Consumes**: `vectors.new` (in batches)
* **Does**:

  * Normalize vectors (`faiss.normalize_L2`)
  * `index.add(batch)` (IndexFlatIP for cosine similarity)
  * Append `frame_id` to `id_map`
  * Periodically write snapshots:

    * `search/snapshots/index_<ts>.index`
    * `search/snapshots/id_map_<ts>.json`

### `workers/caption_worker.py`  *(new)*

* **Consumes**: `ingest.frames` (or `CAPTION_STREAM`)
* **Does**:

  * Fetch image via `drive_file_id` → `drive_storage.load_image_by_file_id`
  * Generate **caption** with **BLIP** (fast) or **Qwen2.5-VL-3B-Instruct** (richer)
  * Write to `auto_labels(frame_id, model, text, score?)`
  * (Optional) Aggregate and write `scene_summaries` per scene

> Runtime choice via `CAPTION_MODEL=blip|qwen`. Keep captions short (`CAPTION_MAX_TOKENS`) for speed.

---

## Indexing & Snapshots

* **Index type**: `IndexFlatIP` (cosine via L2-normalized vectors).
  For large datasets, consider IVF/HNSW with a training pass.
* **Reloading**: API loads the **newest** snapshot at startup; use `/admin/reload` to hot-swap.
* **Persistence**: snapshots live under `INDEX_SNAPSHOT_DIR` (mounted volume in Docker).

---

## Captions & Summaries

### Why offline (worker) instead of query-time

Captioning/summary is compute-heavy. We run it **once** per frame/scene and store outputs for fast reads and consistent UX.

### Models

* **BLIP** – `Salesforce/blip-image-captioning-base`

  * Best for bulk, fast captions (short descriptive text)
* **Qwen** – `Qwen/Qwen2.5-VL-3B-Instruct`

  * Richer descriptions or 1–2 line **scene summaries** (slower)

### API inclusion

* `/search` returns `caption` when available (latest by `created_at`, or by preferred `model` if you add that policy).

---

## Schema Notes

Minimum helpful tables (simplified):

```sql
-- datasets
CREATE TABLE datasets (
  id uuid primary key,
  slug text unique not null,
  provider text not null,             -- 'gdrive'
  media_base_uri text                 -- 'gdrive://<ROOT_FOLDER_ID>'
);

-- scenes
CREATE TABLE scenes (
  id uuid primary key,
  dataset_id uuid not null references datasets(id),
  split text,
  start_ts timestamptz,
  end_ts timestamptz,
  location text
);

-- frames
CREATE TABLE frames (
  id uuid primary key,
  scene_id uuid not null references scenes(id),
  index int,
  ts timestamptz,
  modality text,
  title text,
  drive_file_id text,                 -- **critical** for Drive fetch
  relative_path text                  -- optional (debug)
);

-- auto-generated frame captions
CREATE TABLE IF NOT EXISTS auto_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frame_id uuid NOT NULL REFERENCES frames(id),
  model text NOT NULL,                -- 'blip' or 'qwen2.5-vl-3b-instruct'
  text  text NOT NULL,
  score float,                        -- optional
  created_at timestamptz DEFAULT now()
);

-- optional per-scene summaries
CREATE TABLE IF NOT EXISTS scene_summaries (
  scene_id uuid PRIMARY KEY REFERENCES scenes(id),
  model text NOT NULL,
  summary text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

---

## Development Workflow

1. **Add dataset roots**

   * Put media in Drive (nuScenes/KITTI) and share with the service account.
   * Save folder ID in `datasets.media_base_uri` (`gdrive://<FOLDER_ID>`).

2. **Backfill frames**

   * Ensure each frame row has `drive_file_id`.
   * Use a backfill script if you need path→fileId mapping.

3. **Run workers**

   * Send messages to `ingest.frames`.
   * `embed_worker` emits `vectors.new`.
   * `faiss_indexer` writes snapshots.
   * `caption_worker` writes `auto_labels`.

4. **Search**

   * Start API → `GET /search?q=...` (returns captions if present).

5. **Reload**

   * `POST /admin/reload` after new snapshots.

---

## Deployment Guide

Use any container platform: **Render**, **Fly.io**, **GCP Cloud Run**, **Railway**, **ECS/Fargate**.

* **Public**: `api` (expose HTTPS)
* **Private**: `embed_worker`, `caption_worker`, `faiss_indexer`, `redis`
* **Secrets**: store `.env` and `sa.json` in platform secret manager
* **Volumes**: mount a persistent volume for `INDEX_SNAPSHOT_DIR`


---

## Troubleshooting

* **No results / empty search**

  * Check snapshots exist under `search/snapshots/`.
  * Ensure `embed_worker` is producing `vectors.new`.

* **Captions missing**

  * Confirm `caption_worker` is running and has GPU/CPU resources.
  * Verify `auto_labels` rows exist for those `frame_id`s.

* **Drive fetch failures**

  * Make sure the dataset folder is shared with the **service account**.
  * Ensure each frame has a valid `drive_file_id`.

* **Index not updating**

  * Ensure `faiss_indexer` is consuming `vectors.new`.
  * Check Redis groups/consumer IDs; clear stalled pending entries if needed.

* **Slow search**

  * Use cosine/IP with normalized vectors (already).
  * For scale, switch to IVF/HNSW and tune params.

---

### Maintainers

* PRs: include a brief summary and logs/screenshots if you touched workers, FAISS, or captions.
