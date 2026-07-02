"""Community feed — reels users have chosen to share."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime

from db.database import get_db
from db.models import RenderJob, User
from auth.clerk import get_current_user_id

router = APIRouter(prefix="/community", tags=["community"])


class CommunityReel(BaseModel):
    id: str
    brand_name: str | None
    theme: str
    output_url: str | None
    shared_at: datetime | None
    shared_by: str | None  # display name of the user who shared it


class FeaturedReel(BaseModel):
    output_url: str | None = None
    brand_name: str | None = None
    theme: str | None = None


@router.get("/featured", response_model=FeaturedReel)
async def featured_reel(db: AsyncSession = Depends(get_db)):
    """Most recently shared reel — PUBLIC (no auth) so the marketing landing can
    feature a real community reel as its hero. Returns nulls if none shared yet."""
    result = await db.execute(
        select(RenderJob)
        .where(RenderJob.shared == True, RenderJob.status == "done", RenderJob.output_url.isnot(None))  # noqa: E712
        .order_by(RenderJob.shared_at.desc())
        .limit(1)
    )
    job = result.scalar_one_or_none()
    if not job:
        return FeaturedReel()
    return FeaturedReel(output_url=job.output_url, brand_name=job.brand_name, theme=job.theme)


@router.get("", response_model=list[CommunityReel])
async def community_feed(db: AsyncSession = Depends(get_db), _: str = Depends(get_current_user_id)):
    """All shared, completed reels — visible to any signed-in user, with attribution."""
    result = await db.execute(
        select(RenderJob, User.display_name, User.email)
        .join(User, User.id == RenderJob.owner_id, isouter=True)
        .where(RenderJob.shared == True, RenderJob.status == "done")  # noqa: E712
        .order_by(RenderJob.shared_at.desc())
        .limit(100)
    )
    feed = []
    for job, display_name, email in result.all():
        feed.append(CommunityReel(
            id=job.id,
            brand_name=job.brand_name,
            theme=job.theme,
            output_url=job.output_url,
            shared_at=job.shared_at,
            shared_by=display_name or (email.split("@")[0] if email else None) or "Someone",
        ))
    return feed
