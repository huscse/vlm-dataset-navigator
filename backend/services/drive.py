from __future__ import annotations
from pathlib import Path, PurePosixPath
from functools import lru_cache
from typing import Optional, List, Dict
import os
import time
import ssl
import asyncio
import json
import base64
import tempfile
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# Handle credentials from environment variable (base64 encoded) or file
_env_key_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
_env_key_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")

if _env_key_json:
    # Decode base64 and write to temp file
    try:
        key_data = base64.b64decode(_env_key_json)
        tmp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json')
        tmp_file.write(key_data.decode('utf-8'))
        tmp_file.close()
        KEY_PATH = Path(tmp_file.name)
    except Exception as e:
        raise RuntimeError(f"Failed to decode GOOGLE_APPLICATION_CREDENTIALS_JSON: {e}")
elif _env_key_path:
    KEY_PATH = Path(_env_key_path).expanduser().resolve()
else:
    KEY_PATH = (Path(__file__).resolve().parents[1] / "secrets" / "drive-key.json")

if not KEY_PATH.exists():
    raise FileNotFoundError(
        f"Google Drive key not found at: {KEY_PATH}\n"
        "Place your service account JSON at backend/secrets/drive-key.json, "
        "set GOOGLE_APPLICATION_CREDENTIALS to a file path, "
        "or set GOOGLE_APPLICATION_CREDENTIALS_JSON to base64 encoded JSON."
    )

@lru_cache(maxsize=1)
def _get_service():
    """Build and cache the Google Drive service."""
    creds = service_account.Credentials.from_service_account_file(
        str(KEY_PATH), scopes=SCOPES
    )
    return build("drive", "v3", credentials=creds)

def list_files(folder_id: str, query: Optional[str] = None) -> List[Dict]:
    """List files in a Google Drive folder."""
    service = _get_service()
    
    q = f"'{folder_id}' in parents and trashed=false"
    if query:
        q += f" and {query}"
    
    results = service.files().list(
        q=q,
        fields="files(id, name, mimeType, parents)",
        pageSize=1000
    ).execute()
    
    return results.get("files", [])

def resolve_path(root_folder_id: str, path: str) -> Optional[str]:
    """
    Resolve a path like 'Residential/2011_09_26/...' to a file ID.
    Returns the file ID or None if not found.
    """
    parts = PurePosixPath(path).parts
    current_id = root_folder_id
    
    for part in parts:
        files = list_files(current_id, query=f"name='{part}'")
        if not files:
            return None
        current_id = files[0]["id"]
    
    return current_id

def download_bytes(file_id: str) -> bytes:
    """Download a file's content as bytes."""
    service = _get_service()
    
    try:
        request = service.files().get_media(fileId=file_id)
        content = request.execute()
        return content
    except HttpError as e:
        raise RuntimeError(f"Failed to download file {file_id}: {e}")
