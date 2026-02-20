from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from db.database import get_db
from db.models import Brand
from auth.clerk import get_current_user_id

router = APIRouter(prefix="/brands", tags=["brands"])


class BrandCreate(BaseModel):
    name: str
    website_url: str | None = None
    logo_url: str | None = None
    watermark_url: str | None = None


class BrandUpdate(BaseModel):
    name: str | None = None
    website_url: str | None = None
    logo_url: str | None = None
    watermark_url: str | None = None


class BrandOut(BaseModel):
    id: str
    clerk_user_id: str
    name: str
    website_url: str | None
    logo_url: str | None
    watermark_url: str | None

    class Config:
        from_attributes = True


@router.get("/me", response_model=BrandOut)
async def get_my_brand(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(select(Brand).where(Brand.clerk_user_id == user_id))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found. Please create one.")
    return brand


@router.post("", response_model=BrandOut, status_code=201)
async def create_brand(
    payload: BrandCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    # Check if brand already exists
    result = await db.execute(select(Brand).where(Brand.clerk_user_id == user_id))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Brand already exists. Use PATCH to update.")

    brand = Brand(clerk_user_id=user_id, **payload.model_dump())
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    return brand


@router.patch("/me", response_model=BrandOut)
async def update_brand(
    payload: BrandUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    result = await db.execute(select(Brand).where(Brand.clerk_user_id == user_id))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found.")

    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(brand, key, value)

    await db.commit()
    await db.refresh(brand)
    return brand
