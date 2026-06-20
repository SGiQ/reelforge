"""Admin-only moderation: all reels, community moderation, user management.

Admin access is granted by email allowlist (settings.ADMIN_EMAILS / ADMIN_EMAILS env).
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from datetime import datetime

from db.database import get_db
from db.models import RenderJob, User
from auth.clerk import _uid_from_auth
from auth.security import is_admin_email

router = APIRouter(prefix="/admin", tags=["admin"])


async def require_admin(authorization: str = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    uid = _uid_from_auth(authorization)
    if not uid:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = (await db.execute(select(User).where(User.id == uid))).scalar_one_or_none()
    if not user or not is_admin_email(user.email):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class AdminReel(BaseModel):
    id: str
    brand_name: str | None
    theme: str
    status: str
    output_url: str | None
    shared: bool
    created_at: datetime
    owner_email: str | None
    owner_name: str | None


class AdminUser(BaseModel):
    id: str
    email: str
    display_name: str | None
    created_at: datetime
    reel_count: int
    is_admin: bool


@router.get("/reels", response_model=list[AdminReel])
async def all_reels(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    rows = await db.execute(
        select(RenderJob, User.email, User.display_name)
        .join(User, User.id == RenderJob.owner_id, isouter=True)
        .order_by(RenderJob.created_at.desc())
        .limit(300)
    )
    out = []
    for job, email, name in rows.all():
        out.append(AdminReel(
            id=job.id, brand_name=job.brand_name, theme=job.theme, status=str(job.status.value if hasattr(job.status, "value") else job.status),
            output_url=job.output_url, shared=bool(job.shared), created_at=job.created_at,
            owner_email=email, owner_name=name,
        ))
    return out


@router.post("/reels/{job_id}/unshare")
async def unshare_reel(job_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    job = (await db.execute(select(RenderJob).where(RenderJob.id == job_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Reel not found")
    job.shared = False
    await db.commit()
    return {"ok": True}


@router.delete("/reels/{job_id}")
async def delete_reel(job_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    job = (await db.execute(select(RenderJob).where(RenderJob.id == job_id))).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Reel not found")
    await db.delete(job)
    await db.commit()
    return {"ok": True}


@router.get("/users", response_model=list[AdminUser])
async def all_users(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    users = (await db.execute(select(User).order_by(User.created_at.desc()))).scalars().all()
    # reel counts per owner
    counts = dict((await db.execute(
        select(RenderJob.owner_id, func.count(RenderJob.id)).group_by(RenderJob.owner_id)
    )).all())
    return [
        AdminUser(
            id=u.id, email=u.email, display_name=u.display_name, created_at=u.created_at,
            reel_count=int(counts.get(u.id, 0)), is_admin=is_admin_email(u.email),
        )
        for u in users
    ]


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You can't delete your own account here.")
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if is_admin_email(user.email):
        raise HTTPException(status_code=400, detail="Can't delete another admin.")
    # Remove their reels from the community feed (leave the reel rows intact).
    await db.execute(
        RenderJob.__table__.update().where(RenderJob.owner_id == user_id).values(shared=False)
    )
    await db.delete(user)
    await db.commit()
    return {"ok": True}
