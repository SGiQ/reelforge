"use client";
/**
 * Render-slide page — used by Playwright during video rendering.
 * Renders a single slide at 270×480 (same as the live preview).
 * Playwright screenshots at deviceScaleFactor=4 → 1080×1920 native.
 *
 * URL: /render-slide/{jobId}/{slideIndex}
 * Data source: /api/render-frame-data/{jobId}
 */
import { useEffect, useState, CSSProperties } from "react";
import { THEMES } from "@/components/ThemeCard";
import * as LucideIcons from "lucide-react";

interface ElementData {
    type?: string;
    value?: string;
    x?: number;
    y?: number;
    size?: number;
    color?: string | null;
    animation?: string;
}

interface SlideData {
    text: string;
    font_size: number;
    text_color: string;
    font_family: string;
    kind?: string | null;
    image_url?: string | null;
    text_animation?: string;
    elements?: ElementData[];
}

// Animation keyframes for capture mode. The renderer steps a single timeline
// variable (--at) across these to screenshot the intro frame-by-frame.
const ANIM_KEYFRAMES = `
@keyframes rf-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes rf-fade_up { from { opacity: 0; transform: translateY(40px) } to { opacity: 1; transform: none } }
@keyframes rf-slide_left { from { opacity: 0; transform: translateX(80px) } to { opacity: 1; transform: none } }
@keyframes rf-slide_right { from { opacity: 0; transform: translateX(-80px) } to { opacity: 1; transform: none } }
@keyframes rf-el-pop { 0% { opacity: 0; transform: scale(0.2) } 70% { opacity: 1; transform: scale(1.12) } 100% { opacity: 1; transform: scale(1) } }
@keyframes rf-el-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes rf-el-bounce { 0% { opacity: 0; transform: translateY(-90px) } 60% { opacity: 1; transform: translateY(10px) } 80% { transform: translateY(-5px) } 100% { opacity: 1; transform: translateY(0) } }
`;

const TEXT_ANIM: Record<string, [string, string, string]> = {
    fade: ["rf-fade", "0.55s", "ease-out"],
    fade_up: ["rf-fade_up", "0.6s", "cubic-bezier(.2,.7,.2,1)"],
    slide_left: ["rf-slide_left", "0.6s", "cubic-bezier(.2,.7,.2,1)"],
    slide_right: ["rf-slide_right", "0.6s", "cubic-bezier(.2,.7,.2,1)"],
};
const ELEM_ANIM: Record<string, [string, string, string]> = {
    pop: ["rf-el-pop", "0.55s", "cubic-bezier(.2,1.3,.4,1)"],
    fade: ["rf-el-fade", "0.5s", "ease-out"],
    bounce: ["rf-el-bounce", "0.8s", "cubic-bezier(.2,.8,.3,1)"],
};

// A paused, timeline-driven animation style (capture mode only).
function animStyle(capture: boolean, table: Record<string, [string, string, string]>, key?: string): CSSProperties {
    if (!capture || !key || key === "none") return {};
    const m = table[key];
    if (!m) return {};
    return {
        animationName: m[0], animationDuration: m[1], animationTimingFunction: m[2],
        animationFillMode: "both", animationPlayState: "paused", animationDelay: "var(--at, 0ms)",
    };
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
    slide_logo_position?: string;
    slide_logo_size?: number;
    video_overlay?: boolean;
    qr_code_url?: string | null;
    qr_text?: string;
    website_url?: string;
    phone?: string | null;
}

// Position style for the small persistent "logo bug" on every text slide.
// A soft, spread-out white glow that feathers the logo into the background.
const LOGO_GLOW = "drop-shadow(0 0 3px rgba(255,255,255,0.85)) drop-shadow(0 0 10px rgba(255,255,255,0.6)) drop-shadow(0 0 20px rgba(255,255,255,0.4)) drop-shadow(0 0 34px rgba(255,255,255,0.24))";

