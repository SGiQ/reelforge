"""Shared music library — royalty-free background tracks.

Anyone can list tracks (to pick in the audio step or for the AI Director).
Only admins can add or remove tracks. Audio files are uploaded to Vercel Blob
by the client; this stores the resulting URL + metadata.
"""
import os
import uuid
import httpx
import vercel_blob
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime

from db.database import get_db
from db.models import MusicTrack
from routes.admin import require_admin
from config import settings

router = APIRouter(prefix="/music", tags=["music"])

MOODS = {"upbeat", "calm", "emotional", "cinematic", "corporate"}
# Map our moods to Jamendo fuzzy tags for nicer search results.
JAMENDO_TAGS = {
    "upbeat": "happy upbeat energetic",
    "calm": "calm relaxing ambient",
    "emotional": "emotional sad piano",
    "cinematic": "cinematic epic film",
    "corporate": "corporate motivational inspiring",
}


class TrackOut(BaseModel):
    id: str
    title: str
    mood: str
    url: str
    duration: float
    artist: str | None = None
    license_url: str | None = None
    source: str = "upload"
    created_at: datetime

    class Config:
        from_attributes = True


class TrackCreate(BaseModel):
    title: str
    mood: str = "upbeat"
    url: str
    duration: float = 0.0
    artist: str | None = None
    license_url: str | None = None
    source: str = "upload"


class JamendoImport(BaseModel):
    title: str
    artist: str | None = None
    license_url: str | None = None
    mood: str = "upbeat"
    duration: float = 0.0
    source_url: str  # the Jamendo audio URL to download + re-host


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
        artist=payload.artist,
        license_url=payload.license_url,
        source=payload.source or "upload",
    )
    db.add(track)
    await db.commit()
    await db.refresh(track)
    return track


@router.get("/jamendo")
async def jamendo_search(query: str = "", mood: str = "", _=Depends(require_admin)):
    """Search Jamendo for royalty-free tracks. Filters out non-commercial (NC)
    licenses and prefers instrumental tracks (better as backing music)."""
    cid = settings.JAMENDO_CLIENT_ID
    if not cid:
        raise HTTPException(status_code=503, detail="Jamendo isn't configured — set JAMENDO_CLIENT_ID.")
    params = {
        "client_id": cid,
        "format": "json",
        "limit": "24",
        "audioformat": "mp32",
        "include": "musicinfo licenses",
        "vocalinstrumental": "instrumental",
        "order": "popularity_total",
        "fuzzytags": JAMENDO_TAGS.get(mood, "") or query or "background",
    }
    if query:
        params["search"] = query
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.get("https://api.jamendo.com/v3.0/tracks/", params=params)
        r.raise_for_status()
        results = r.json().get("results", [])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Jamendo search failed: {e}")

    candidates = []
    for t in results:
        lic = (t.get("license_ccurl") or "").lower()
        if "-nc" in lic or "/nc" in lic:  # skip non-commercial licenses
            continue
        audio = t.get("audiodownload") if t.get("audiodownload_allowed") else t.get("audio")
        if not audio:
            continue
        candidates.append({
            "jamendo_id": t.get("id"),
            "title": t.get("name") or "Untitled",
            "artist": t.get("artist_name") or "Unknown",
            "duration": float(t.get("duration") or 0),
            "license_url": t.get("license_ccurl"),
            "image": t.get("image") or t.get("album_image"),
            "audio": audio,
        })
    return {"candidates": candidates}


@router.post("/import", response_model=TrackOut, status_code=201)
async def import_jamendo(payload: JamendoImport, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    """Download a Jamendo track once and re-host it on Blob, so renders never
    depend on Jamendo's hotlink rules or uptime."""
    token = os.getenv("BLOB_READ_WRITE_TOKEN") or settings.BLOB_READ_WRITE_TOKEN
    if not token:
        raise HTTPException(status_code=503, detail="Blob storage isn't configured.")
    try:
        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            resp = await client.get(payload.source_url, headers={"User-Agent": "Mozilla/5.0 (compatible; ReelSGiQ/1.0)"})
        resp.raise_for_status()
        data = resp.content
        if not data:
            raise RuntimeError("empty download")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not download the track: {e}")

    try:
        blob = vercel_blob.put(f"music/{uuid.uuid4()}.mp3", data, options={"access": "public", "token": token})
        blob_url = blob.get("url")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not store the track: {e}")

    track = MusicTrack(
        title=payload.title.strip() or "Imported track",
        mood=payload.mood if payload.mood in MOODS else "upbeat",
        url=blob_url,
        duration=payload.duration or 0.0,
        artist=payload.artist,
        license_url=payload.license_url,
        source="jamendo",
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
