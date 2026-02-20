import httpx
from fastapi import HTTPException, Header
from jose import jwt, JWTError
from config import settings


async def get_current_user_id(authorization: str = Header(None)) -> str:
    """Extract and verify Clerk JWT, return clerk_user_id (sub claim)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")

    token = authorization.removeprefix("Bearer ")

    try:
        # Decode header to get kid
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise HTTPException(status_code=401, detail="Invalid token header")

        # Fetch Clerk JWKS
        issuer = settings.CLERK_JWT_ISSUER or f"https://clerk.{settings.CLERK_SECRET_KEY.split('_')[2] if settings.CLERK_SECRET_KEY else 'example'}.com"
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{issuer}/.well-known/jwks.json")
            jwks = resp.json()

        # Find matching key
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if not key:
            raise HTTPException(status_code=401, detail="Unknown signing key")

        payload = jwt.decode(token, key, algorithms=["RS256"], options={"verify_aud": False})
        user_id: str = payload.get("sub", "")
        if not user_id:
            raise HTTPException(status_code=401, detail="No user ID in token")

        return user_id

    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


async def optional_user_id(authorization: str = Header(None)) -> str | None:
    """Same as get_current_user_id but returns None instead of raising for unauthenticated."""
    if not authorization:
        return None
    try:
        return await get_current_user_id(authorization=authorization)
    except HTTPException:
        return None
