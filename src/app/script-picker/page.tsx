"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Settings2, Trash2, Plus, Video, Film, ChevronUp, ChevronDown, Type, Scissors, Search } from "lucide-react";
import { upload } from "@vercel/blob/client";
import Navbar from "@/components/Navbar";
import StockSearch, { StockClip } from "@/components/StockSearch";
import { Scene, VideoScene, DEFAULT_SCENE_STYLE, isVideoScene, toScene, isRenderableScene } from "@/lib/scenes";

const FONT_OPTIONS = [
    { label: "Inter (Sans)", value: "DejaVuSans-Bold.ttf" },
    { label: "Montserrat", value: "Montserrat-Bold.ttf" },
    { label: "Oswald", value: "Oswald-Bold.ttf" },
    { label: "Bebas Neue", value: "BebasNeue-Regular.ttf" },
    { label: "Playfair", value: "PlayfairDisplay-Bold.ttf" },
    { label: "Outfit", value: "Outfit-Bold.ttf" },
    { label: "Space Mono", value: "SpaceMono-Bold.ttf" },
    { label: "Cinzel", value: "Cinzel-Bold.ttf" },
    { label: "Serif", value: "DejaVuSerif.ttf" },
    { label: "Mono", value: "DejaVuSansMono.ttf" },
];

const COLOR_OPTIONS = [
    "#ffffff", "#a78bfa", "#2dd4bf", "#facc15", "#f87171", "#38bdf8", "#fb923c", "#4ade80", "#e879f9", "#94a3b8", "#1e293b"
];

const MAX_SCENES = 15;

function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
        try {
            const url = URL.createObjectURL(file);
            const v = document.createElement("video");
            v.preload = "metadata";
            v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(isFinite(v.duration) ? v.duration : 0); };
            v.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
            v.src = url;
        } catch { resolve(0); }
    });
}

