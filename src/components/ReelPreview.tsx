"use client";
import { useState, useEffect, useRef } from "react";
import { THEMES, Theme } from "./ThemeCard";

interface Slide {
    text: string;
    fontSize: number;
    textColor: string;
    fontFamily: string;
}

interface ReelPreviewProps {
    slides: (string | Slide)[];
    themeId: string;
    brandName?: string;
    watermarkUrl?: string | null;
    watermarkOpacity?: number;
    logoUrl?: string | null;
    logoSize?: number;
    qrCodeUrl?: string | null;
    qrText?: string;
    autoPlay?: boolean;
    forceSlide?: number | null;
    voiceId?: string | null;
}

export default function ReelPreview({
    slides,
    themeId,
    brandName = "YourBrand",
    watermarkUrl,
    watermarkOpacity = 18,
    logoUrl,
    logoSize = 120,
    qrCodeUrl = null,
    qrText = "",
    autoPlay = true,
    forceSlide = null,
    voiceId = null,
}: ReelPreviewProps) {
    const theme: Theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
    const allSlides = [...slides, "__LOGO__"];
    const [currentSlide, setCurrentSlide] = useState(0);
    const [animState, setAnimState] = useState<"in" | "hold" | "out">("in");
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Sync with forceSlide
    useEffect(() => {
        if (forceSlide !== null && forceSlide !== undefined) {
            setCurrentSlide(forceSlide);
            setAnimState("hold");
        }
    }, [forceSlide]);

    // advanceRef holds the function to move to the next slide —
    // called by either the safety timer or the audio.onended handler
    const advanceRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!autoPlay || forceSlide !== null) return;

        const doAdvance = () => {
            clearTimeout(timerRef.current);
            setAnimState("out");
            timerRef.current = setTimeout(() => {
                setCurrentSlide((prev) => (prev + 1) % allSlides.length);
            }, 400);
        };
        advanceRef.current = doAdvance;

        setAnimState("in");
        timerRef.current = setTimeout(() => {
            setAnimState("hold");

            if (!voiceId) {
                // No voice selected — use fixed 4-second hold
                timerRef.current = setTimeout(doAdvance, 4000);
            } else {
                // Voice is selected — slide will advance from the TTS onended handler.
                // Safety net: advance after 12s regardless so slides never hang.
                timerRef.current = setTimeout(doAdvance, 12000);
            }
        }, 600);

        return () => clearTimeout(timerRef.current);
    }, [currentSlide, autoPlay, forceSlide, allSlides.length, voiceId]);

    const opacity = animState === "in" ? 0 : animState === "hold" ? 1 : 0;
    const translateY = animState === "in" ? 14 : animState === "hold" ? 0 : -6;

    const isLogoSlide = allSlides[currentSlide] === "__LOGO__";
    const currentSlideData = allSlides[currentSlide];
    const isObjectSlide = typeof currentSlideData === "object" && currentSlideData !== null && "text" in currentSlideData;

    // Font mapping helper
    const getFontCSS = (file: string) => {
        const map: Record<string, string> = {
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
        return map[file] || "inherit";
    };

    const slideText = isObjectSlide ? (currentSlideData as Slide).text : currentSlideData as string;
    const slideFontSize = isObjectSlide ? `${(currentSlideData as Slide).fontSize / 80}rem` : "1.1rem";
    // Fall back to theme text color when no custom color is set (empty or missing)
    const rawColor = isObjectSlide ? (currentSlideData as Slide).textColor : "";
    const slideColor = rawColor && rawColor !== "" ? rawColor : theme.textColor;
    const slideFontFamily = isObjectSlide ? getFontCSS((currentSlideData as Slide).fontFamily) : "inherit";

    // Real ElevenLabs preview audio — fires when slide becomes visible
    useEffect(() => {
        if (!autoPlay || forceSlide !== null || isLogoSlide) return;
        if (animState !== "hold") return;
        if (!voiceId || !slideText) return;

        // Cancel any in-flight request/audio from the previous slide
        if (abortRef.current) abortRef.current.abort();
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }

        const controller = new AbortController();
        abortRef.current = controller;
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        fetch(`${apiBase}/tts/preview`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: slideText, voice_id: voiceId }),
            signal: controller.signal,
        })
            .then((res) => {
                if (!res.ok) throw new Error("TTS failed");
                return res.blob();
            })
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audioRef.current = audio;
                audio.play().catch(() => { });
                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    // Advance slide as soon as speech finishes — clears the safety timer
                    advanceRef.current?.();
                };
            })
            .catch(() => {
                // TTS failed — let the 12s safety timer handle advancement
            });

        return () => {
            controller.abort();
            if (audioRef.current) { audioRef.current.pause(); }
        };
    }, [animState, currentSlide, autoPlay, forceSlide, isLogoSlide, slideText, voiceId]);

    return (
        <div className="relative mx-auto overflow-hidden rounded-3xl select-none" style={{ width: 270, height: 480, background: theme.bgGradient }}>
            {/* Watermark photo */}
            {watermarkUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={watermarkUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: watermarkOpacity / 100 }}
                />
            )}

            {/* Color overlay */}
            <div className="absolute inset-0" style={{ background: theme.overlayColor, opacity: 0.7 }} />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
                {isLogoSlide ? (
                    <div
                        className="flex flex-col items-center gap-4"
                        style={{
                            opacity,
                            transform: `translateY(${translateY}px)`,
                            transition: "opacity 0.4s ease, transform 0.4s ease",
                        }}
                    >
                        {logoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={logoUrl} alt={brandName} style={{ maxWidth: logoSize, maxHeight: logoSize }} className="object-contain" />
                        ) : (
                            <div
                                className="rounded-2xl flex items-center justify-center text-2xl font-black"
                                style={{ width: logoSize, height: logoSize, background: theme.accentColor, color: theme.textColor }}
                            >
                                {brandName.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <p className="text-sm font-bold text-center" style={{ color: theme.textColor }}>
                            {brandName}
                        </p>
                        {/* Custom QR Code (Optional) */}
                        {qrCodeUrl && (
                            <div className="flex flex-col items-center gap-1 mt-2">
                                <div className="rounded-lg overflow-hidden" style={{ width: logoSize * 0.6, height: logoSize * 0.6, background: "#fff", padding: "4px" }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                                </div>
                                {qrText && (
                                    <p className="text-xs font-medium text-center" style={{ color: theme.textColor, opacity: 0.9 }}>
                                        {qrText}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <p
                        className="text-center font-bold leading-snug"
                        style={{
                            color: slideColor,
                            fontSize: slideFontSize,
                            fontFamily: slideFontFamily,
                            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                            opacity,
                            transform: `translateY(${translateY}px)`,
                            transition: "opacity 0.4s ease, transform 0.4s ease",
                        }}
                    >
                        {slideText}
                    </p>
                )}
            </div>

            {/* Progress dots */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
                {allSlides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => { setCurrentSlide(i); setAnimState("in"); }}
                        className="rounded-full transition-all duration-300"
                        style={{
                            width: i === currentSlide ? 20 : 6,
                            height: 6,
                            background: i === currentSlide ? theme.accentColor : "rgba(255,255,255,0.3)",
                        }}
                    />
                ))}
            </div>

            {/* Recording indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>PREV</span>
            </div>

            {/* Frame size badge */}
            <div className="absolute top-4 left-4 text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.5)" }}>
                1080×1920
            </div>
        </div >
    );
}
