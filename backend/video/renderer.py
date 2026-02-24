"""
RenderEngine: Generates 1080×1920 MP4 reels using Pillow + FFmpeg.

Pipeline:
  1. For each text slide → generate PNG frame (watermark + overlay + text)
  2. Final slide → brand logo + QR code
  3. FFmpeg: concat frames with fade-in effect → MP4
"""
import os
import io
import math
import shutil
import subprocess
import tempfile
import textwrap
import urllib.request
from pathlib import Path
from typing import Optional

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import qrcode
from config import settings
from elevenlabs.client import ElevenLabs
from mutagen.mp3 import MP3
import base64

# Theme definitions: (gradient_start, gradient_end, overlay_rgba, text_rgb, accent_rgb)
THEMES = {
    "dark": {
        "gradient": [(26, 26, 46), (15, 15, 26)],      # #1a1a2e -> #0f0f1a
        "overlay": (26, 26, 46, 178),                  # #1a1a2e at 70%
        "text": (255, 255, 255),
        "accent": (167, 139, 250),
    },
    "light": {
        "gradient": [(248, 248, 248), (226, 232, 240)], # #f8f8f8 -> #e2e8f0
        "overlay": (248, 248, 248, 178),                # #f8f8f8 at 70% (CSS opacity:0.7 = alpha 178)
        "text": (26, 26, 46),
        "accent": (124, 58, 237),
    },
    "sky-blue": {
        "gradient": [(14, 165, 233), (2, 132, 199)],    # #0ea5e9 -> #0284c7
        "overlay": (14, 165, 233, 166),                 # #0ea5e9 at 65%
        "text": (255, 255, 255),
        "accent": (125, 211, 252),
    },
    "warm-gold": {
        "gradient": [(217, 119, 6), (180, 83, 9)],      # #d97706 -> #b45309
        "overlay": (217, 119, 6, 166),                  # #d97706 at 65%
        "text": (28, 25, 23),
        "accent": (252, 211, 77),
    },
    "crimson-red": {
        "gradient": [(159, 18, 57), (76, 5, 25)],       # #9f1239 -> #4c0519
        "overlay": (159, 18, 57, 178),                  # #9f1239 at 70%
        "text": (255, 255, 255),
        "accent": (244, 63, 94),
    },
    "forest-green": {
        "gradient": [(22, 101, 52), (20, 83, 45)],      # #166534 -> #14532d
        "overlay": (22, 101, 52, 178),                  # #166534 at 70%
        "text": (255, 255, 255),
        "accent": (52, 211, 153),
    },
    "amethyst": {
        "gradient": [(76, 29, 149), (46, 16, 101)],     # #4c1d95 -> #2e1065
        "overlay": (76, 29, 149, 178),                  # #4c1d95 at 70%
        "text": (255, 255, 255),
        "accent": (192, 132, 252),
    },
    "monochrome": {
        "gradient": [(23, 23, 23), (0, 0, 0)],          # #171717 -> #000000
        "overlay": (0, 0, 0, 190),                      # Pure black at 75%
        "text": (255, 255, 255),
        "accent": (163, 163, 163),
    },
}

FRAME_W = 1080
FRAME_H = 1920
FPS = 30
DEFAULT_SLIDE_DURATION = 2.8   # fallback seconds per slide
FADE_DURATION = 0.5    # seconds for fade in/out


def _download_image(url: str, dest_dir: str) -> str | None:
    """Download an image from URL or data URI to a temp file, returning the local path."""
    if not url:
        return None
    try:
        if url.startswith("data:image"):
            header, encoded = url.split(",", 1)
            img_data = base64.b64decode(encoded)
            ext = ".png"
            if "jpeg" in header or "jpg" in header:
                ext = ".jpg"
            elif "svg" in header:
                ext = ".svg"
            elif "webp" in header:
                ext = ".webp"
            elif "gif" in header:
                ext = ".gif"
            
            # The next.js file dropzone might generate things like: data:application/octet-stream;base64,
            # We enforce PNG fallback.
            
            dest = os.path.join(dest_dir, f"asset_{abs(hash(url))}{ext}")
            with open(dest, "wb") as f:
                f.write(img_data)
            return dest
        elif url.startswith("http"):
            suffix = Path(url.split("?")[0]).suffix or ".jpg"
            dest = os.path.join(dest_dir, f"asset_{abs(hash(url))}{suffix}")
            urllib.request.urlretrieve(url, dest)
            return dest
        return None
    except Exception:
        return None


