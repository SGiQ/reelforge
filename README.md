# ReelForge

Multi-brand AI reel builder SaaS — create stunning 1080×1920 MP4 reels for your brand in minutes.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router + Tailwind CSS |
| Auth | Clerk |
| Payments | Stripe |
| Storage | Vercel Blob |
| Backend | FastAPI + Python |
| Database | PostgreSQL (Railway) |
| Queue | Redis + Celery (Railway) |
| Video | FFmpeg + Pillow |

## Project Structure

```
ReelForge/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── brand-setup/          # Step 1: Upload logo + watermark
│   │   ├── script-picker/        # Step 2: Choose script
│   │   ├── theme-selector/       # Step 3: Choose color theme
│   │   ├── preview/              # Step 4: Animated reel preview
│   │   ├── export/               # Step 5: Render + download MP4
│   │   ├── sign-in/              # Clerk auth
│   │   └── sign-up/
│   ├── components/
│   │   ├── Navbar.tsx            # Sticky nav with step progress
│   │   ├── ReelPreview.tsx       # Browser-animated reel preview
│   │   ├── ScriptCard.tsx        # Script selection card
│   │   ├── ThemeCard.tsx         # Color theme card
│   │   └── UploadZone.tsx        # Drag-and-drop uploader
│   └── lib/
│       ├── api.ts                # FastAPI client
│       └── blob.ts               # Vercel Blob helpers
└── backend/
    ├── main.py                   # FastAPI app
    ├── config.py                 # Pydantic settings
    ├── auth/clerk.py             # JWT verification
    ├── db/
    │   ├── database.py           # Async SQLAlchemy
    │   └── models.py             # Brand, Script, RenderJob
    ├── routes/
    │   ├── brands.py             # /brands CRUD
    │   ├── scripts.py            # /scripts/defaults
    │   └── render.py             # /render/create, /status, /download
    ├── worker/
    │   ├── celery_app.py         # Celery + Redis
    │   └── tasks.py              # render_reel_task
    └── video/
        └── renderer.py           # Pillow + FFmpeg pipeline
```

## Quick Start

### 1. Version Control & Databases
1. Create a repository on your GitHub account and push this local repo:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/reelforge.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [Railway.app](https://railway.app) and create a new project.
3. Add two databases to your Railway project:
   - **PostgreSQL**
   - **Redis**
4. Copy their connection URLs and place them in `backend/.env`.

### Frontend
```bash
# 1. Copy env template
cp .env.local.example .env.local
# 2. Fill in CLERK, STRIPE, BLOB keys
# 3. Run dev server
npm run dev
# Visit http://localhost:3000
```

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Copy env template
cp .env.example .env
# Fill in DATABASE_URL, REDIS_URL, CLERK keys

# Run API
uvicorn main:app --reload --port 8000

# Run Celery worker (separate terminal)
celery -A worker.celery_app worker --loglevel=info
```

## Default Scripts

1. **"Someone Should Check"** — 5 slides, caregiver emotion angle
2. **"You Can't Be Everywhere"** — 5 slides, WellCare brand focus  
3. **"Break the Worry Cycle"** — 5 slides, relief/peace angle

## Color Themes

| Theme | Overlay | Text |
|---|---|---|
| Dark Professional | Navy `#1a1a2e` | White |
| Clean Light | Off-white `#f8f8f8` | Charcoal |
| Sky Blue | Azure `#0ea5e9` | White |
| Warm Gold | Amber `#d97706` | Dark |

## Reel Format

- Resolution: 1080 × 1920 (9:16)
- FPS: 30
- Codec: H.264 / MP4
- Slide duration: ~2.8s each with 0.5s fade in/out
- Watermark photo: 18% opacity behind text
- Final slide: brand logo + QR code (encodes website URL)

## Environment Variables

See `.env.local.example` (frontend) and `backend/.env.example` for all required keys.
