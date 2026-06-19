from fastapi import HTTPException, Header
from config import settings
from auth.security import decode_token


def _uid_from_auth(authorization: str | None) -> str | None:
    """Decode the Bearer JWT from the Authorization header → user id (sub)."""
    if not authorization:
        return None
    parts = authorization.split()
    token = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else authorization
    payload = decode_token(token)
    return payload.get("sub") if payload else None


async def get_current_user_id(authorization: str = Header(None)) -> str:
    """Return the authenticated user id, or 401 if not signed in."""
    uid = _uid_from_auth(authorization)
    if not uid:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return uid


async def optional_user_id(authorization: str = Header(None)) -> str | None:
    """Return the authenticated user id, or None if not signed in."""
    return _uid_from_auth(authorization)


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