// Where the brand block sits on the final slide.
function logoSlideAlign(pos: string | undefined): { justifyContent: string; alignItems: string } {
    const vert = pos?.startsWith("top") ? "flex-start" : pos?.startsWith("bottom") ? "flex-end" : "center";
    const horiz = pos?.endsWith("left") ? "flex-start" : pos?.endsWith("right") ? "flex-end" : "center";
    return { justifyContent: vert, alignItems: horiz };
}

function slideBugStyle(pos: string | undefined, size = 44): CSSProperties | null {
    const m = 14;   // top / side inset
    const mb = 3;   // bottom inset — sits lower toward the edge
    const base: CSSProperties = { position: "absolute", maxWidth: size, maxHeight: size, objectFit: "contain", opacity: 1, zIndex: 6, filter: LOGO_GLOW };
    switch (pos) {
        case "top_left": return { ...base, top: m, left: m };
        case "top_center": return { ...base, top: m, left: "50%", transform: "translateX(-50%)" };
        case "top_right": return { ...base, top: m, right: m };
        case "bottom_left": return { ...base, bottom: mb, left: m };
        case "bottom_center": return { ...base, bottom: mb, left: "50%", transform: "translateX(-50%)" };
        case "bottom_right": return { ...base, bottom: mb, right: m };
        default: return null;
    }
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
    const [overlay, setOverlay] = useState(false);
    const [textOnly, setTextOnly] = useState(false);
    const [bgOnly, setBgOnly] = useState(false);
    const [capture, setCapture] = useState(false);

    // Capture mode (?anim=capture): animations are paused and seeked by the
    // renderer via window.__setAnimTime(ms), which drives the --at timeline var.
    useEffect(() => {
        const isCapture = new URLSearchParams(window.location.search).get("anim") === "capture";
        setCapture(isCapture);
        if (isCapture) {
            (window as any).__setAnimTime = (ms: number) => {
                document.documentElement.style.setProperty("--at", `${-ms}ms`);
            };
            document.documentElement.style.setProperty("--at", "0ms");
        }
    }, []);

    // layer=overlay → caption + logo, transparent (composited over a clip).
    // layer=text   → caption only, transparent (animated text layer over a still).
    // layer=bg     → the scene background incl. logo, WITHOUT the caption.
    useEffect(() => {
        const layer = new URLSearchParams(window.location.search).get("layer");
        const isOverlay = layer === "overlay";
        const isText = layer === "text";
        setOverlay(isOverlay);
        setTextOnly(isText);
        setBgOnly(layer === "bg");
        if (isOverlay || isText) {
            document.documentElement.style.background = "transparent";
            document.body.style.background = "transparent";
        }
    }, []);

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

    // ── Overlay/text layer (transparent) — caption (+ logo unless text-only) ────
    if ((overlay || textOnly) && !isLogoSlide && slide) {
        const ovFont = FONT_MAP[slide.font_family] || "Inter, sans-serif";
        const ovColor = slide.text_color && slide.text_color !== "" ? slide.text_color : theme.textColor;
        return (
            <div
                style={{ width: 270, height: 480, position: "relative", overflow: "hidden", background: "transparent" }}
                data-ready="true"
            >
                {overlay && data.video_overlay && (
                    <div style={{ position: "absolute", inset: 0, background: theme.overlayColor, opacity: 0.4 }} />
                )}
                {slide.text && slide.text.trim() && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
                        <p style={{
                            color: ovColor,
                            fontSize: `${slide.font_size / 80}rem`,
                            fontFamily: ovFont,
                            fontWeight: "bold",
                            lineHeight: 1.3,
                            textAlign: "center",
                            textShadow: "0 2px 12px rgba(0,0,0,0.55)",
                            wordBreak: "break-word",
                            margin: 0,
                        }}>
                            {slide.text}
                        </p>
                    </div>
                )}
                {!textOnly && data.logo_url && slideBugStyle(data.slide_logo_position, data.slide_logo_size) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.logo_url} alt="" style={slideBugStyle(data.slide_logo_position, data.slide_logo_size)!} />
                )}
            </div>
        );
    }

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
                {/* No watermark on the branding slide — keep it clean */}
                <div style={{ position: "absolute", inset: 0, background: theme.overlayColor, opacity: 0.7 }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 10, padding: "12px 20px", textAlign: "center", ...logoSlideAlign(data.logo_position) }}>
                    {data.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={data.logo_url} alt={data.brand_name} style={{ maxWidth: data.logo_size || 120, maxHeight: data.logo_size || 120, objectFit: "contain" }} />
                    ) : (
                        <div style={{ width: data.logo_size || 120, height: data.logo_size || 120, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, background: theme.accentColor, color: theme.textColor }}>
                            {data.brand_name.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                    {!data.logo_url && (
                        <p style={{ fontSize: "0.875rem", fontWeight: 700, color: theme.textColor, textAlign: "center", margin: 0 }}>
                            {data.brand_name}
                        </p>
                    )}

                    {data.phone && data.phone.trim() && (
                        <p style={{ fontSize: "1.15rem", fontWeight: 700, color: theme.textColor, textAlign: "center", margin: 0 }}>
                            {data.phone}
                        </p>
                    )}

                    {/* Custom QR Code (Optional) */}
                    {data.qr_code_url && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <div style={{ width: Math.min((data.logo_size || 120) * 0.6, 108), height: Math.min((data.logo_size || 120) * 0.6, 108), background: "#fff", padding: "4px", borderRadius: 8, overflow: "hidden" }}>
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
    const isImage = slide.kind === "image" && !!slide.image_url;

    // Placed graphic elements (icons / emoji / uploads). Centering lives on the
    // outer div so the inner animation transform doesn't clobber it.
    const renderElements = () =>
        (slide.elements || []).map((el, idx) => {
            const cssSize = (el.size || 140) / 4;
            let content: React.ReactNode = null;
            if (el.type === "emoji") {
                content = <span style={{ fontSize: cssSize, lineHeight: 1 }}>{el.value}</span>;
            } else if (el.type === "image") {
                // eslint-disable-next-line @next/next/no-img-element
                content = <img src={el.value} alt="" style={{ width: cssSize, height: cssSize, objectFit: "contain", display: "block" }} />;
            } else {
                const Cmp = (LucideIcons as any)[el.value || ""];
                content = Cmp ? <Cmp size={cssSize} color={el.color || "#ffffff"} strokeWidth={2.2} /> : null;
            }
            return (
                <div key={idx} style={{ position: "absolute", left: `${(el.x ?? 0.5) * 100}%`, top: `${(el.y ?? 0.5) * 100}%`, transform: "translate(-50%,-50%)", zIndex: 5 }}>
                    <div style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))", ...animStyle(capture, ELEM_ANIM, el.animation) }}>{content}</div>
                </div>
            );
        });

    return (
        <div
            style={{
                width: 270, height: 480,
                position: "relative", overflow: "hidden",
                background: theme.bgGradient,
            }}
            data-ready="true"
        >
            <style dangerouslySetInnerHTML={{ __html: ANIM_KEYFRAMES }} />
            {/* Image scene background */}
            {isImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slide.image_url!} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            )}

            {/* Watermark — hidden on image scenes (the image is the background) */}
            {data.watermark_url && !isImage && (
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

            {/* Overlay — lighter over an image so the photo shows through */}
            <div
                style={{
                    position: "absolute", inset: 0,
                    background: theme.overlayColor,
                    opacity: isImage ? 0.3 : 0.7,
                }}
            />

            {/* Text — IDENTICAL styling to ReelPreview */}
            {!bgOnly && (
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
                            ...animStyle(capture, TEXT_ANIM, slide.text_animation),
                        }}
                    >
                        {slide.text}
                    </p>
                </div>
            )}

            {/* Placed graphic elements (icons / emoji / uploads) */}
            {!bgOnly && renderElements()}

            {/* Persistent logo bug for brand recognition (kept on the background layer) */}
            {data.logo_url && slideBugStyle(data.slide_logo_position) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.logo_url} alt="" style={slideBugStyle(data.slide_logo_position)!} />
            )}
        </div>
    );
}