def _draw_gradient(start_color: tuple, end_color: tuple) -> Image.Image:
    """Draw a 135° diagonal gradient from start_color to end_color (matching CSS linear-gradient(135deg))."""
    base = Image.new("RGB", (FRAME_W, FRAME_H), start_color)
    draw = ImageDraw.Draw(base)
    diagonal = FRAME_W + FRAME_H
    for y in range(FRAME_H):
        for x in range(0, FRAME_W, 4):
            ratio = min((x + y) / diagonal, 1.0)
            r = int(start_color[0] * (1 - ratio) + end_color[0] * ratio)
            g = int(start_color[1] * (1 - ratio) + end_color[1] * ratio)
            b = int(start_color[2] * (1 - ratio) + end_color[2] * ratio)
            draw.line([(x, y), (min(x + 3, FRAME_W - 1), y)], fill=(r, g, b))
    return base


def _make_background(watermark_path: str | None, theme_key: str, watermark_opacity: int = 18) -> Image.Image:
    """Create the base frame matching ReelPreview.tsx layer order:
      1. Container background: linear-gradient(135deg, ...)
      2. Watermark img at watermark_opacity%
      3. Overlay div with overlayColor at CSS opacity:0.7 (alpha=178)
    """
    theme = THEMES.get(theme_key, THEMES["dark"])

    # 1. 135° Gradient background
    start_c, end_c = theme["gradient"]
    bg = _draw_gradient(start_c, end_c).convert("RGBA")

    # 2. Watermark photo at user-specified opacity
    if watermark_path:
        try:
            wm = Image.open(watermark_path).convert("RGBA")
            wm_ratio = max(FRAME_W / wm.width, FRAME_H / wm.height)
            new_w = int(wm.width * wm_ratio)
            new_h = int(wm.height * wm_ratio)
            wm = wm.resize((new_w, new_h), Image.LANCZOS)
            left = (new_w - FRAME_W) // 2
            top  = (new_h - FRAME_H) // 2
            wm = wm.crop((left, top, left + FRAME_W, top + FRAME_H))
            # Apply global opacity (watermark_opacity% of original alpha)
            new_alpha = wm.split()[3].point(lambda p: int(p * watermark_opacity / 100))
            wm.putalpha(new_alpha)
            bg = Image.alpha_composite(bg, wm)
        except Exception:
            pass

    # 3. Translucent color overlay — alpha already set to round(255 * opacity) in THEMES
    overlay_img = Image.new("RGBA", (FRAME_W, FRAME_H), theme["overlay"])
    final_bg = Image.alpha_composite(bg, overlay_img)

    return final_bg.convert("RGB")



