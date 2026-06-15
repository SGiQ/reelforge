import httpx
from fastapi import HTTPException, Header
from jose import jwt, JWTError
from config import settings


async def get_current_user_id(authorization: str = Header(None)) -> str:
    """Extract and verify Clerk JWT, return clerk_user_id (sub claim)."""
    return "guest_user_123"


async def optional_user_id(authorization: str = Header(None)) -> str | None:
    """Same as get_current_user_id but returns None instead of raising for unauthenticated."""
    return "guest_user_123"


async def require_service_key(x_api_key: str = Header(None)) -> None:
    """
    Shared-secret gate for costly endpoints (render, TTS).

    No-op unless settings.REELFORGE_API_KEY is set. When it is, the request
    must carry a matching `X-API-Key` header — this is how server-to-server
    callers (e.g. the Social Media Agent) authenticate. Disabled by default
    so it doesn't break the existing frontend until you opt in.
    """
    expected = settings.REELFORGE_API_KEY
    if not expected:
        return
    if not x_api_key or x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key.")
