"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, Play, Pause } from "lucide-react";
import Navbar from "@/components/Navbar";
import ReelPreview from "@/components/ReelPreview";
import { Settings2, Type, Palette } from "lucide-react";

interface Slide {
    text: string;
    fontSize: number;
    textColor: string;
    fontFamily: string;
}

const FONT_OPTIONS = [
    { label: "Inter (Sans)", value: "DejaVuSans-Bold.ttf", css: "Inter, sans-serif" },
    { label: "Montserrat", value: "Montserrat-Bold.ttf", css: "Montserrat, sans-serif" },
    { label: "Oswald", value: "Oswald-Bold.ttf", css: "Oswald, sans-serif" },
    { label: "Bebas Neue", value: "BebasNeue-Regular.ttf", css: "'Bebas Neue', sans-serif" },
    { label: "Playfair", value: "PlayfairDisplay-Bold.ttf", css: "'Playfair Display', serif" },
    { label: "Outfit", value: "Outfit-Bold.ttf", css: "Outfit, sans-serif" },
    { label: "Space Mono", value: "SpaceMono-Bold.ttf", css: "'Space Mono', monospace" },
    { label: "Cinzel", value: "Cinzel-Bold.ttf", css: "Cinzel, serif" },
    { label: "Serif", value: "DejaVuSerif.ttf", css: "serif" },
    { label: "Mono", value: "DejaVuSansMono.ttf", css: "monospace" },
];

const COLOR_OPTIONS = [
    "#ffffff", // White
    "#a78bfa", // Purple
    "#2dd4bf", // Teal
    "#facc15", // Yellow
    "#f87171", // Red
    "#38bdf8", // Sky Blue
    "#fb923c", // Orange
    "#4ade80", // Green
    "#e879f9", // Fuchsia
    "#94a3b8", // Slate
    "#1e293b", // Navy
];

