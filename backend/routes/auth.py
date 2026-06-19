"""Custom email/password authentication."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from db.database import get_db
from db.models import User
from auth.security import hash_password, verify_password, create_access_token
from auth.clerk import get_current_user_id

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

    class Config:
        from_attributes = True


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
    return AuthResponse(token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return AuthResponse(token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserOut.model_validate(user)
