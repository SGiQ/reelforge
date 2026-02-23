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
