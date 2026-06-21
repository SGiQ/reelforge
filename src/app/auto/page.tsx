"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Wand2, Eye, Rocket } from "lucide-react";
import Navbar from "@/components/Navbar";
import { getToken, useRequireAuth } from "@/lib/auth";

export default function AutoPage() {
    const router = useRouter();
    useRequireAuth();
    const [prompt, setPrompt] = useState("");
    const [slideCount, setSlideCount] = useState(6);
    const [autopilot, setAutopilot] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [brand, setBrand] = useState<any>(null);

    useEffect(() => {
        try {
            const b = localStorage.getItem("reelforge_brand");
            if (b) setBrand(JSON.parse(b));
        } catch { /* no brand yet */ }
    }, []);

    const run = async () => {
        if (!prompt.trim() || loading) return;
        setLoading(true);
        setError("");
        try {
            setStatus("Writing the script & choosing footage…");
            const res = await fetch("/api/agent/create-reel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    slideCount,
                    brandName: brand?.brandName,
                    websiteUrl: brand?.websiteUrl,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "The agent could not build the reel.");

            // Save the generated reel into the normal builder state.
            localStorage.setItem("reelforge_script", JSON.stringify({ title: data.title, slides: data.slides }));
            localStorage.setItem("reelforge_theme", data.theme || "dark");

            // AI reels show the logo on every scene: if a logo exists but the
            // per-slide logo is off, default it on (bottom-right). Persist so the
            // Review flow (preview/export read the brand) shows it too.
            let b: any = brand || {};
            const slidePos = b.slideLogoPosition && b.slideLogoPosition !== "none"
                ? b.slideLogoPosition
                : (b.logoPreview ? "bottom_right" : "none");
            if (b.logoPreview && slidePos !== b.slideLogoPosition) {
                b = { ...b, slideLogoPosition: slidePos };
                localStorage.setItem("reelforge_brand", JSON.stringify(b));
                setBrand(b);
            }

            // Merge the agent's music pick into the saved audio settings.
            let audio: any = {};
            try { audio = JSON.parse(localStorage.getItem("reelforge_audio") || "{}"); } catch { /* none */ }
            if (data.music_url) {
                audio = { ...audio, musicPreview: data.music_url, musicVolume: audio.musicVolume ?? 15, musicStartTime: audio.musicStartTime ?? 0 };
                localStorage.setItem("reelforge_audio", JSON.stringify(audio));
            }

            if (!autopilot) {
                router.push("/preview");
                return;
            }

            // Autopilot — render immediately, then send to the dashboard.
            setStatus("Rendering your reel…");
            const token = await getToken();
            const body = {
                brand_name: b.brandName || data.title || "Brand",
                slides: data.slides,
                theme: data.theme || "dark",
                script_title: data.title,
                watermark_opacity: b.watermarkOpacity ?? 18,
                logo_position: b.logoPosition ?? "bottom_center",
                logo_size: b.logoSize ?? 120,
                slide_logo_position: slidePos,
                slide_logo_size: b.slideLogoSize ?? 44,
                video_overlay: b.videoOverlay ?? false,
                qr_code_url: b.qrCodePreview,
                qr_text: b.qrCodeText ?? "",
                logo_url: b.logoPreview,
                watermark_url: b.watermarkPreview,
                website_url: b.websiteUrl,
                phone: b.phone,
                music_url: audio.musicPreview,
                music_volume: audio.musicVolume !== undefined ? audio.musicVolume / 100 : 0.15,
                music_start_time: audio.musicStartTime || 0,
                ai_voice_id: audio.aiVoice,
            };
            const r = await fetch("/api/render/create", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify(body),
            });
            if (!r.ok) throw new Error(`Render could not start: ${(await r.text()).slice(0, 200)}`);
            router.push("/dashboard");
        } catch (e: any) {
            setError(e?.message || "Something went wrong.");
            setLoading(false);
            setStatus("");
        }
    };

    return (
        <div className="page-container">
            <Navbar />
            <main className="max-w-2xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <p className="step-indicator mb-3">
                        <span>New</span><span className="text-xs mx-1">·</span>
                        <span style={{ color: "#a78bfa" }}>AI Director</span>
                    </p>
                    <h1 className="section-title flex items-center gap-2"><Wand2 className="w-7 h-7" style={{ color: "#a78bfa" }} /> Make a reel for me</h1>
                    <p className="section-subtitle">
                        Describe what you want. The AI writes the script, picks stock footage, sets motion, and assembles a full reel —
                        ready to review or render on its own.
                    </p>
                </div>

                <div className="glass-card rounded-2xl p-6 space-y-5">
                    <div>
                        <label className="text-sm font-semibold" style={{ color: "#cbd5e1" }}>What's the reel about?</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. A 6-scene reel for adult children, about the relief of knowing someone checks on their aging parent every day."
                            className="input-field w-full min-h-[110px] text-sm py-2 mt-2 leading-relaxed"
                            disabled={loading}
                        />
                        {brand?.brandName && (
                            <p className="text-xs mt-1.5" style={{ color: "#64748b" }}>
                                Using your brand <strong style={{ color: "#94a3b8" }}>{brand.brandName}</strong>
                                {brand.websiteUrl ? " (+ website research)" : ""}.
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm" style={{ color: "#94a3b8" }}>Scenes</label>
                        <input type="range" min={3} max={10} value={slideCount}
                            onChange={(e) => setSlideCount(parseInt(e.target.value, 10))}
                            className="flex-1 accent-brand-purple" disabled={loading} />
                        <span className="text-sm font-semibold w-6 text-center" style={{ color: "#a78bfa" }}>{slideCount}</span>
                    </div>

                    {/* Mode toggle */}
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setAutopilot(false)} disabled={loading}
                            className="rounded-xl p-3 text-left transition-colors"
                            style={{ background: !autopilot ? "rgba(45,212,191,0.12)" : "rgba(26,26,46,0.6)", border: `1px solid ${!autopilot ? "rgba(45,212,191,0.5)" : "rgba(45,45,74,0.6)"}` }}>
                            <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: "#2dd4bf" }}><Eye className="w-4 h-4" /> Review first</div>
                            <p className="text-xs mt-1" style={{ color: "#64748b" }}>Open the finished reel in Preview to tweak before rendering.</p>
                        </button>
                        <button type="button" onClick={() => setAutopilot(true)} disabled={loading}
                            className="rounded-xl p-3 text-left transition-colors"
                            style={{ background: autopilot ? "rgba(124,58,237,0.14)" : "rgba(26,26,46,0.6)", border: `1px solid ${autopilot ? "rgba(124,58,237,0.5)" : "rgba(45,45,74,0.6)"}` }}>
                            <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: "#a78bfa" }}><Rocket className="w-4 h-4" /> Autopilot</div>
                            <p className="text-xs mt-1" style={{ color: "#64748b" }}>Render it straight to your dashboard — no review step.</p>
                        </button>
                    </div>

                    {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}

                    <button onClick={run} disabled={loading || !prompt.trim()}
                        className="btn-primary w-full justify-center py-4 text-base">
                        {loading
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> {status || "Working…"}</>
                            : <><Sparkles className="w-5 h-5" /> {autopilot ? "Generate & render" : "Generate reel"}</>}
                    </button>
                    {!brand?.brandName && (
                        <p className="text-xs text-center" style={{ color: "#64748b" }}>
                            Tip: set up your brand first so the reel uses your logo and colors.
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
}
