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


class RenderJob(Base):
    __tablename__ = "render_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
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
    # New configurations
    watermark_opacity: Mapped[int] = mapped_column(default=18)
    logo_position: Mapped[str] = mapped_column(String(50), default="bottom_center")
    logo_size_snapshot: Mapped[int] = mapped_column(Integer, default=120)
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
