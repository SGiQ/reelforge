"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, Play, Pause } from "lucide-react";
import Navbar from "@/components/Navbar";
import ReelPreview from "@/components/ReelPreview";

export default function PreviewPage() {
    const router = useRouter();
    const [brand, setBrand] = useState<{ brandName: string; logoPreview?: string; watermarkPreview?: string } | null>(null);
    const [script, setScript] = useState<{ title: string; slides: string[] } | null>(null);
    const [theme, setTheme] = useState("dark");
    const [playing, setPlaying] = useState(true);

    useEffect(() => {
        const b = localStorage.getItem("reelforge_brand");
        const s = localStorage.getItem("reelforge_script");
        const t = localStorage.getItem("reelforge_theme");
        if (b) setBrand(JSON.parse(b));
        if (s) setScript(JSON.parse(s));
        if (t) setTheme(t);
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
                                autoPlay={playing}
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
                            <div className="space-y-2">
                                {script.slides.map((slide, i) => (
                                    <div key={i} className="flex gap-3 items-start rounded-lg px-3 py-2.5" style={{ background: "rgba(15,15,26,0.5)" }}>
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(124,58,237,0.25)", color: "#a78bfa" }}>{i + 1}</span>
                                        <p className="text-sm" style={{ color: "#94a3b8" }}>{slide}</p>
                                    </div>
                                ))}
                                <div className="flex gap-3 items-center rounded-lg px-3 py-2.5" style={{ background: "rgba(13,148,136,0.08)" }}>
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(13,148,136,0.25)", color: "#2dd4bf" }}>
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
