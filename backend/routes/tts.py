"""
TTS preview endpoint — generates a short ElevenLabs audio clip for the preview player.
Returns MP3 audio bytes directly so the browser can play them.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from elevenlabs import ElevenLabs
from config import settings
import io

router = APIRouter(prefix="/tts", tags=["tts"])

DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # Sarah — fallback if none selected


class TTSPreviewRequest(BaseModel):
    text: str
    voice_id: str = DEFAULT_VOICE_ID


@router.post("/preview")
async def tts_preview(payload: TTSPreviewRequest):
    """Generate a short ElevenLabs TTS clip and stream it back as audio/mpeg."""
    if not settings.ELEVENLABS_API_KEY:
        raise HTTPException(status_code=503, detail="ElevenLabs not configured.")

    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required.")
    if len(text) > 500:
        text = text[:500]

    try:
        client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
        audio_generator = client.text_to_speech.convert(
            text=text,
            voice_id=payload.voice_id or DEFAULT_VOICE_ID,
            model_id="eleven_multilingual_v2",
        )
        # Collect all chunks into a buffer
        buf = io.BytesIO()
        for chunk in audio_generator:
            if chunk:
                buf.write(chunk)
        buf.seek(0)

        return StreamingResponse(
            buf,
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-store"},
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"TTS generation failed: {e}")
