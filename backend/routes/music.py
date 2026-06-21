"""Shared music library — royalty-free background tracks.

Anyone can list tracks (to pick in the audio step or for the AI Director).
Only admins can add or remove tracks. Audio files are uploaded to Vercel Blob
by the client; this stores the resulting URL + metadata.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime

from db.database import get_db
from db.models import MusicTrack
from routes.admin import require_admin

router = APIRouter(prefix="/music", tags=["music"])

MOODS = {"upbeat", "calm", "emotional", "cinematic", "corporate"}


class TrackOut(BaseModel):
    id: str
    title: str
    mood: str
    url: str
    duration: float
    created_at: datetime

    class Config:
        from_attributes = True


class TrackCreate(BaseModel):
    title: str
    mood: str = "upbeat"
    url: str
    duration: float = 0.0


@router.get("", response_model=list[TrackOut])
async def list_tracks(db: AsyncSession = Depends(get_db)):
    rows = await db.execute(select(MusicTrack).order_by(MusicTrack.created_at.desc()))
    return rows.scalars().all()


@router.post("", response_model=TrackOut, status_code=201)
async def add_track(payload: TrackCreate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    if not payload.title.strip() or not payload.url.strip():
        raise HTTPException(status_code=400, detail="Title and url are required.")
    track = MusicTrack(
        title=payload.title.strip(),
        mood=payload.mood if payload.mood in MOODS else "upbeat",
        url=payload.url.strip(),
        duration=payload.duration or 0.0,
    )
    db.add(track)
    await db.commit()
    await db.refresh(track)
    return track


@router.delete("/{track_id}")
async def delete_track(track_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    track = (await db.execute(select(MusicTrack).where(MusicTrack.id == track_id))).scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found.")
    await db.delete(track)
    await db.commit()
    return {"ok": True}
