"""
Celery task: render_reel_task
Runs inside Railway worker container with FFmpeg installed.
"""
import os
import subprocess
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker, Session

from config import settings
from db.models import RenderJob, JobStatus
from worker.celery_app import celery_app
from video.renderer import RenderEngine

# Use synchronous engine for Celery worker
sync_engine = create_engine(
    settings.DATABASE_URL.replace("+asyncpg", "+psycopg2"),
    pool_pre_ping=True,
)
SyncSession = sessionmaker(bind=sync_engine)


def _get_job(session: Session, job_id: str) -> RenderJob | None:
    return session.execute(select(RenderJob).where(RenderJob.id == job_id)).scalar_one_or_none()


@celery_app.task(bind=True, name="render_reel", max_retries=2, default_retry_delay=10)
def render_reel_task(self, job_id: str):
    with SyncSession() as session:
        job = _get_job(session, job_id)
        if not job:
            return {"error": "Job not found"}

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
            )

            # For production: upload to Vercel Blob and get URL
            # For now: serve from local path or a file:// URL
            output_url = f"/renders/{Path(output_path).name}"

            job.status = JobStatus.done
            job.output_url = output_url
            job.completed_at = datetime.now(timezone.utc)
            session.commit()

            return {"status": "done", "output_url": output_url}

        except Exception as exc:
            job.status = JobStatus.failed
            job.error_message = str(exc)
            session.commit()
            raise self.retry(exc=exc)
