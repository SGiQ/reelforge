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

# Theme definitions: (overlay_rgba, text_rgb, accent_rgb)
THEMES = {
    "dark": {
        "overlay": (26, 26, 46, 178),        # 70% opacity
        "text": (255, 255, 255),
        "accent": (167, 139, 250),
    },
    "light": {
        "overlay": (248, 248, 248, 153),      # 60% opacity
        "text": (26, 26, 46),
        "accent": (124, 58, 237),
    },
    "sky-blue": {
        "overlay": (14, 165, 233, 166),       # 65% opacity
        "text": (255, 255, 255),
        "accent": (125, 211, 252),
    },
    "warm-gold": {
        "overlay": (217, 119, 6, 166),        # 65% opacity
        "text": (28, 25, 23),
        "accent": (252, 211, 77),
    },
}

FRAME_W = 1080
FRAME_H = 1920
FPS = 30
SLIDE_DURATION = 2.8   # seconds per slide
FADE_DURATION = 0.5    # seconds for fade in/out


def _download_image(url: str, dest_dir: str) -> str | None:
    """Download an image from URL to a temp file, returning the local path."""
    if not url or not url.startswith("http"):
        return None
    try:
        suffix = Path(url.split("?")[0]).suffix or ".jpg"
        dest = os.path.join(dest_dir, f"asset_{abs(hash(url))}{suffix}")
        urllib.request.urlretrieve(url, dest)
        return dest
    except Exception:
        return None


def _make_background(watermark_path: str | None, theme_key: str) -> Image.Image:
    """Create the base frame: watermark at 18% opacity + solid color overlay."""
    theme = THEMES.get(theme_key, THEMES["dark"])

    # Base: solid overlay color (fully opaque RGBA)
    overlay_rgba = theme["overlay"]
    base_color = overlay_rgba[:3]
    base = Image.new("RGBA", (FRAME_W, FRAME_H), base_color)

    if watermark_path:
        try:
            wm = Image.open(watermark_path).convert("RGBA")
            # Scale to fill 1080×1920
            wm_ratio = max(FRAME_W / wm.width, FRAME_H / wm.height)
            new_w = int(wm.width * wm_ratio)
            new_h = int(wm.height * wm_ratio)
            wm = wm.resize((new_w, new_h), Image.LANCZOS)
            # Center crop
            left = (new_w - FRAME_W) // 2
            top = (new_h - FRAME_H) // 2
            wm = wm.crop((left, top, left + FRAME_W, top + FRAME_H))
            # Set to 18% opacity
            alpha = wm.split()[3]
            alpha = alpha.point(lambda p: int(p * 0.18))
            wm.putalpha(alpha)
            base = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
            base.paste(wm, (0, 0), wm)
        except Exception:
            base = Image.new("RGBA", (FRAME_W, FRAME_H), base_color)

    # Overlay
    overlay = Image.new("RGBA", (FRAME_W, FRAME_H), theme["overlay"])
    base = Image.alpha_composite(base, overlay)
    return base.convert("RGB")


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    """Load a font — falls back to default on Railway if custom font not found."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _draw_text_slide(base_img: Image.Image, text: str, theme_key: str) -> Image.Image:
    """Draw bold centered text on the frame."""
    theme = THEMES.get(theme_key, THEMES["dark"])
    img = base_img.copy()
    draw = ImageDraw.Draw(img)

    font_size = 88
    font = _load_font(font_size)
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

        # Shadow
        draw.text((x + 4, y + 4), line, font=font, fill=(0, 0, 0, 120))
        # Main text
        draw.text((x, y), line, font=font, fill=theme["text"])
        y += line_spacing

    return img


def _draw_logo_slide(base_img: Image.Image, logo_path: str | None, brand_name: str, website_url: str, theme_key: str) -> Image.Image:
    """Draw final brand slide with logo + QR code."""
    theme = THEMES.get(theme_key, THEMES["dark"])
    img = base_img.copy()
    draw = ImageDraw.Draw(img)

    center_x = FRAME_W // 2
    y_cursor = FRAME_H // 2 - 320

    # Logo
    if logo_path:
        try:
            logo = Image.open(logo_path).convert("RGBA")
            max_logo_w, max_logo_h = 600, 300
            ratio = min(max_logo_w / logo.width, max_logo_h / logo.height)
            new_w, new_h = int(logo.width * ratio), int(logo.height * ratio)
            logo = logo.resize((new_w, new_h), Image.LANCZOS)
            logo_x = center_x - new_w // 2
            img.paste(logo, (logo_x, y_cursor), logo)
            y_cursor += new_h + 60
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
    img.paste(card, (card_x, y_cursor))

    return img


def _frames_to_mp4(frame_paths: list[str], output_path: str) -> None:
    """Use FFmpeg to concat frames with crossfade into 1080×1920 MP4."""
    if not shutil.which("ffmpeg"):
        raise RuntimeError("FFmpeg not found. Please install FFmpeg.")

    slide_frames = int(SLIDE_DURATION * FPS)
    fade_frames = int(FADE_DURATION * FPS)
    total_frames = len(frame_paths) * slide_frames

    # Build FFmpeg concat filter with fade
    # Strategy: concat each frame image repeated for slide_frames, add fade via vf
    # We'll create a concat demuxer file
    concat_file = output_path.replace(".mp4", "_concat.txt")
    with open(concat_file, "w") as f:
        for frame_path in frame_paths:
            f.write(f"file '{frame_path}'\n")
            f.write(f"duration {SLIDE_DURATION}\n")
        # Repeat last frame once more (required by concat demuxer)
        f.write(f"file '{frame_paths[-1]}'\n")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_file,
        "-vf",
        # Fade each slide in and out
        f"fade=t=in:st=0:d={FADE_DURATION}",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-s", f"{FRAME_W}x{FRAME_H}",
        "-r", str(FPS),
        "-an",  # no audio
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed:\n{result.stderr}")


class RenderEngine:
    def render(
        self,
        job_id: str,
        slides: list[str],
        theme: str,
        brand_name: str,
        logo_url: str | None = None,
        watermark_url: str | None = None,
        website_url: str = "https://checkwellcare.com",
    ) -> str:
        """
        Renders a 1080×1920 MP4 and saves it to RENDER_OUTPUT_DIR.
        Returns the local file path.
        """
        output_dir = Path(settings.RENDER_OUTPUT_DIR)
        output_dir.mkdir(parents=True, exist_ok=True)

        with tempfile.TemporaryDirectory() as tmpdir:
            # Download remote assets
            watermark_path = _download_image(watermark_url, tmpdir) if watermark_url else None
            logo_path = _download_image(logo_url, tmpdir) if logo_url else None

            # Generate base background (shared across frames)
            bg = _make_background(watermark_path, theme)

            frame_paths = []

            # Text slides
            for i, slide_text in enumerate(slides):
                frame = _draw_text_slide(bg, slide_text, theme)
                frame_path = os.path.join(tmpdir, f"frame_{i:04d}.png")
                frame.save(frame_path, "PNG")
                frame_paths.append(frame_path)

            # Logo slide
            logo_slide = _draw_logo_slide(bg, logo_path, brand_name, website_url, theme)
            logo_frame_path = os.path.join(tmpdir, f"frame_{len(slides):04d}.png")
            logo_slide.save(logo_frame_path, "PNG")
            frame_paths.append(logo_frame_path)

            # Render MP4
            output_path = str(output_dir / f"{job_id}.mp4")
            _frames_to_mp4(frame_paths, output_path)

        return output_path
