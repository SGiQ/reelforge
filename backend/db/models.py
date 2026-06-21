import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum, Integer
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from db.database import Base


class JobStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    done = "done"
    failed = "failed"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    # Password reset (one-time token; only the hash is stored).
    reset_token_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    reset_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    clerk_user_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    watermark_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    scripts: Mapped[list["Script"]] = relationship("Script", back_populates="brand", cascade="all, delete-orphan")
    render_jobs: Mapped[list["RenderJob"]] = relationship("RenderJob", back_populates="brand", cascade="all, delete-orphan")


class Script(Base):
    __tablename__ = "scripts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slides: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    brand_id: Mapped[str | None] = mapped_column(String, ForeignKey("brands.id", ondelete="CASCADE"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    brand: Mapped["Brand | None"] = relationship("Brand", back_populates="scripts")
    render_jobs: Mapped[list["RenderJob"]] = relationship("RenderJob", back_populates="script")


class MusicTrack(Base):
    """A royalty-free background track in the shared music library. Tracks are
    uploaded by an admin (stored on Vercel Blob) and can be picked manually in
    the audio step or chosen automatically by the AI Director."""
    __tablename__ = "music_tracks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    mood: Mapped[str] = mapped_column(String(60), default="upbeat")  # upbeat | calm | emotional | cinematic | corporate
    url: Mapped[str] = mapped_column(Text, nullable=False)
    duration: Mapped[float] = mapped_column(default=0.0)
    # Provenance / licensing (stored for attribution; e.g. Jamendo CC tracks).
    artist: Mapped[str | None] = mapped_column(String(200), nullable=True)
    license_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(40), default="upload")  # upload | jamendo
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RenderJob(Base):
    __tablename__ = "render_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    shared: Mapped[bool] = mapped_column(Boolean, default=False)
    shared_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    brand_id: Mapped[str | None] = mapped_column(String, ForeignKey("brands.id", ondelete="SET NULL"), nullable=True)
    script_id: Mapped[str | None] = mapped_column(String, ForeignKey("scripts.id", ondelete="SET NULL"), nullable=True)
    theme: Mapped[str] = mapped_column(String(50), nullable=False, default="dark")
    status: Mapped[JobStatus] = mapped_column(SAEnum(JobStatus), default=JobStatus.pending)
    output_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Inline brand/script snapshot so render works even if brand is deleted
    brand_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    slides_snapshot: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    logo_url_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    watermark_url_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    website_url_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    # New configurations
    watermark_opacity: Mapped[int] = mapped_column(default=18)
    logo_position: Mapped[str] = mapped_column(String(50), default="bottom_center")
    logo_size_snapshot: Mapped[int] = mapped_column(Integer, default=120)
    # Position of the small persistent logo shown on every text slide ("none" = off)
    slide_logo_position: Mapped[str] = mapped_column(String(50), default="none")
    # Size (px in the 270-wide preview space) of that per-slide logo
    slide_logo_size: Mapped[int] = mapped_column(Integer, default=44)
    # Whether to tint video scenes with the theme color overlay
    video_overlay: Mapped[bool] = mapped_column(Boolean, default=False)
    qr_code_url_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    qr_text_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    music_url_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    music_volume_snapshot: Mapped[float] = mapped_column(default=0.15)
    music_start_time_snapshot: Mapped[float] = mapped_column(default=0.0)
    ai_voice_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)
    outro_voiceover_snapshot: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    brand: Mapped["Brand | None"] = relationship("Brand", back_populates="render_jobs")
    script: Mapped["Script | None"] = relationship("Script", back_populates="render_jobs")
