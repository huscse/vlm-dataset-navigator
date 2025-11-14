from __future__ import annotations
from pathlib import Path, PurePosixPath
from functools import lru_cache
from typing import Optional, List, Dict
import os
import time
import ssl
import asyncio

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# Prefer env var; otherwise use backend/secrets/drive-key.json
_env_key = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
if _env_key:
    KEY_PATH = Path(_env_key).expanduser().resolve()
else:
    KEY_PATH = (Path(__file__).resolve().parents[1] / "secrets" / "drive-key.json")

if not KEY_PATH.exists():
    raise FileNotFoundError(
        f"Google Drive key not found at: {KEY_PATH}\n"
        "Place your service account JSON at backend/secrets/drive-key.json "
        "or set GOOGLE_APPLICATION_CREDENTIALS to an absolute path."
    )

# Global rate limiter - max 10 concurrent downloads
_download_semaphore = None

def _get_semaphore():
    global _download_semaphore
    if _download_semaphore is None:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        _download_semaphore = asyncio.Semaphore(10)  # Max 10 concurrent
    return _download_semaphore

def _escape(name: str) -> str:
    # Escape single quotes in Drive name filters
    return name.replace("'", r"\'")

@lru_cache(maxsize=1)
def _drive():
    creds = service_account.Credentials.from_service_account_file(str(KEY_PATH), scopes=SCOPES)
    # cache_discovery=False avoids writing discovery cache files locally
    return build("drive", "v3", credentials=creds, cache_discovery=False)

def _list_children(parent_id: str) -> List[Dict]:
    return _drive().files().list(
        q=f"'{parent_id}' in parents and trashed=false",
        fields="files(id,name,mimeType)"
    ).execute().get("files", [])

@lru_cache(maxsize=1000)  # Cache up to 1000 path lookups
def _find_child_id(parent_id: str, name: str) -> Optional[str]:
    """Find a child file/folder by name. Cached to avoid repeated API calls."""
    files = _drive().files().list(
        q=f"'{parent_id}' in parents and name = '{_escape(name)}' and trashed=false",
        fields="files(id,name,mimeType)",
        pageSize=5,
    ).execute().get("files", [])
    return files[0]["id"] if files else None

@lru_cache(maxsize=500)  # Cache up to 500 full path resolutions
def resolve_path(root_id: str, rel_path: str) -> Optional[str]:
    """
    Walk Drive from root_id and return the fileId for rel_path.
    Works for both folders and files. Returns None if any segment is missing.
    Cached to avoid repeated API calls for the same paths.
    """
    print(f"[CACHE MISS] Resolving path: {rel_path}")
    node = root_id
    for seg in PurePosixPath(rel_path).parts:
        cid = _find_child_id(node, seg)
        if not cid:
            return None
        node = cid
    return node

def download_bytes(file_id: str, max_retries: int = 3) -> bytes:
    """
    Download file bytes from Google Drive with retry logic and rate limiting.
    
    Args:
        file_id: Google Drive file ID
        max_retries: Maximum number of retry attempts (default: 3)
    
    Returns:
        File contents as bytes
    
    Raises:
        RuntimeError: If download fails after all retries
    """
    from googleapiclient.http import MediaIoBaseDownload
    import io

    for attempt in range(max_retries):
        try:
            request = _drive().files().get_media(fileId=file_id)
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            
            # Add small delay between chunks to avoid overwhelming Drive API
            while not done:
                _, done = downloader.next_chunk()
                if not done:
                    time.sleep(0.1)  # 100ms between chunks
            
            fh.seek(0)
            return fh.read()
            
        except (ssl.SSLError, ConnectionError, ConnectionResetError, TimeoutError) as e:
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 0.5  # 0.5s, 1s, 2s
                print(f"[RETRY] Connection error on attempt {attempt + 1}/{max_retries}, "
                      f"retrying in {wait_time}s... Error: {type(e).__name__}")
                time.sleep(wait_time)
            else:
                print(f"[ERROR] Failed after {max_retries} attempts: {e}")
                raise RuntimeError(
                    f"Drive download failed after {max_retries} attempts due to connection issues. "
                    f"file_id={file_id}, error={e}"
                ) from e
                
        except HttpError as e:
            # Don't retry HttpErrors (permissions, not found, rate limits)
            if e.resp.status == 403 or e.resp.status == 429:
                # Rate limited - wait longer
                wait_time = 2 ** attempt
                print(f"[RATE LIMIT] Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
                if attempt < max_retries - 1:
                    continue
            raise RuntimeError(
                "Drive download failed. Make sure the service account has Viewer access "
                f"to the folder/file. file_id={file_id}, error={e}"
            ) from e
        
        except Exception as e:
            print(f"[ERROR] Unexpected error downloading file_id={file_id}: {e}")
            raise RuntimeError(
                f"Unexpected error during Drive download. file_id={file_id}, error={e}"
            ) from e
    
    # Should never reach here, but just in case
    raise RuntimeError(f"Download failed for unknown reason. file_id={file_id}")