def _load_font(size: int, font_family: str = "DejaVuSans-Bold.ttf") -> ImageFont.FreeTypeFont:
    """Load a font — prioritizes local /fonts folder, then system fallbacks."""
    # 1. Try local fonts folder first (ensures 1:! match with frontend)
    local_font_dir = os.path.join(os.path.dirname(__file__), "fonts")
    local_path = os.path.join(local_font_dir, font_family)
    if os.path.exists(local_path):
        try:
            return ImageFont.truetype(local_path, size)
        except Exception:
            pass

    # 2. Mapping of common names to potential system paths (fallbacks)
    font_map = {
        "DejaVuSans-Bold.ttf": [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/System/Library/Fonts/Supplemental/DejaVuSans-Bold.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
        ],
        "Montserrat-Bold.ttf": [
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/Library/Fonts/Arial Bold.ttf",
        ],
        "Oswald-Bold.ttf": [
            "/System/Library/Fonts/Supplemental/Arial Narrow Bold.ttf",
            "/Library/Fonts/Arial Narrow Bold.ttf",
        ],
        "BebasNeue-Regular.ttf": [
            "/System/Library/Fonts/Supplemental/Impact.ttf",
            "/Library/Fonts/Impact.ttf",
        ],
        "PlayfairDisplay-Bold.ttf": [
            "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf",
            "/Library/Fonts/Times New Roman Bold.ttf",
        ],
        "Outfit-Bold.ttf": [
            "/System/Library/Fonts/Supplemental/Verdana Bold.ttf",
            "/Library/Fonts/Verdana Bold.ttf",
        ],
        "SpaceMono-Bold.ttf": [
            "/System/Library/Fonts/SFNSMono.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        ],
        "Cinzel-Bold.ttf": [
            "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
            "/Library/Fonts/Georgia Bold.ttf",
        ],
    }

    if font_family in font_map:
        for p in font_map[font_family]:
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
    
    # 2. Try generic fallbacks
    fallbacks = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    for path in fallbacks:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
            
    return ImageFont.load_default()


def _draw_text_slide(base_img: Image.Image, slide: dict, theme_key: str) -> Image.Image:
    """Draw centered text with per-slide styles, matching the browser preview."""
    theme = THEMES.get(theme_key, THEMES["dark"])
    img = base_img.copy()
    draw = ImageDraw.Draw(img)

    text = slide.get("text", "")
    # Scale factor 1.0: fontSize=88 → 88px on 1080p matches the preview's visual proportions.
    # Pixel measurement: 88px renders "You can't be everywhere." at ~44% of 1080px frame width,
    # which scales to ~50% at 270px thumbnail — matching the preview exactly.
    # (2.0x was tried but rendered at 89% — confirmed too large by visual comparison.)
    font_size = int(slide.get("font_size", 88) * 1.0)
    text_color = slide.get("text_color", theme["text"])
    font_family = slide.get("font_family", "DejaVuSans-Bold.ttf")

    # If not a hex color, fall back to theme color
    if isinstance(text_color, str) and not text_color.startswith("#"):
        text_color = theme["text"]

    font = _load_font(font_size, font_family)
    # max_chars=22 wraps lines correctly at 88px on 1080px frame
    max_chars = 22

    # Word wrap
    wrapped = textwrap.fill(text, width=max_chars)
    lines = wrapped.split("\n")

    # Calculate total text block height
    _, _, _, line_h = draw.textbbox((0, 0), "Ag", font=font)
    line_spacing = int(line_h * 1.3)
    total_h = len(lines) * line_spacing

    y = (FRAME_H - total_h) // 2

    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        text_w = bbox[2] - bbox[0]
        x = (FRAME_W - text_w) // 2

        # Soft blur shadow matching CSS: "0 2px 12px rgba(0,0,0,0.4)"
        # Draw text on a temp RGBA layer, blur it, then composite
        shadow_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow_layer)
        shadow_draw.text((x, y + 4), line, font=font, fill=(0, 0, 0, 102))  # 40% alpha
        blurred_shadow = shadow_layer.filter(ImageFilter.GaussianBlur(radius=8))
        img_rgba = img.convert("RGBA")
        img_rgba = Image.alpha_composite(img_rgba, blurred_shadow)
        img = img_rgba.convert("RGB")
        draw = ImageDraw.Draw(img)

        # Main text
        draw.text((x, y), line, font=font, fill=text_color)
        y += line_spacing

    return img