export default function ScriptPickerPage() {
    const router = useRouter();
    const [customTitle, setCustomTitle] = useState("");
    const [scenes, setScenes] = useState<Scene[]>([{ kind: "text", text: "", ...DEFAULT_SCENE_STYLE }]);
    const [outroVoiceover, setOutroVoiceover] = useState("");

    // Per-scene video upload progress (index -> uploading?)
    const [uploading, setUploading] = useState<Record<number, boolean>>({});
    const [showStock, setShowStock] = useState<Record<number, boolean>>({});
    const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

    // AI Generation States
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiSlideCount, setAiSlideCount] = useState(3);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("reelforge_script");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.id === "custom") {
                    setCustomTitle(parsed.title || "");
                    if (parsed.outroVoiceover) setOutroVoiceover(parsed.outroVoiceover);
                    const loaded = (parsed.slides || []).map(toScene);
                    setScenes(loaded.length > 0 ? loaded : [{ kind: "text", text: "", ...DEFAULT_SCENE_STYLE }]);
                }
            } catch (e) { }
        }
    }, []);

    const updateScene = (index: number, updates: Record<string, any>) => {
        setScenes((prev) => prev.map((s, i) => (i === index ? ({ ...s, ...updates } as Scene) : s)));
    };

    const addTextScene = () => {
        if (scenes.length >= MAX_SCENES) return;
        setScenes((prev) => [...prev, { kind: "text", text: "", ...DEFAULT_SCENE_STYLE }]);
    };

    const addVideoScene = () => {
        if (scenes.length >= MAX_SCENES) return;
        setScenes((prev) => [...prev, { kind: "video", videoUrl: "", trimStart: 0, trimEnd: 0, text: "", ...DEFAULT_SCENE_STYLE }]);
    };

    const removeScene = (index: number) => {
        if (scenes.length <= 1) return;
        setScenes((prev) => prev.filter((_, i) => i !== index));
    };

    const moveScene = (index: number, dir: -1 | 1) => {
        setScenes((prev) => {
            const next = [...prev];
            const target = index + dir;
            if (target < 0 || target >= next.length) return prev;
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const handleVideoUpload = async (index: number, file: File) => {
        setUploading((u) => ({ ...u, [index]: true }));
        try {
            const duration = await getVideoDuration(file);
            const blob = await upload(file.name, file, {
                access: "public",
                handleUploadUrl: `${window.location.origin}/api/upload`,
                clientPayload: "video-scene",
            });
            // Default trim = whole clip (capped so a stray long upload doesn't bloat the reel).
            const end = duration > 0 ? Math.min(duration, 15) : 0;
            updateScene(index, { videoUrl: blob.url, trimStart: 0, trimEnd: end } as Partial<VideoScene>);
        } catch (e: any) {
            setAiError(`Video upload failed: ${e.message || "unknown error"}`);
        } finally {
            setUploading((u) => ({ ...u, [index]: false }));
        }
    };

    const handleStockSelect = (index: number, clip: StockClip) => {
        const end = clip.duration && clip.duration > 0 ? Math.min(clip.duration, 15) : 0;
        updateScene(index, { videoUrl: clip.downloadUrl, trimStart: 0, trimEnd: end } as Partial<VideoScene>);
        setShowStock((s) => ({ ...s, [index]: false }));
    };

    const handleContinue = () => {
        const active = scenes.filter(isRenderableScene);
        if (active.length === 0) return;
        if (active.length > MAX_SCENES) {
            alert(`Please limit your reel to ${MAX_SCENES} scenes.`);
            return;
        }
        const longText = active.find((s) => !isVideoScene(s) && s.text.length > 150);
        if (longText) {
            alert("One or more text scenes is too long. Limit each to 150 characters.");
            return;
        }
        const script = {
            id: "custom",
            title: customTitle || "Custom Script",
            slides: active,
            outroVoiceover: outroVoiceover.trim(),
        };
        localStorage.setItem("reelforge_script", JSON.stringify(script));
        router.push("/theme-selector");
    };

    const handleGenerateScript = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        setAiError(null);
        try {
            const savedBrandData = localStorage.getItem("reelforge_brand");
            let websiteUrl = undefined;
            if (savedBrandData) {
                const parsedBrand = JSON.parse(savedBrandData);
                if (parsedBrand.websiteUrl) websiteUrl = parsedBrand.websiteUrl;
            }
            const res = await fetch("/api/generate-script", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: aiPrompt, websiteUrl, slideCount: aiSlideCount }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate script");
            setCustomTitle(data.title);
            setScenes(data.slides.map((s: string) => ({ kind: "text", text: s, ...DEFAULT_SCENE_STYLE })));
            setAiPrompt("");
        } catch (err: any) {
            setAiError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const hasContent = scenes.some(isRenderableScene);

    // Compact style controls shared by text scenes and video captions.
    // Defined as a render function (not a nested component) so inputs keep focus.
    const styleControls = (index: number, scene: Scene) => (
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t" style={{ borderColor: "rgba(45,45,74,0.4)" }}>
            <div className="flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5" style={{ color: "#64748b" }} />
                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "#64748b" }}>Styles</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: "#94a3b8" }}>Font:</span>
                <select
                    value={scene.fontFamily}
                    onChange={(e) => updateScene(index, { fontFamily: e.target.value })}
                    className="bg-transparent text-[11px] border border-white/10 rounded px-1 min-w-[70px] outline-none focus:ring-1 focus:ring-brand-purple"
                    style={{ color: "#a78bfa" }}
                >
                    {FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value} className="bg-[#1a1a2e] text-white">{f.label}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: "#94a3b8" }}>Size:</span>
                <input
                    type="range" min="40" max="300"
                    value={scene.fontSize}
                    onChange={(e) => updateScene(index, { fontSize: parseInt(e.target.value) })}
                    className="w-16 accent-brand-purple" style={{ accentColor: "#7c3aed" }}
                />
                <span className="text-[11px] font-mono" style={{ color: "#a78bfa" }}>{scene.fontSize}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: "#94a3b8" }}>Color:</span>
                <div className="flex flex-wrap gap-1.5 max-w-[150px]">
                    {COLOR_OPTIONS.map((color) => (
                        <button
                            key={color}
                            onClick={() => updateScene(index, { textColor: color })}
                            className={`w-4 h-4 rounded-full border border-white/10 transition-transform ${scene.textColor === color ? "scale-125 ring-1 ring-brand-purple" : "hover:scale-110"}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                    <input
                        type="color" value={scene.textColor}
                        onChange={(e) => updateScene(index, { textColor: e.target.value })}
                        className="w-4 h-4 bg-transparent border-none cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="page-container">
            <Navbar currentStep={1} />
            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <p className="step-indicator mb-3">
                        <span>Step 2 of 5</span>
                        <span className="text-xs mx-1">·</span>
                        <span style={{ color: "#a78bfa" }}>Scenes</span>
                    </p>
                    <h1 className="section-title">Build your scenes</h1>
                    <p className="section-subtitle">
                        Mix text slides and video clips. Add a caption and voiceover to any scene, trim your clips, and reorder them into the story you want.
                    </p>
                </div>

                <div className="space-y-4 mb-10">
                    <div className="glass-card rounded-2xl p-6" style={{ border: "2px solid #7c3aed", boxShadow: "0 0 30px rgba(124,58,237,0.15)" }}>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold" style={{ color: "#f8fafc" }}>Write Your Own (or use AI ✨)</h3>
                        </div>
                        <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>
                            Type your message line by line, drop in video clips, or let AI write the script for you.
                        </p>

                        <div className="space-y-6 mt-6 pt-6 border-t" style={{ borderColor: "rgba(45,45,74,0.6)" }}>
                            {/* AI Generator Box */}
                            <div className="p-4 rounded-xl border" style={{ background: "rgba(124,58,237,0.05)", borderColor: "rgba(124,58,237,0.2)" }}>
                                <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: "#a78bfa" }}>
                                    <span>✨ Generate Script with AI</span>
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="text" value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="E.g., A funny script about drinking too much coffee"
                                        className="input-field flex-1" disabled={isGenerating}
                                    />
                                    <select
                                        value={aiSlideCount}
                                        onChange={(e) => setAiSlideCount(parseInt(e.target.value))}
                                        className="input-field max-w-[120px]" disabled={isGenerating}
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
                                {aiError && <p className="text-xs mt-2" style={{ color: "#f87171" }}>{aiError}</p>}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2">
                                    <label className="block text-sm font-medium" style={{ color: "#a78bfa" }}>Scenes</label>
                                    <span className="text-xs" style={{ color: "#64748b" }}>{scenes.length}/{MAX_SCENES}</span>
                                </div>

                                <div className="space-y-4">
                                    {scenes.map((scene, index) => {
                                        const video = isVideoScene(scene);
                                        return (
                                            <div
                                                key={index}
                                                className="p-4 rounded-xl border transition-all"
                                                style={{ background: "rgba(15,15,26,0.3)", borderColor: video ? "rgba(45,212,191,0.4)" : "rgba(45,45,74,0.6)" }}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1.5"
                                                            style={{ background: video ? "rgba(13,148,136,0.15)" : "rgba(124,58,237,0.1)", color: video ? "#2dd4bf" : "#a78bfa" }}>
                                                            {video ? <Film className="w-3 h-3" /> : <Type className="w-3 h-3" />}
                                                            Scene {index + 1}
                                                        </span>
                                                        <span className="text-[10px] uppercase tracking-wider" style={{ color: "#64748b" }}>{video ? "Video" : "Text"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => moveScene(index, -1)} disabled={index === 0}
                                                            className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30" style={{ color: "#94a3b8" }}>
                                                            <ChevronUp className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => moveScene(index, 1)} disabled={index === scenes.length - 1}
                                                            className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30" style={{ color: "#94a3b8" }}>
                                                            <ChevronDown className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); removeScene(index); }} disabled={scenes.length <= 1}
                                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors disabled:opacity-30">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {video ? (
                                                    <div className="space-y-3">
                                                        <input
                                                            ref={(el) => { fileInputs.current[index] = el; }}
                                                            type="file" accept="video/*" className="hidden"
                                                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(index, f); e.currentTarget.value = ""; }}
                                                        />
                                                        {!(scene as VideoScene).videoUrl ? (
                                                            <div className="space-y-2">
                                                                <button
                                                                    onClick={() => fileInputs.current[index]?.click()}
                                                                    disabled={uploading[index]}
                                                                    className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-all hover:bg-white/5 disabled:opacity-60"
                                                                    style={{ borderColor: "rgba(45,212,191,0.4)" }}
                                                                >
                                                                    <Video className="w-6 h-6" style={{ color: "#2dd4bf" }} />
                                                                    <span className="text-sm font-medium" style={{ color: "#2dd4bf" }}>
                                                                        {uploading[index] ? "Uploading…" : "Upload a video clip"}
                                                                    </span>
                                                                    <span className="text-xs" style={{ color: "#64748b" }}>MP4, MOV or WebM</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => setShowStock((s) => ({ ...s, [index]: !s[index] }))}
                                                                    className="w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all hover:bg-white/5"
                                                                    style={{ borderColor: "rgba(45,45,74,0.6)", color: "#2dd4bf" }}
                                                                >
                                                                    <Search className="w-4 h-4" /> {showStock[index] ? "Hide stock search" : "Search stock footage"}
                                                                </button>
                                                                {showStock[index] && (
                                                                    <div className="pt-1">
                                                                        <StockSearch onSelect={(clip) => handleStockSelect(index, clip)} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex gap-4 items-start">
                                                                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                                                                    <video
                                                                        src={(scene as VideoScene).videoUrl}
                                                                        controls muted playsInline
                                                                        className="rounded-lg flex-shrink-0 bg-black"
                                                                        style={{ width: 120, height: 213, objectFit: "cover" }}
                                                                    />
                                                                    <div className="flex-1 space-y-3">
                                                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: "#2dd4bf" }}>
                                                                            <Scissors className="w-3.5 h-3.5" /> Trim
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <label className="text-[11px]" style={{ color: "#94a3b8" }}>Start (s)</label>
                                                                            <input type="number" min={0} step={0.1}
                                                                                value={(scene as VideoScene).trimStart}
                                                                                onChange={(e) => updateScene(index, { trimStart: Math.max(0, parseFloat(e.target.value) || 0) } as Partial<VideoScene>)}
                                                                                className="input-field w-20 py-1 text-sm" />
                                                                            <label className="text-[11px]" style={{ color: "#94a3b8" }}>End (s)</label>
                                                                            <input type="number" min={0} step={0.1}
                                                                                value={(scene as VideoScene).trimEnd}
                                                                                onChange={(e) => updateScene(index, { trimEnd: Math.max(0, parseFloat(e.target.value) || 0) } as Partial<VideoScene>)}
                                                                                className="input-field w-20 py-1 text-sm" />
                                                                        </div>
                                                                        <button onClick={() => updateScene(index, { videoUrl: "" } as Partial<VideoScene>)}
                                                                            className="text-xs text-red-400 hover:underline">Replace clip</button>
                                                                    </div>
                                                                </div>
                                                                <textarea
                                                                    value={scene.text}
                                                                    onChange={(e) => updateScene(index, { text: e.target.value })}
                                                                    placeholder="Optional caption shown over the clip…"
                                                                    className="input-field w-full min-h-[60px] text-sm py-2 leading-relaxed border-none bg-transparent focus:ring-1 focus:ring-brand-purple"
                                                                />
                                                                {scene.text.trim() && styleControls(index, scene)}
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <textarea
                                                            value={scene.text}
                                                            onChange={(e) => updateScene(index, { text: e.target.value })}
                                                            placeholder="Enter slide text…"
                                                            className="input-field w-full min-h-[80px] text-sm py-2 mb-3 leading-relaxed border-none bg-transparent focus:ring-1 focus:ring-brand-purple"
                                                        />
                                                        {styleControls(index, scene)}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={addTextScene}
                                            disabled={scenes.length >= MAX_SCENES}
                                            className="flex-1 py-3 rounded-xl border border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-all hover:bg-white/5 disabled:opacity-50"
                                            style={{ borderColor: "rgba(124,58,237,0.3)", color: "#a78bfa" }}
                                        >
                                            <Plus className="w-4 h-4" /> Add Text Scene
                                        </button>
                                        <button
                                            onClick={addVideoScene}
                                            disabled={scenes.length >= MAX_SCENES}
                                            className="flex-1 py-3 rounded-xl border border-dashed flex items-center justify-center gap-2 text-sm font-medium transition-all hover:bg-white/5 disabled:opacity-50"
                                            style={{ borderColor: "rgba(45,212,191,0.4)", color: "#2dd4bf" }}
                                        >
                                            <Video className="w-4 h-4" /> Add Video Scene
                                        </button>
                                    </div>
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

                {hasContent && (
                    <div className="rounded-xl px-4 py-3 flex gap-3 mb-8" style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.2)" }}>
                        <span>✨</span>
                        <p className="text-sm" style={{ color: "#94a3b8" }}>
                            <strong style={{ color: "#2dd4bf" }}>&quot;{customTitle || "Custom Script"}&quot;</strong>{" "}
                            — {scenes.filter(isRenderableScene).length} scenes will be rendered.
                        </p>
                    </div>
                )}

                <button
                    onClick={handleContinue}
                    disabled={!hasContent}
                    className="btn-primary w-full justify-center py-4 text-base"
                    style={{ opacity: !hasContent ? 0.5 : 1 }}
                >
                    Continue to Theme <ArrowRight className="w-5 h-5" />
                </button>
            </main>
        </div>
    );
}
