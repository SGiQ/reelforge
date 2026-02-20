import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from db.database import engine
from db.models import Base
from routes import brands, scripts, render


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables on startup (in production use Alembic migrations)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Ensure render output dir exists
    os.makedirs(settings.RENDER_OUTPUT_DIR, exist_ok=True)

    yield


app = FastAPI(
    title="ReelForge API",
    description="Multi-brand AI reel builder backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(brands.router)
app.include_router(scripts.router)
app.include_router(render.router)

# Serve rendered MP4s locally (for dev; in prod use Vercel Blob URLs)
if os.path.exists(settings.RENDER_OUTPUT_DIR):
    app.mount("/renders", StaticFiles(directory=settings.RENDER_OUTPUT_DIR), name="renders")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ReelForge API"}


@app.get("/")
async def root():
    return {"message": "ReelForge API — visit /docs for interactive docs"}
