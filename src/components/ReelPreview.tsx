"use client";
import { useState, useEffect, useRef } from "react";
import { THEMES, Theme } from "./ThemeCard";

interface ReelPreviewProps {
    slides: string[];
    themeId: string;
    brandName?: string;
    watermarkUrl?: string | null;
    logoUrl?: string | null;
    autoPlay?: boolean;
}

export default function ReelPreview({
    slides,
    themeId,
    brandName = "YourBrand",
    watermarkUrl,
    logoUrl,
    autoPlay = true,
}: ReelPreviewProps) {
    const theme: Theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
    const allSlides = [...slides, "__LOGO__"];
    const [currentSlide, setCurrentSlide] = useState(0);
    const [animState, setAnimState] = useState<"in" | "hold" | "out">("in");
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        if (!autoPlay) return;

        const runCycle = () => {
            setAnimState("in");
            timerRef.current = setTimeout(() => {
                setAnimState("hold");
                timerRef.current = setTimeout(() => {
                    setAnimState("out");
                    timerRef.current = setTimeout(() => {
                        setCurrentSlide((prev) => (prev + 1) % allSlides.length);
                    }, 400);
                }, 1800);
            }, 600);
        };

        runCycle();
        return () => clearTimeout(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSlide, autoPlay]);

    const opacity = animState === "in" ? 0 : animState === "hold" ? 1 : 0;
    const translateY = animState === "in" ? 14 : animState === "hold" ? 0 : -6;

    const isLogoSlide = allSlides[currentSlide] === "__LOGO__";

    return (
        <div className="relative mx-auto overflow-hidden rounded-3xl select-none" style={{ width: 270, height: 480, background: theme.bgGradient }}>
            {/* Watermark photo */}
            {watermarkUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={watermarkUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: 0.18 }}
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
                            <img src={logoUrl} alt={brandName} className="max-w-[120px] max-h-20 object-contain" />
                        ) : (
                            <div
                                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black"
                                style={{ background: theme.accentColor, color: theme.textColor }}
                            >
                                {brandName.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <p className="text-sm font-bold text-center" style={{ color: theme.textColor }}>
                            {brandName}
                        </p>
                        {/* QR Code placeholder */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden" style={{ background: "#fff", padding: "4px" }}>
                            {/* Checkered QR placeholder */}
                            <svg viewBox="0 0 21 21" className="w-full h-full">
                                {Array.from({ length: 441 }, (_, i) => {
                                    const x = i % 21;
                                    const y = Math.floor(i / 21);
                                    const isCorner =
                                        (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
                                    const innerCorner =
                                        (x > 1 && x < 5 && y > 1 && y < 5) ||
                                        (x > 15 && x < 19 && y > 1 && y < 5) ||
                                        (x > 1 && x < 5 && y > 15 && y < 19);
                                    const fill = isCorner
                                        ? innerCorner
                                            ? "#000"
                                            : x === 0 || x === 6 || y === 0 || y === 6 ||
                                                x === 14 || x === 20 || y === 14 || y === 20
                                                ? "#000"
                                                : "#fff"
                                        : (x + y) % 3 === 0
                                            ? "#000"
                                            : "#fff";
                                    return (
                                        <rect key={i} x={x} y={y} width={1} height={1} fill={fill} />
                                    );
                                })}
                            </svg>
                        </div>
                    </div>
                ) : (
                    <p
                        className="text-center font-bold leading-snug"
                        style={{
                            color: theme.textColor,
                            fontSize: "1.1rem",
                            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                            opacity,
                            transform: `translateY(${translateY}px)`,
                            transition: "opacity 0.4s ease, transform 0.4s ease",
                        }}
                    >
                        {allSlides[currentSlide]}
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
        </div>
    );
}
