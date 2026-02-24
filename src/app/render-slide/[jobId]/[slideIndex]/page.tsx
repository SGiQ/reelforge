"use client";
/**
 * Render-slide page — used by Playwright during video rendering.
 * Renders a single slide at 270×480 (same as the live preview).
 * Playwright screenshots at deviceScaleFactor=4 → 1080×1920 native.
 *
 * URL: /render-slide/{jobId}/{slideIndex}
 * Data source: /api/render-frame-data/{jobId}
 */
import { useEffect, useState } from "react";
import { THEMES } from "@/components/ThemeCard";

interface SlideData {
    text: string;
    font_size: number;
    text_color: string;
    font_family: string;
}

interface RenderJobData {
    slides: SlideData[];
    theme: string;
    watermark_url: string | null;
    watermark_opacity: number;
    brand_name: string;
    logo_url: string | null;
    logo_position?: string;
    logo_size?: number;
    qr_code_url?: string | null;
    qr_text?: string;
    website_url?: string;
}

const FONT_MAP: Record<string, string> = {
    "DejaVuSans-Bold.ttf": "Inter, sans-serif",
    "Montserrat-Bold.ttf": "Montserrat, sans-serif",
    "Oswald-Bold.ttf": "Oswald, sans-serif",
    "BebasNeue-Regular.ttf": "'Bebas Neue', sans-serif",
    "PlayfairDisplay-Bold.ttf": "'Playfair Display', serif",
    "Outfit-Bold.ttf": "Outfit, sans-serif",
    "SpaceMono-Bold.ttf": "'Space Mono', monospace",
    "Cinzel-Bold.ttf": "Cinzel, serif",
    "DejaVuSerif.ttf": "serif",
    "DejaVuSansMono.ttf": "monospace",
};

export default function RenderSlidePage({
    params,
}: {
    params: { jobId: string; slideIndex: string };
}) {
    const [data, setData] = useState<RenderJobData | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Fetch from the backend API directly — Next.js (/api/) won't work in production
        // because Railway (Python) and Vercel (Next.js) don't share /tmp filesystem.
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        fetch(`${apiUrl}/render/frame-data/${params.jobId}`)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((d) => {
                setData(d);
                // Small delay so fonts have time to paint before Playwright screenshots
                setTimeout(() => setReady(true), 500);
            })
            .catch((err) => {
                console.error("render-slide: failed to load data", err);
            });
    }, [params.jobId]);

    if (!data || !ready) {
        return (
            <div
                style={{ width: 270, height: 480, background: "#0f0f1a" }}
                data-ready="false"
            />
        );
    }

    const slideIndex = parseInt(params.slideIndex, 10);
    const theme = THEMES.find((t) => t.id === data.theme) || THEMES[0];
    const isLogoSlide = slideIndex >= data.slides.length;
    const slide = data.slides[slideIndex];

    // ── Logo slide ────────────────────────────────────────────────────────────
    if (isLogoSlide) {
        return (
            <div
                style={{
                    width: 270, height: 480,
                    position: "relative", overflow: "hidden",
                    background: theme.bgGradient,
                }}
                data-ready="true"
            >
                {data.watermark_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.watermark_url} alt=""
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: data.watermark_opacity / 100 }}
                    />
                )}
                <div style={{ position: "absolute", inset: 0, background: theme.overlayColor, opacity: 0.7 }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                    {data.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={data.logo_url} alt={data.brand_name} style={{ maxWidth: data.logo_size || 120, maxHeight: data.logo_size || 120, objectFit: "contain" }} />
                    ) : (
                        <div style={{ width: data.logo_size || 120, height: data.logo_size || 120, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, background: theme.accentColor, color: theme.textColor }}>
                            {data.brand_name.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                    <p style={{ fontSize: "0.875rem", fontWeight: 700, color: theme.textColor, textAlign: "center", margin: 0 }}>
                        {data.brand_name}
                    </p>

                    {/* Custom QR Code (Optional) */}
                    {data.qr_code_url && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 8 }}>
                            <div style={{ width: (data.logo_size || 120) * 0.6, height: (data.logo_size || 120) * 0.6, background: "#fff", padding: "4px", borderRadius: 8, overflow: "hidden" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={data.qr_code_url} alt="QR Code" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            </div>
                            {data.qr_text && (
                                <p style={{ fontSize: "0.75rem", fontWeight: 500, color: theme.textColor, opacity: 0.9, textAlign: "center", margin: 0 }}>
                                    {data.qr_text}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Text slide ────────────────────────────────────────────────────────────
    if (!slide) return null;

    const fontFamily = FONT_MAP[slide.font_family] || "Inter, sans-serif";
    const rawColor = slide.text_color;
    const textColor = rawColor && rawColor !== "" ? rawColor : theme.textColor;

    return (
        <div
            style={{
                width: 270, height: 480,
                position: "relative", overflow: "hidden",
                background: theme.bgGradient,
            }}
            data-ready="true"
        >
            {/* Watermark */}
            {data.watermark_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={data.watermark_url}
                    alt=""
                    style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover",
                        opacity: data.watermark_opacity / 100,
                    }}
                />
            )}

            {/* Overlay — exact same as ReelPreview */}
            <div
                style={{
                    position: "absolute", inset: 0,
                    background: theme.overlayColor,
                    opacity: 0.7,
                }}
            />

            {/* Text — IDENTICAL styling to ReelPreview */}
            <div
                style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 32px",
                }}
            >
                <p
                    style={{
                        color: textColor,
                        fontSize: `${slide.font_size / 80}rem`,
                        fontFamily,
                        fontWeight: "bold",
                        lineHeight: 1.3,
                        textAlign: "center",
                        textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                        wordBreak: "break-word",
                        margin: 0,
                    }}
                >
                    {slide.text}
                </p>
            </div>
        </div>
    );
}