def _draw_logo_slide(
    base_img: Image.Image, 
    logo_path: str | None, 
    brand_name: str, 
    website_url: str, 
    theme_key: str,
    logo_position: str = "bottom_center",
    custom_qr_path: str | None = None
) -> Image.Image:
    """Draw final brand slide with logo + QR code."""
    theme = THEMES.get(theme_key, THEMES["dark"])
    img = base_img.copy()
    draw = ImageDraw.Draw(img)

    center_x = FRAME_W // 2
    y_cursor = FRAME_H // 2 - 320

    # Draw Logo based on position
    if logo_path:
        try:
            logo = Image.open(logo_path).convert("RGBA")
            max_logo_w, max_logo_h = 600, 300
            ratio = min(max_logo_w / logo.width, max_logo_h / logo.height)
            new_w, new_h = int(logo.width * ratio), int(logo.height * ratio)
            logo = logo.resize((new_w, new_h), Image.LANCZOS)
            
            # Positioning logic
            if logo_position == "top_left":
                logo_x, logo_y = 60, 60
            elif logo_position == "top_right":
                logo_x, logo_y = FRAME_W - new_w - 60, 60
            elif logo_position == "bottom_left":
                logo_x, logo_y = 60, FRAME_H - new_h - 60
            elif logo_position == "bottom_right":
                logo_x, logo_y = FRAME_W - new_w - 60, FRAME_H - new_h - 60
            elif logo_position == "center":
                logo_x, logo_y = center_x - new_w // 2, FRAME_H // 2 - new_h // 2
                y_cursor = FRAME_H // 2 + new_h // 2 + 60 # Shift text down
            else: # bottom_center
                logo_x, logo_y = center_x - new_w // 2, y_cursor
                y_cursor += new_h + 60
                
            img.paste(logo, (logo_x, int(logo_y)), logo)
        except Exception:
            pass
    else:
        # Text logo fallback
        font = _load_font(120)
        initials = (brand_name[:2]).upper()
        bbox = draw.textbbox((0, 0), initials, font=font)
        text_w = bbox[2] - bbox[0]
        draw.text((center_x - text_w // 2, y_cursor), initials, font=font, fill=theme["accent"])
        y_cursor += 160

    # Brand name
    font_brand = _load_font(72)
    bbox = draw.textbbox((0, 0), brand_name, font=font_brand)
    text_w = bbox[2] - bbox[0]
    draw.text((center_x - text_w // 2, y_cursor), brand_name, font=font_brand, fill=theme["text"])
    y_cursor += 140

    # QR Code
    if custom_qr_path and os.path.exists(custom_qr_path):
        try:
            qr_pil = Image.open(custom_qr_path).convert("RGBA")
            # Replace pure transparent bg with white to ensure readability
            bg = Image.new("RGBA", qr_pil.size, (255, 255, 255, 255))
            qr_pil = Image.alpha_composite(bg, qr_pil).convert("RGB")
        except Exception:
            # Fall back to URL generation
            qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=2)
            qr.add_data(website_url)
            qr.make(fit=True)
            qr_pil = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    else:
        qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=2)
        qr.add_data(website_url)
        qr.make(fit=True)
        qr_pil = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    qr_size = 280
    qr_pil = qr_pil.resize((qr_size, qr_size), Image.NEAREST)

    # White card behind QR
    card_pad = 20
    card = Image.new("RGB", (qr_size + card_pad * 2, qr_size + card_pad * 2), (255, 255, 255))
    card.paste(qr_pil, (card_pad, card_pad))
    card_x = center_x - (qr_size + card_pad * 2) // 2
    
    # Adjust Y if center logo took up space
    if logo_position == "center":
        y_cursor += 40
        
    img.paste(card, (card_x, int(y_cursor)))

    return img


def _generate_tts_for_slide(text: str, voice_id: str, output_path: str) -> float:
    """Generate TTS using ElevenLabs and return the exact duration in seconds."""
    client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
    audio = client.text_to_speech.convert(
        text=text,
        voice_id=voice_id,
        model_id="eleven_multilingual_v2"
    )
    
    with open(output_path, "wb") as f:
        for chunk in audio:
            if chunk:
                f.write(chunk)
                
    # Measure exact duration
    audio_info = MP3(output_path)
    return round(audio_info.info.length, 3)


def _find_ffmpeg() -> str:
    """Find the ffmpeg binary — uses imageio-ffmpeg's bundled binary first (always works)."""
    # 1. imageio-ffmpeg ships its own binary — most reliable, works on Railway/Docker/Mac
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe:
            return exe
    except Exception:
        pass
    # 2. Fallback: system PATH
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        return ffmpeg_path
    # 3. Fallback: common nix store paths
    import glob as _glob
    for pat in ["/nix/store/*ffmpeg*/bin/ffmpeg", "/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg"]:
        matches = _glob.glob(pat)
        if matches:
            return sorted(matches)[-1]
    raise RuntimeError("FFmpeg not found. imageio-ffmpeg, PATH, and nix store all exhausted.")


def _frames_to_mp4(frame_paths: list[str], slide_durations: list[float], output_path: str, music_path: str | None, voice_tracks: list[str]) -> None:
    """Use FFmpeg to concat frames with matching durations and multiplex audio."""
    ffmpeg_bin = _find_ffmpeg()  # raises RuntimeError if not found

    # Build FFmpeg concat filter with exact dynamic durations
    concat_file = output_path.replace(".mp4", "_concat.txt")
    with open(concat_file, "w") as f:
        for i, frame_path in enumerate(frame_paths):
            f.write(f"file '{frame_path}'\n")
            f.write(f"duration {slide_durations[i]}\n")
        # Repeat last frame once more (required by concat demuxer)
        f.write(f"file '{frame_paths[-1]}'\n")

    cmd = [
        ffmpeg_bin, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_file
    ]

    inputs = 1
    audio_filters = []
    
    if music_path and os.path.exists(music_path):
        cmd.extend(["-i", music_path])
        # [1:a]volume=0.2[a1]
        audio_filters.append(f"[{inputs}:a]volume=0.15[a1]")
        inputs += 1
        
    master_voice_duration = sum(slide_durations)
    
    # If we have voice tracks, we build a concat filter for just the voices
    if voice_tracks:
        voice_concat_parts = []
        for vt in voice_tracks:
            cmd.extend(["-i", vt])
            # Pad each voice track with 1.7s of silence at the end to match the slide duration!
            audio_filters.append(f"[{inputs}:a]apad=pad_dur=1.7[v_pad_{inputs}]")
            voice_concat_parts.append(f"[v_pad_{inputs}]")
            inputs += 1
            
        # Concat the voice tracks together
        num_voices = len(voice_tracks)
        voice_concat_str = "".join(voice_concat_parts) + f"concat=n={num_voices}:v=0:a=1[v_master]"
        audio_filters.append(voice_concat_str)
        
        # Mix master voice with music using amix if music exists
        if music_path:
            audio_filters.append(f"[a1][v_master]amix=inputs=2:duration=first:dropout_transition=3[aout]")
        else:
            audio_filters.append(f"[v_master]volume=1.0[aout]")
    elif music_path:
        # Just music, no voiceover
        audio_filters.append(f"[a1]volume=1.0[aout]")

    total_duration = sum(slide_durations)

    # Add video filters (removed fade-in to prevent initial blank screen)
    cmd.extend([
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-s", f"{FRAME_W}x{FRAME_H}",
        "-r", str(FPS),
    ])

    # If audio exists, build complex filter graph
    if audio_filters:
        mix_filter = ";".join(audio_filters)
        cmd.extend(["-filter_complex", mix_filter, "-map", "0:v", "-map", "[aout]", "-c:a", "aac", "-b:a", "192k", "-t", str(total_duration)])
    else:
        cmd.extend(["-an", "-t", str(total_duration)])
        
    cmd.append(output_path)
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed:\n{result.stderr}")


class RenderEngine:
    def render(
        self,
        job_id: str,
        slides: list[dict | str],
        theme: str,
        brand_name: str,
        logo_url: str | None = None,
        watermark_url: str | None = None,
        website_url: str = "https://checkwellcare.com",
        watermark_opacity: int = 18,
        logo_position: str = "bottom_center",
        logo_size: int = 120,
        qr_code_url: str | None = None,
        qr_text: str = "",
        music_url: str | None = None,
        ai_voice_id: str | None = None,
        outro_voiceover: str | None = None,
    ) -> str:
        """
        Renders a 1080×1920 MP4 and saves it to RENDER_OUTPUT_DIR.
        Text slides are screenshotted via Playwright at deviceScaleFactor=4,
        giving pixel-perfect fidelity to the browser preview.
        Returns the local file path.
        """
        output_dir = Path(settings.RENDER_OUTPUT_DIR)
        output_dir.mkdir(parents=True, exist_ok=True)

        with tempfile.TemporaryDirectory() as tmpdir:
            # Download remote assets
            logo_path = _download_image(logo_url, tmpdir) if logo_url else None
            qr_code_path = _download_image(qr_code_url, tmpdir) if qr_code_url else None
            music_path = _download_image(music_url, tmpdir) if music_url else None

            # Normalise slides to dicts
            normalised_slides = []
            for s in slides:
                if isinstance(s, str):
                    normalised_slides.append({"text": s, "font_size": 88, "text_color": "", "font_family": "DejaVuSans-Bold.ttf"})
                else:
                    normalised_slides.append(dict(s))

            # ── Write render data JSON for the Next.js render-slide page ──────
            frames_dir = Path(tempfile.gettempdir()) / "reelforge_frames"
            frames_dir.mkdir(exist_ok=True)
            render_data = {
                "slides": normalised_slides,
                "theme": theme,
                "watermark_url": watermark_url,   # base64 data URL passes through as-is
                "watermark_opacity": watermark_opacity,
                "brand_name": brand_name,
                "logo_url": logo_url,
                "logo_position": logo_position,
                "logo_size": logo_size,
                "qr_code_url": qr_code_url,
                "qr_text": qr_text,
                "website_url": website_url,
            }
            render_data_path = frames_dir / f"{job_id}.json"
            with open(render_data_path, "w") as f:
                import json
                json.dump(render_data, f)

            frame_paths = []
            slide_durations = []
            voice_tracks = []

            # ── Screenshot each text slide via Playwright ─────────────────────
            from playwright.sync_api import sync_playwright
            import glob

            # Dynamically find the Chromium binary — Railway's env var inheritance
            # is unreliable for background threads. We search known install paths.
            def _find_chromium() -> str | None:
                patterns = [
                    "/app/pw-browsers/**/chrome-headless-shell",
                    "/app/pw-browsers/**/chromium",
                    "/root/.cache/ms-playwright/**/chrome-headless-shell",
                    "/root/.cache/ms-playwright/**/chromium",
                ]
                for pat in patterns:
                    matches = glob.glob(pat, recursive=True)
                    if matches:
                        return matches[0]
                return None

            chromium_path = _find_chromium()
            with sync_playwright() as p:
                launch_kwargs = {"headless": True}
                if chromium_path:
                    launch_kwargs["executable_path"] = chromium_path
                browser = p.chromium.launch(**launch_kwargs)
                context = browser.new_context(
                    viewport={"width": 270, "height": 480},
                    device_scale_factor=4,   # 270*4=1080  480*4=1920
                )
                page = context.new_page()

                for i, slide in enumerate(normalised_slides):
                    slide_text = slide.get("text", "")

                    # 1. Generate TTS voiceover
                    slide_duration = DEFAULT_SLIDE_DURATION
                    if ai_voice_id and settings.ELEVENLABS_API_KEY:
                        tts_path = os.path.join(tmpdir, f"tts_{i:04d}.mp3")
                        try:
                            exact_dur = _generate_tts_for_slide(slide_text, ai_voice_id, tts_path)
                            slide_duration = exact_dur + 1.7
                            voice_tracks.append(tts_path)
                        except Exception as e:
                            print(f"TTS failed for slide {i}: {e}")

                    slide_durations.append(slide_duration)

                    # 2. Screenshot via Playwright — pixel-identical to preview
                    url = f"{settings.FRONTEND_URL}/render-slide/{job_id}/{i}"
                    page.goto(url, wait_until="networkidle", timeout=30000)
                    # Wait until the component signals it's ready
                    page.wait_for_selector("[data-ready='true']", timeout=10000)
                    frame_path = os.path.join(tmpdir, f"frame_{i:04d}.png")
                    page.screenshot(path=frame_path)   # deviceScaleFactor=4 → 1080×1920
                    frame_paths.append(frame_path)

            # ── Logo slide (Playwright) ───────────────────────────────────────
                logo_slide_idx = len(normalised_slides)
                
                # 1. Generate TTS voiceover for brand name or custom outro
                logo_duration = 4.25
                if ai_voice_id and settings.ELEVENLABS_API_KEY:
                    tts_path = os.path.join(tmpdir, f"tts_{logo_slide_idx:04d}.mp3")
                    try:
                        # Fallback to brand_name if outro_voiceover is empty or missing
                        spoken_text = outro_voiceover.strip() if outro_voiceover and outro_voiceover.strip() else brand_name
                        exact_dur = _generate_tts_for_slide(spoken_text, ai_voice_id, tts_path)
                        logo_duration = max(4.25, exact_dur + 1.7)
                        voice_tracks.append(tts_path)
                    except Exception as e:
                        print(f"TTS failed for logo slide: {e}")

                url = f"{settings.FRONTEND_URL}/render-slide/{job_id}/{logo_slide_idx}"
                page.goto(url, wait_until="networkidle", timeout=30000)
                page.wait_for_selector("[data-ready='true']", timeout=10000)
                logo_frame_path = os.path.join(tmpdir, f"frame_{logo_slide_idx:04d}.png")
                page.screenshot(path=logo_frame_path)   # deviceScaleFactor=4 → 1080×1920
                frame_paths.append(logo_frame_path)
                slide_durations.append(logo_duration)
                
                browser.close()

            # ── Render MP4 ────────────────────────────────────────────────────
            output_path = str(output_dir / f"{job_id}.mp4")
            _frames_to_mp4(frame_paths, slide_durations, output_path, music_path, voice_tracks)

        # Clean up the data JSON
        try:
            render_data_path.unlink(missing_ok=True)
        except Exception:
            pass

        return output_path