export default function PreviewPage() {
    const router = useRouter();
    const [brand, setBrand] = useState<{ brandName: string; logoPreview?: string; watermarkPreview?: string } | null>(null);
    const [script, setScript] = useState<{ title: string; slides: (string | Slide)[] } | null>(null);
    const [theme, setTheme] = useState("dark");
    const [playing, setPlaying] = useState(true);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [voiceId, setVoiceId] = useState<string | null>(null);

    useEffect(() => {
        const b = localStorage.getItem("reelforge_brand");
        const s = localStorage.getItem("reelforge_script");
        const t = localStorage.getItem("reelforge_theme");
        const a = localStorage.getItem("reelforge_audio");
        if (b) setBrand(JSON.parse(b));
        if (s) setScript(JSON.parse(s));
        if (t) setTheme(t);
        if (a) {
            const parsed = JSON.parse(a);
            if (parsed.aiVoice) setVoiceId(parsed.aiVoice);
        }
    }, []);

    if (!brand || !script) {
        return (
            <div className="page-container">
                <Navbar currentStep={3} />
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <p style={{ color: "#64748b" }}>No reel configured yet.</p>
                    <button className="btn-primary" onClick={() => router.push("/brand-setup")}>
                        Start from Brand Setup
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <Navbar currentStep={3} />
            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <p className="step-indicator mb-3">
                        <span>Step 4 of 5</span>
                        <span className="text-xs mx-1">·</span>
                        <span style={{ color: "#a78bfa" }}>Live Preview</span>
                    </p>
                    <h1 className="section-title">Preview your reel</h1>
                    <p className="section-subtitle">This is exactly what your MP4 will look like — slides animate in sequence.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    {/* Preview phone */}
                    <div className="flex flex-col items-center gap-5 flex-shrink-0">
                        {/* Phone frame */}
                        <div className="relative p-3 rounded-[42px]" style={{ background: "linear-gradient(145deg, #2d2d4a, #1a1a2e)", boxShadow: "0 0 0 2px #2d2d4a, 0 20px 60px rgba(0,0,0,0.6)", border: "1px solid rgba(45,45,74,0.8)" }}>
                            {/* Camera notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-2xl z-10" style={{ background: "#1a1a2e" }} />
                            <ReelPreview
                                slides={script.slides}
                                themeId={theme}
                                brandName={brand.brandName}
                                watermarkUrl={brand.watermarkPreview}
                                logoUrl={brand.logoPreview}
                                watermarkOpacity={(brand as any).watermarkOpacity ?? 18}
                                logoSize={(brand as any).logoSize ?? 120}
                                qrCodeUrl={(brand as any).qrCodePreview ?? null}
                                qrText={(brand as any).qrCodeText ?? ""}
                                autoPlay={playing}
                                forceSlide={editIndex}
                                voiceId={voiceId}
                            />
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setPlaying((p) => !p)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                                style={{ background: "rgba(36,36,56,0.8)", border: "1px solid rgba(45,45,74,0.6)", color: "#a78bfa" }}
                            >
                                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {playing ? "Pause" : "Play"}
                            </button>
                            <button
                                onClick={() => { setPlaying(false); setTimeout(() => setPlaying(true), 50); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                                style={{ background: "rgba(36,36,56,0.8)", border: "1px solid rgba(45,45,74,0.6)", color: "#94a3b8" }}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Restart
                            </button>
                        </div>
                    </div>

                    {/* Reel summary */}
                    <div className="flex-1 space-y-5">
                        <div className="glass-card rounded-2xl p-6 space-y-4">
                            <h2 className="text-lg font-bold">Reel Summary</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "rgba(45,45,74,0.4)" }}>
                                    <span className="text-sm" style={{ color: "#94a3b8" }}>Brand</span>
                                    <span className="text-sm font-semibold">{brand.brandName}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "rgba(45,45,74,0.4)" }}>
                                    <span className="text-sm" style={{ color: "#94a3b8" }}>Script</span>
                                    <span className="text-sm font-semibold">{script.title}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "rgba(45,45,74,0.4)" }}>
                                    <span className="text-sm" style={{ color: "#94a3b8" }}>Slides</span>
                                    <span className="text-sm font-semibold">{script.slides.length + 1} (incl. logo)</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "rgba(45,45,74,0.4)" }}>
                                    <span className="text-sm" style={{ color: "#94a3b8" }}>Theme</span>
                                    <span className="text-sm font-semibold capitalize">{theme.replace("-", " ")}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "rgba(45,45,74,0.4)" }}>
                                    <span className="text-sm" style={{ color: "#94a3b8" }}>Format</span>
                                    <span className="text-sm font-semibold">1080 × 1920 · MP4</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm" style={{ color: "#94a3b8" }}>Watermark</span>
                                    <span className="text-sm font-semibold">{brand.watermarkPreview ? "✓ Uploaded" : "None"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Slides list */}
                        <div className="glass-card rounded-2xl p-6">
                            <h2 className="text-lg font-bold mb-4">Slide Sequence</h2>
                            <div className="space-y-3">
                                {script.slides.map((slide, i) => {
                                    const isEditing = editIndex === i;
                                    const slideObj = typeof slide === "string" ? { text: slide, fontSize: 88, textColor: "", fontFamily: FONT_OPTIONS[0].value } : slide as Slide;

                                    const updateSlideStyle = (updates: Partial<Slide>) => {
                                        if (!script) return;
                                        const newSlides = [...script.slides];
                                        newSlides[i] = { ...slideObj, ...updates };
                                        const newScript = { ...script, slides: newSlides };
                                        setScript(newScript);
                                        localStorage.setItem("reelforge_script", JSON.stringify(newScript));
                                    };

                                    return (
                                        <div key={i} className="flex flex-col gap-2 rounded-xl p-3 transition-all" style={{ background: isEditing ? "rgba(124,58,237,0.08)" : "rgba(15,15,26,0.5)", border: `1px solid ${isEditing ? "rgba(124,58,237,0.3)" : "transparent"}` }}>
                                            <div className="flex gap-3 items-center">
                                                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(124,58,237,0.25)", color: "#a78bfa" }}>{i + 1}</span>
                                                <p className="text-sm flex-1 truncate" style={{ color: isEditing ? "#fff" : "#94a3b8" }}>
                                                    {slideObj.text}
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        const targetIndex = isEditing ? null : i;
                                                        setEditIndex(targetIndex);
                                                        if (targetIndex !== null) setPlaying(false);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                                    style={{ color: isEditing ? "#7c3aed" : "#64748b" }}
                                                >
                                                    <Settings2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {isEditing && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>Font Style</span>
                                                            <div className="flex flex-wrap gap-1 max-w-[120px]">
                                                                {COLOR_OPTIONS.map(c => (
                                                                    <button
                                                                        key={c}
                                                                        onClick={() => updateSlideStyle({ textColor: c })}
                                                                        className={`w-3.5 h-3.5 rounded-full ring-1 ring-white/10 ${slideObj.textColor === c ? "ring-2 ring-brand-teal scale-110" : ""}`}
                                                                        style={{ background: c }}
                                                                    />
                                                                ))}
                                                                <input
                                                                    type="color"
                                                                    value={slideObj.textColor}
                                                                    onChange={(e) => updateSlideStyle({ textColor: e.target.value })}
                                                                    className="w-3.5 h-3.5 bg-transparent border-none cursor-pointer"
                                                                />
                                                            </div>
                                                        </div>
                                                        <select
                                                            value={slideObj.fontFamily}
                                                            onChange={(e) => updateSlideStyle({ fontFamily: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-brand-purple"
                                                        >
                                                            {FONT_OPTIONS.map(f => (
                                                                <option key={f.value} value={f.value} className="bg-[#1a1a2e]">{f.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>Size</span>
                                                            <span className="text-[11px] font-mono text-brand-purple">{slideObj.fontSize}px</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="40" max="300"
                                                            value={slideObj.fontSize}
                                                            onChange={(e) => updateSlideStyle({ fontSize: parseInt(e.target.value) })}
                                                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-purple"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div className="flex gap-3 items-center rounded-lg px-3 py-2.5 opacity-60" style={{ background: "rgba(13,148,136,0.08)" }}>
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(13,148,136,0.25)", color: "#2dd4bf" }}>
                                        {script.slides.length + 1}
                                    </span>
                                    <p className="text-sm" style={{ color: "#2dd4bf" }}>Logo + QR code (final slide)</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <button
                            onClick={() => router.push("/export")}
                            className="btn-primary w-full justify-center py-4 text-base"
                        >
                            Render My MP4 <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => router.push("/theme-selector")}
                            className="btn-secondary w-full justify-center py-3 text-sm"
                        >
                            Change Theme
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
