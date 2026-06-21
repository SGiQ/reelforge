"""Custom email/password authentication."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from datetime import datetime, timezone

from db.database import get_db
from db.models import User
from auth.security import (
    hash_password, verify_password, create_access_token, is_admin_email,
    make_reset_token, hash_reset_token,
)
from auth.clerk import get_current_user_id, require_service_key
from config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    display_name: str | None = None
    is_admin: bool = False

    class Config:
        from_attributes = True


def _user_out(user) -> "UserOut":
    out = UserOut.model_validate(user)
    out.is_admin = is_admin_email(user.email)
    return out


class AuthResponse(BaseModel):
    token: str
    user: UserOut


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower().strip()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An account with that email already exists.")
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        display_name=(payload.display_name or "").strip() or email.split("@")[0],
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return AuthResponse(token=create_access_token(user.id), user=_user_out(user))


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return AuthResponse(token=create_access_token(user.id), user=_user_out(user))


class ForgotRequest(BaseModel):
    email: str


class ResetRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/forgot")
async def forgot_password(payload: ForgotRequest, db: AsyncSession = Depends(get_db), _: None = Depends(require_service_key)):
    """Issue a one-time reset link. Service-key gated (server-to-server / bootstrap);
    admins issue links for users via /admin/users/{id}/reset-link instead."""
    email = payload.email.lower().strip()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="No account with that email.")
    token, token_hash, expires = make_reset_token()
    user.reset_token_hash = token_hash
    user.reset_expires_at = expires
    await db.commit()
    return {"reset_url": f"{settings.FRONTEND_URL}/reset?token={token}", "expires_in_minutes": 60}


@router.post("/reset", response_model=AuthResponse)
async def reset_password(payload: ResetRequest, db: AsyncSession = Depends(get_db)):
    """Set a new password using a one-time reset token, then sign the user in."""
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    token_hash = hash_reset_token(payload.token.strip())
    user = (await db.execute(select(User).where(User.reset_token_hash == token_hash))).scalar_one_or_none()
    if not user or not user.reset_expires_at or user.reset_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    user.password_hash = hash_password(payload.new_password)
    user.reset_token_hash = None
    user.reset_expires_at = None
    await db.commit()
    await db.refresh(user)
    return AuthResponse(token=create_access_token(user.id), user=_user_out(user))


@router.post("/change-password")
async def change_password(payload: ChangePasswordRequest, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user or not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    user.password_hash = hash_password(payload.new_password)
    await db.commit()
    return {"ok": True}


@router.get("/me", response_model=UserOut)
async def me(db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return _user_out(user)
