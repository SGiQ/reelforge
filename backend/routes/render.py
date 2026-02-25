"""
Render routes — uses FastAPI BackgroundTasks for async rendering.
No Celery/Redis dependency. Renders run directly in the API process.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from pathlib import Path
import os
import vercel_blob

from db.database import get_db
from db.models import RenderJob, JobStatus
from auth.clerk import optional_user_id
from config import settings

router = APIRouter(prefix="/render", tags=["render"])


# ── Pydantic models ─────────────────────────────────────────────────────────

class Slide(BaseModel):
    text: str
    font_size: int = Field(88, alias="fontSize")
    text_color: str = Field("", alias="textColor")  # empty = theme default
    font_family: str = Field("DejaVuSans-Bold.ttf", alias="fontFamily")
    transition: str = "fade"

    class Config:
        populate_by_name = True


class RenderCreateRequest(BaseModel):
    brand_name: str
    slides: list[Slide | str]
    theme: str = "dark"
    script_title: str = ""
    logo_url: str | None = None
    watermark_url: str | None = None
    website_url: str | None = None
    brand_id: str | None = None
    script_id: str | None = None
    watermark_opacity: int = 18
    logo_position: str = "bottom_center"
    qr_code_url: str | None = None
    music_url: str | None = None
    music_volume: float = 0.15
    music_start_time: float = 0.0
    ai_voice_id: str | None = None
    logo_size: int = 120
    qr_text: str = ""
    outro_voiceover: str | None = None


class RenderJobOut(BaseModel):
    id: str
    status: str
    output_url: str | None
    theme: str
    brand_name: str | None
    created_at: datetime
    # Snapshot fields for re-editing reels
    slides_snapshot: list | None = None
    logo_url_snapshot: str | None = None
    watermark_url_snapshot: str | None = None
    website_url_snapshot: str | None = None
    watermark_opacity: int = 18
    logo_position: str = "bottom_center"
    logo_size_snapshot: int = 120
    qr_code_url_snapshot: str | None = None
    qr_text_snapshot: str | None = None
    music_url_snapshot: str | None = None
    music_volume_snapshot: float = 0.15
    music_start_time_snapshot: float = 0.0
    ai_voice_snapshot: str | None = None
    outro_voiceover_snapshot: str | None = None

    class Config:
        from_attributes = True



def safe_delete(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception as e:
        print(f"Cleanup failed for {path}: {e}")

# ── Background render function (runs in threadpool) ──────────────────────────

def _run_render_sync(job_id: str):
    """Synchronous render called from a background thread via BackgroundTasks."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from video.renderer import RenderEngine

    sync_engine = create_engine(
        settings.get_database_url.replace("+asyncpg", "+psycopg"),
        pool_pre_ping=True,
    )
    Session = sessionmaker(bind=sync_engine)

    with Session() as session:
        job = session.execute(
            select(RenderJob).where(RenderJob.id == job_id)
        ).scalar_one_or_none()
        if not job:
            return

        job.status = JobStatus.processing
        session.commit()

        try:
            engine = RenderEngine()
            output_path = engine.render(
                job_id=job_id,
                slides=job.slides_snapshot or [],
                theme=job.theme,
                brand_name=job.brand_name or "Brand",
                logo_url=job.logo_url_snapshot,
                watermark_url=job.watermark_url_snapshot,
                website_url=job.website_url_snapshot or settings.QR_DEFAULT_URL,
                watermark_opacity=job.watermark_opacity,
                logo_position=job.logo_position,
                logo_size=job.logo_size_snapshot,
                qr_code_url=job.qr_code_url_snapshot,
                qr_text=job.qr_text_snapshot or "",
                music_url=job.music_url_snapshot,
                music_volume=job.music_volume_snapshot,
                music_start_time=job.music_start_time_snapshot,
                ai_voice_id=job.ai_voice_snapshot,
                outro_voiceover=job.outro_voiceover_snapshot,
            )

            # Upload to Vercel Blob
            with open(output_path, "rb") as f:
                blob_data = f.read()
            
            blob_result = vercel_blob.put(
                f"renders/{job_id}.mp4",
                blob_data,
                options={"access": "public", "token": os.getenv("BLOB_READ_WRITE_TOKEN")}
            )
            
            job.status = JobStatus.done
            job.output_url = blob_result.get("url")
            job.completed_at = datetime.now(timezone.utc)
            session.commit()
            
            # Cleanup local file to prevent disk fill up
            safe_delete(output_path)

        except Exception as exc:
            job.status = JobStatus.failed
            job.error_message = str(exc)
            session.commit()
            raise


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/create", response_model=RenderJobOut, status_code=202)
async def create_render_job(
    payload: RenderCreateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(optional_user_id),
):
    processed_slides = []
    for s in payload.slides:
        if isinstance(s, str):
            processed_slides.append({
                "text": s,
                "font_size": 88,
                "text_color": "",  # empty = use theme default in renderer
                "font_family": "DejaVuSans-Bold.ttf",
                "transition": "fade",
            })
        else:
            processed_slides.append(s.model_dump())

    if len(processed_slides) > 15:
        raise HTTPException(status_code=400, detail="Maximum limit of 15 slides exceeded.")
    if any(len(s["text"]) > 150 for s in processed_slides):
        raise HTTPException(status_code=400, detail="One or more slides exceeds the 150 character limit.")

    job = RenderJob(
        theme=payload.theme,
        status=JobStatus.pending,
        brand_name=payload.brand_name,
        slides_snapshot=processed_slides,
        logo_url_snapshot=payload.logo_url,
        watermark_url_snapshot=payload.watermark_url,
        website_url_snapshot=payload.website_url or "https://checkwellcare.com",
        watermark_opacity=payload.watermark_opacity,
        logo_position=payload.logo_position,
        logo_size_snapshot=payload.logo_size,
        qr_code_url_snapshot=payload.qr_code_url,
        qr_text_snapshot=payload.qr_text,
        music_url_snapshot=payload.music_url,
        music_volume_snapshot=payload.music_volume,
        music_start_time_snapshot=payload.music_start_time,
        ai_voice_snapshot=payload.ai_voice_id,
        outro_voiceover_snapshot=payload.outro_voiceover,
        brand_id=payload.brand_id,
        script_id=payload.script_id,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Schedule render in a background thread — no Redis/Celery needed
    background_tasks.add_task(_run_render_sync, job.id)

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


@router.get("/history", response_model=list[RenderJobOut])
async def get_render_history(
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(optional_user_id),
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    from db.models import Brand
    brand_result = await db.execute(select(Brand).where(Brand.clerk_user_id == user_id))
    brand = brand_result.scalar_one_or_none()
    
    if not brand:
        # Fallback: return recent renders if no brand exists (e.g. mock auth)
        jobs_result = await db.execute(
            select(RenderJob).order_by(RenderJob.created_at.desc()).limit(50)
        )
        return jobs_result.scalars().all()

    jobs_result = await db.execute(
        select(RenderJob)
        .where(RenderJob.brand_id == brand.id)
        .order_by(RenderJob.created_at.desc())
    )
    return jobs_result.scalars().all()


@router.get("/frame-data/{job_id}")
async def get_render_frame_data(job_id: str):
    """
    Serve the render job JSON written by the renderer to /tmp.
    The render-slide Next.js page fetches this before Playwright screenshots it.
    This endpoint is needed in production because Railway (Python) and Vercel (Next.js)
    do NOT share a filesystem — so the Next.js /api route can't read Railway's /tmp files.
    """
    import json as _json
    import tempfile as _tf
    from pathlib import Path as _Path
    from fastapi.responses import JSONResponse

    frame_data_path = _Path(_tf.gettempdir()) / "reelforge_frames" / f"{job_id}.json"
    if not frame_data_path.exists():
        raise HTTPException(status_code=404, detail="Frame data not found")

    try:
        data = _json.loads(frame_data_path.read_text())
        return JSONResponse(
            content=data,
            headers={"Cache-Control": "no-store", "Access-Control-Allow-Origin": "*"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to read frame data: {exc}")


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
