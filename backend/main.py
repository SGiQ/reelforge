import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from db.database import engine
from db.models import Base
from routes import brands, scripts, render, tts, webhooks


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables on startup (in production use Alembic migrations)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Ensure Playwright Chromium is installed — this runs inside the process
    # where PLAYWRIGHT_BROWSERS_PATH is correctly set by Railway at runtime.
    # nixpacks build cmds don't inherit [variables] env vars, so we install here.
    browsers_path = os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "")
    sentinel = os.path.join(browsers_path, ".installed") if browsers_path else None
    if browsers_path and not os.path.exists(sentinel):
        import subprocess as _sp
        print(f"[startup] Installing Playwright Chromium to {browsers_path}...")
        result = _sp.run(
            ["python", "-m", "playwright", "install", "chromium", "--with-deps"],
            capture_output=True, text=True
        )
        print(result.stdout[-2000:] if result.stdout else "(no stdout)")
        if result.returncode == 0:
            open(sentinel, "w").close()
            print("[startup] Playwright Chromium installed successfully.")
        else:
            print(f"[startup] Playwright install failed:\n{result.stderr[-2000:]}")

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
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(brands.router)
app.include_router(scripts.router)
app.include_router(render.router)
app.include_router(tts.router)
app.include_router(webhooks.router)

# Serve rendered MP4s locally (for dev; in prod use Vercel Blob URLs)
os.makedirs(settings.RENDER_OUTPUT_DIR, exist_ok=True)
app.mount("/renders", StaticFiles(directory=settings.RENDER_OUTPUT_DIR), name="renders")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ReelForge API"}


@app.get("/")
async def root():
    return {"message": "ReelForge API — visit /docs for interactive docs"}
