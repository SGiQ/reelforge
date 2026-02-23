"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";


type JobStatus = "idle" | "pending" | "processing" | "done" | "failed";

interface JobState {
    id: string | null;
    status: JobStatus;
    outputUrl: string | null;
    errorMsg: string | null;
}

export default function ExportPage() {
    const router = useRouter();
    const getToken = async () => "mock_token";
    const [brand, setBrand] = useState<{ brandName: string } | null>(null);
    const [script, setScript] = useState<{ title: string; slides: string[]; outroVoiceover?: string } | null>(null);
    const [theme, setTheme] = useState("dark");
    const [audio, setAudio] = useState<{ musicPreview: string | null; aiVoice: string | null }>({ musicPreview: null, aiVoice: null });
    const [job, setJob] = useState<JobState>({ id: null, status: "idle", outputUrl: null, errorMsg: null });

    useEffect(() => {
        const b = localStorage.getItem("reelforge_brand");
        const s = localStorage.getItem("reelforge_script");
        const t = localStorage.getItem("reelforge_theme");
        const a = localStorage.getItem("reelforge_audio");
        if (b) setBrand(JSON.parse(b));
        if (s) setScript(JSON.parse(s));
        if (t) setTheme(t);
        if (a) setAudio(JSON.parse(a));
    }, []);

    const pollStatus = useCallback(async (jobId: string, token: string) => {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/render/${jobId}/status`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Status check failed");
        return (await res.json()) as { status: JobStatus; output_url: string | null };
    }, []);

    const startRender = async () => {
        if (!brand || !script) return;
        setJob({ id: null, status: "pending", outputUrl: null, errorMsg: null });

        try {
            const token = await getToken();
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

            const body = {
                brand_name: brand.brandName,
                slides: script.slides,
                theme,
                script_title: script.title,
                watermark_opacity: (brand as any).watermarkOpacity ?? 18,
                logo_position: (brand as any).logoPosition ?? "bottom_center",
                logo_size: (brand as any).logoSize ?? 120,
                qr_code_url: (brand as any).qrCodePreview,
                qr_text: (brand as any).qrCodeText ?? "",
                logo_url: (brand as any).logoPreview,
                watermark_url: (brand as any).watermarkPreview,
                website_url: (brand as any).websiteUrl,
                music_url: audio.musicPreview,
                ai_voice_id: audio.aiVoice,
                outro_voiceover: script.outroVoiceover,
            };

            const res = await fetch(`${apiBase}/render/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to start render: ${text}`);
            }

            const data = (await res.json()) as { id: string; status: JobStatus };
            const jobId = data.id;
            setJob((prev) => ({ ...prev, id: jobId, status: data.status }));

            // Poll every 3 seconds, with a 5-minute timeout (100 attempts)
            let attempts = 0;
            const MAX_ATTEMPTS = 100; // 100 × 3s = 5 minutes
            const poll = async () => {
                attempts++;
                if (attempts > MAX_ATTEMPTS) {
                    setJob((prev) => ({
                        ...prev,
                        status: "failed",
                        errorMsg: "Render timed out after 5 minutes. Make sure your Celery worker is running: celery -A worker.celery_app worker --loglevel=info",
                    }));
                    return;
                }
                try {
                    const statusData = await pollStatus(jobId, token || "");
                    setJob((prev) => ({
                        ...prev,
                        status: statusData.status,
                        outputUrl: statusData.output_url,
                    }));

                    if (statusData.status === "processing" || statusData.status === "pending") {
                        setTimeout(poll, 3000);
                    }
                } catch {
                    setJob((prev) => ({ ...prev, status: "failed", errorMsg: "Lost connection while rendering." }));
                }
            };

            if (data.status === "pending" || data.status === "processing") {
                setTimeout(poll, 3000);
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            setJob({ id: null, status: "failed", outputUrl: null, errorMsg: msg });
        }
    };

    const statusConfig: Record<JobStatus, { icon: React.ReactNode; label: string; color: string }> = {
        idle: { icon: <Clock className="w-5 h-5" />, label: "Ready to render", color: "#64748b" },
        pending: { icon: <Loader2 className="w-5 h-5 animate-spin" />, label: "Queued — waiting for worker...", color: "#a78bfa" },
        processing: { icon: <Loader2 className="w-5 h-5 animate-spin" />, label: "Rendering your MP4...", color: "#2dd4bf" },
        done: { icon: <CheckCircle className="w-5 h-5" />, label: "Render complete! Your MP4 is ready.", color: "#34d399" },
        failed: { icon: <XCircle className="w-5 h-5" />, label: "Render failed. Please try again.", color: "#f87171" },
    };

    const currentStatus = statusConfig[job.status];

    return (
        <div className="page-container">
            <Navbar currentStep={4} />
            <main className="max-w-2xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <p className="step-indicator mb-3">
                        <span>Step 5 of 5</span>
                        <span className="text-xs mx-1">·</span>
                        <span style={{ color: "#a78bfa" }}>Export & Download</span>
                    </p>
                    <h1 className="section-title">Export your reel</h1>
                    <p className="section-subtitle">
                        Click Render to generate your 1080×1920 MP4. Takes about 30-60 seconds.
                    </p>
                </div>

                {/* Summary card */}
                {brand && script && (
                    <div className="glass-card rounded-2xl p-5 mb-8 space-y-2">
                        <p className="text-sm font-semibold mb-3" style={{ color: "#94a3b8" }}>RENDER SPEC</p>
                        {[
                            ["Brand", brand.brandName],
                            ["Script", script.title],
                            ["Theme", theme.replace("-", " ")],
                            ["Slides", `${script.slides.length + 1} (+ logo slide)`],
                            ["Output", "1080 × 1920 · H.264 · MP4"],
                            ["Audio", `${audio.musicPreview ? "Music " : ""}${audio.aiVoice ? "AI-Voice" : ""}` || "None"],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between text-sm">
                                <span style={{ color: "#64748b" }}>{k}</span>
                                <span className="font-medium capitalize">{v}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Status */}
                <div
                    className="rounded-2xl p-5 mb-6 flex items-center gap-4"
                    style={{
                        background: "rgba(26,26,46,0.6)",
                        border: `1px solid ${job.status === "done" ? "rgba(52,211,153,0.3)" : job.status === "failed" ? "rgba(248,113,113,0.3)" : "rgba(45,45,74,0.6)"}`,
                    }}
                >
                    <div style={{ color: currentStatus.color }}>{currentStatus.icon}</div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: currentStatus.color }}>{currentStatus.label}</p>
                        {job.errorMsg && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{job.errorMsg}</p>}
                    </div>
                </div>

                {/* Progress bar for processing */}
                {(job.status === "pending" || job.status === "processing") && (
                    <div className="rounded-full overflow-hidden mb-6" style={{ height: 4, background: "rgba(45,45,74,0.6)" }}>
                        <div
                            className="h-full rounded-full"
                            style={{
                                background: "linear-gradient(90deg, #7c3aed, #0d9488)",
                                animation: "indeterminate 2s ease-in-out infinite",
                                width: "60%",
                            }}
                        />
                    </div>
                )}

                {/* Buttons */}
                {job.status === "idle" || job.status === "failed" ? (
                    <button
                        onClick={startRender}
                        disabled={!brand || !script}
                        className="btn-primary w-full justify-center py-4 text-base mb-4"
                    >
                        🎬 Render MP4
                    </button>
                ) : job.status === "done" && job.outputUrl ? (
                    <div className="flex flex-col gap-4 w-full">
                        <div className="w-full flex justify-center bg-black/40 rounded-xl overflow-hidden mb-4 relative" style={{ aspectRatio: "9/16", maxHeight: "60vh" }}>
                            <video
                                src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${job.outputUrl}`}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${job.outputUrl}`}
                            download={`${brand?.brandName || "reel"}-reel.mp4`}
                            className="btn-primary w-full justify-center py-4 text-base mb-4 inline-flex text-center"
                        >
                            <Download className="w-5 h-5" />
                            Download MP4
                        </a>
                    </div>
                ) : (
                    <div
                        className="w-full py-4 text-center rounded-xl text-sm font-medium mb-4"
                        style={{ background: "rgba(36,36,56,0.6)", color: "#64748b" }}
                    >
                        Rendering in progress...
                    </div>
                )}

                {job.status === "done" && (
                    <button
                        onClick={() => setJob({ id: null, status: "idle", outputUrl: null, errorMsg: null })}
                        className="btn-secondary w-full justify-center py-3 text-sm mb-4"
                    >
                        Render Another Version
                    </button>
                )}

                <button
                    onClick={() => router.push("/preview")}
                    className="flex items-center gap-2 text-sm mx-auto"
                    style={{ color: "#64748b" }}
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Preview
                </button>
            </main>

            <style jsx>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
        </div>
    );
}
