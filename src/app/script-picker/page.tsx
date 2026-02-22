"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Settings2, Trash2, Plus, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import ScriptCard from "@/components/ScriptCard";

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
    "#ffffff", "#a78bfa", "#2dd4bf", "#facc15", "#f87171", "#38bdf8", "#fb923c", "#4ade80", "#e879f9", "#94a3b8", "#1e293b"
];

const DEFAULT_SLIDE_STYLE = {
    fontSize: 88,
    textColor: "#ffffff",
    fontFamily: FONT_OPTIONS[0].value,
};

export default function ScriptPickerPage() {
    const router = useRouter();
    const [customTitle, setCustomTitle] = useState("");
    const [slides, setSlides] = useState<Slide[]>([{ text: "", ...DEFAULT_SLIDE_STYLE }]);
    const [outroVoiceover, setOutroVoiceover] = useState("");

    // AI Generation States
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiSlideCount, setAiSlideCount] = useState(3);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    useEffect(() => {
        // Restore custom/in-progress script
        const saved = localStorage.getItem("reelforge_script");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.id === "custom") {
                setCustomTitle(parsed.title);
                if (parsed.outroVoiceover) setOutroVoiceover(parsed.outroVoiceover);
                const loadedSlides = parsed.slides.map((s: any) =>
                    typeof s === "string" ? { text: s, ...DEFAULT_SLIDE_STYLE } : s
                );
                setSlides(loadedSlides.length > 0 ? loadedSlides : [{ text: "", ...DEFAULT_SLIDE_STYLE }]);
            }
        }
    }, []);

    const handleContinue = () => {
        const activeSlides = slides.filter(s => s.text.trim() !== "");
        if (activeSlides.length === 0) return;
        if (activeSlides.length > 15) {
            alert("Please limit your custom script to a maximum of 15 slides to ensure optimal video length.");
            return;
        }
        if (activeSlides.some(slide => slide.text.length > 150)) {
            alert("One or more of your slides is too long. Please limit each slide to a maximum of 150 characters.");
            return;
        }
        const script = {
            id: "custom",
            title: customTitle || "Custom Script",
            slides: activeSlides,
            outroVoiceover: outroVoiceover.trim()
        };
        localStorage.setItem("reelforge_script", JSON.stringify(script));
        router.push("/theme-selector");
    };

    const updateSlide = (index: number, updates: Partial<Slide>) => {
        const newSlides = [...slides];
        newSlides[index] = { ...newSlides[index], ...updates };
        setSlides(newSlides);
    };

    const addSlide = () => {
        if (slides.length >= 15) return;
        setSlides([...slides, { text: "", ...DEFAULT_SLIDE_STYLE }]);
    };

    const removeSlide = (index: number) => {
        if (slides.length <= 1) return;
        setSlides(slides.filter((_, i) => i !== index));
    };

    const handleGenerateScript = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!aiPrompt.trim()) return;

        setIsGenerating(true);
        setAiError(null);

        try {
            // Retrieve website URL from saved brand data if it exists
            const savedBrandData = localStorage.getItem("reelforge_brand");
            let websiteUrl = undefined;
            if (savedBrandData) {
                const parsedBrand = JSON.parse(savedBrandData);
                if (parsedBrand.websiteUrl) {
                    websiteUrl = parsedBrand.websiteUrl;
                }
            }

            const res = await fetch("/api/generate-script", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: aiPrompt, websiteUrl, slideCount: aiSlideCount })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate script");

            setCustomTitle(data.title);
            setSlides(data.slides.map((s: string) => ({ text: s, ...DEFAULT_SLIDE_STYLE })));
            setAiPrompt(""); // clear prompt on success
        } catch (err: any) {
            setAiError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="page-container">
            <Navbar currentStep={1} />
            <main className="max-w-3xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-10">
                    <p className="step-indicator mb-3">
                        <span>Step 2 of 5</span>
                        <span className="text-xs mx-1">·</span>
                        <span style={{ color: "#a78bfa" }}>Script Picker</span>
                    </p>
                    <h1 className="section-title">Choose your script</h1>
                    <p className="section-subtitle">
                        Each script is crafted to create an emotional connection. Pick the one that fits your brand story.
                    </p>
                </div>

                {/* Scripts Generator Area */}
                <div className="space-y-4 mb-10">
                    <div
                        className="glass-card rounded-2xl p-6 transition-all duration-300"
                        style={{
                            border: `2px solid #7c3aed`,
                            boxShadow: "0 0 30px rgba(124,58,237,0.15)"
                        }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold" style={{ color: "#f8fafc" }}>Write Your Own (or use AI ✨)</h3>
                        </div>
                        <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>
                            Have your own message? Type it out line by line to generate custom slides, or let our AI write it for you.
                        </p>

                        <div className="space-y-6 mt-6 pt-6 border-t" style={{ borderColor: "rgba(45,45,74,0.6)" }}>
                            {/* AI Generator Box */}
                            <div className="p-4 rounded-xl border" style={{ background: "rgba(124,58,237,0.05)", borderColor: "rgba(124,58,237,0.2)" }}>
                                <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: "#a78bfa" }}>
                                    <span>✨ Generate Script with AI</span>
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="E.g., A funny script about drinking too much coffee"
                                        className="input-field flex-1"
                                        disabled={isGenerating}
                                    />
                                    <select
                                        value={aiSlideCount}
                                        onChange={(e) => setAiSlideCount(parseInt(e.target.value))}
                                        className="input-field max-w-[120px]"
                                        disabled={isGenerating}
                                    >
                                        {[...Array(13)].map((_, i) => {
                                            const count = i + 3;
                                            return <option key={count} value={count}>{count} Slides</option>;
                                        })}
                                    </select>
                                    <button
                                        onClick={handleGenerateScript}
                                        disabled={isGenerating || !aiPrompt.trim()}
                                        className="px-4 py-2 rounded-lg font-medium text-white transition-all disabled:opacity-50"
                                        style={{ background: "#7c3aed" }}
                                    >
                                        {isGenerating ? "Generating..." : "Generate"}
                                    </button>
                                </div>
                                {aiError && (
                                    <p className="text-xs mt-2" style={{ color: "#f87171" }}>{aiError}</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2">
                                    <label className="block text-sm font-medium" style={{ color: "#a78bfa" }}>Script Content</label>
                                    <span className="text-xs" style={{ color: "#64748b" }}>{slides.length}/15 Slides</span>
                                </div>

                                <div className="space-y-4">
                                    {slides.map((slide, index) => (
                                        <div
                                            key={index}
                                            className="p-4 rounded-xl border transition-all"
                                            style={{ background: "rgba(15,15,26,0.3)", borderColor: "rgba(45,45,74,0.6)" }}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "rgba(124,58,237,0.1)", color: "#a78bfa" }}>Slide {index + 1}</span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeSlide(index); }}
                                                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                                        disabled={slides.length <= 1}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <textarea
                                                value={slide.text}
                                                onChange={(e) => updateSlide(index, { text: e.target.value })}
                                                placeholder="Enter slide text..."
                                                className="input-field w-full min-h-[80px] text-sm py-2 mb-3 leading-relaxed border-none bg-transparent focus:ring-1 focus:ring-brand-purple"
                                            />

                                            {/* Row of controls */}
                                            <div className="flex flex-wrap items-center gap-4 pt-3 border-t" style={{ borderColor: "rgba(45,45,74,0.4)" }}>
                                                <div className="flex items-center gap-2">
                                                    <Settings2 className="w-3.5 h-3.5" style={{ color: "#64748b" }} />
                                                    <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "#64748b" }}>Styles</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px]" style={{ color: "#94a3b8" }}>Font:</span>
                                                    <select
                                                        value={slide.fontFamily}
                                                        onChange={(e) => updateSlide(index, { fontFamily: e.target.value })}
                                                        className="bg-transparent text-[11px] border border-white/10 rounded px-1 min-w-[70px] outline-none focus:ring-1 focus:ring-brand-purple"
                                                        style={{ color: "#a78bfa" }}
                                                    >
                                                        {FONT_OPTIONS.map(f => (
                                                            <option key={f.value} value={f.value} className="bg-[#1a1a2e] text-white">{f.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px]" style={{ color: "#94a3b8" }}>Size:</span>
                                                    <input
                                                        type="range"
                                                        min="40"
                                                        max="300"
                                                        value={slide.fontSize}
                                                        onChange={(e) => updateSlide(index, { fontSize: parseInt(e.target.value) })}
                                                        className="w-16 accent-brand-purple"
                                                        style={{ accentColor: "#7c3aed" }}
                                                    />
                                                    <span className="text-[11px] font-mono" style={{ color: "#a78bfa" }}>{slide.fontSize}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px]" style={{ color: "#94a3b8" }}>Color:</span>
                                                    <div className="flex flex-wrap gap-1.5 max-w-[150px]">
                                                        {COLOR_OPTIONS.map((color) => (
                                                            <button
                                                                key={color}
                                                                onClick={() => updateSlide(index, { textColor: color })}
                                                                className={`w-4 h-4 rounded-full border border-white/10 transition-transform ${slide.textColor === color ? "scale-125 ring-1 ring-brand-purple" : "hover:scale-110"}`}
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                        <input
                                                            type="color"
                                                            value={slide.textColor}
                                                            onChange={(e) => updateSlide(index, { textColor: e.target.value })}
                                                            className="w-4 h-4 bg-transparent border-none cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={addSlide}
                                        disabled={slides.length >= 15}
                                        className="w-full py-3 rounded-xl border border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-all hover:bg-white/5 disabled:opacity-50"
                                        style={{ borderColor: "rgba(124,58,237,0.3)", color: "#a78bfa" }}
                                    >
                                        <Plus className="w-4 h-4" /> Add Slide
                                    </button>
                                </div>
                            </div>

                            {/* Final Logo Slide Outro Input */}
                            <div className="mt-8 pt-6 border-t" style={{ borderColor: "rgba(45,45,74,0.6)" }}>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium flex items-center gap-2" style={{ color: "#a78bfa" }}>
                                        <span>🎙️ Final Logo Slide (Voiceover Only)</span>
                                    </label>
                                    <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>
                                        This text will not appear on screen. It will only be spoken by the AI voiceover during the final logo slide (e.g., &quot;Visit our website today.&quot;)
                                    </p>
                                    <div className="p-4 rounded-xl border transition-all" style={{ background: "rgba(15,15,26,0.5)", border: "1px dashed rgba(124,58,237,0.4)" }}>
                                        <textarea
                                            value={outroVoiceover}
                                            onChange={(e) => setOutroVoiceover(e.target.value)}
                                            placeholder="Enter what the voiceover should say at the end..."
                                            className="input-field w-full min-h-[60px] text-sm py-2 leading-relaxed border-none bg-transparent focus:ring-1 focus:ring-brand-purple"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tip */}
                {(slides.some(s => s.text.trim().length > 0)) && (
                    <div className="rounded-xl px-4 py-3 flex gap-3 mb-8" style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.2)" }}>
                        <span>✨</span>
                        <p className="text-sm" style={{ color: "#94a3b8" }}>
                            <strong style={{ color: "#2dd4bf" }}>
                                &quot;{customTitle || "Custom Script"}&quot;
                            </strong>{" "}
                            — {slides.filter(s => s.text.trim().length > 0).length} slides will be animated.
                        </p>
                    </div>
                )}

                <button
                    onClick={handleContinue}
                    disabled={!slides.some(s => s.text.trim().length > 0)}
                    className="btn-primary w-full justify-center py-4 text-base"
                    style={{ opacity: (!slides.some(s => s.text.trim().length > 0)) ? 0.5 : 1 }}
                >
                    Continue to Theme <ArrowRight className="w-5 h-5" />
                </button>
            </main>
        </div>
    );
}
