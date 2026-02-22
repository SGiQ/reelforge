import os
import httpx

def put(filename: str, file_data: bytes, options: dict) -> dict:
    """
    Minimal Python implementation for `@vercel/blob` put method.
    """
    token = options.get("token") or os.getenv("BLOB_READ_WRITE_TOKEN")
    if not token:
        raise ValueError("Vercel Blob token is missing.")
        
    access = options.get("access", "public")
    
    url = f"https://blob.vercel-storage.com/{filename}"
    headers = {
        "authorization": f"Bearer {token}",
        "x-api-version": "7",
        "x-access": access
    }
    
    response = httpx.put(url, headers=headers, content=file_data, timeout=60.0)
    response.raise_for_status()
    
    return response.json()
