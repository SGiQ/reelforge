from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime, timezone
from db.database import get_db
from db.models import RenderJob, JobStatus
from auth.clerk import get_current_user_id, optional_user_id
from worker.tasks import render_reel_task

router = APIRouter(prefix="/render", tags=["render"])


class RenderCreateRequest(BaseModel):
    brand_name: str
    slides: list[str]
    theme: str = "dark"
    script_title: str = ""
    logo_url: str | None = None
    watermark_url: str | None = None
    website_url: str | None = None
    brand_id: str | None = None
    script_id: str | None = None


class RenderJobOut(BaseModel):
    id: str
    status: str
    output_url: str | None
    theme: str
    brand_name: str | None
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/create", response_model=RenderJobOut, status_code=202)
async def create_render_job(
    payload: RenderCreateRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(optional_user_id),
):
    job = RenderJob(
        theme=payload.theme,
        status=JobStatus.pending,
        brand_name=payload.brand_name,
        slides_snapshot=payload.slides,
        logo_url_snapshot=payload.logo_url,
        watermark_url_snapshot=payload.watermark_url,
        website_url_snapshot=payload.website_url or "https://checkwellcare.com",
        brand_id=payload.brand_id,
        script_id=payload.script_id,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Enqueue Celery task
    render_reel_task.delay(job.id)

    return job


@router.get("/{job_id}/status", response_model=RenderJobOut)
async def get_render_status(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(optional_user_id),
):
    result = await db.execute(select(RenderJob).where(RenderJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Render job not found.")
    return job


@router.get("/{job_id}/download")
async def download_render(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(RenderJob).where(RenderJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Render job not found.")
    if job.status != JobStatus.done or not job.output_url:
        raise HTTPException(status_code=202, detail="Render not yet complete.")
    return {"download_url": job.output_url}
