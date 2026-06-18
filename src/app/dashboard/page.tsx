"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Video, Download, RefreshCw, ExternalLink, Play } from "lucide-react";
import Navbar from "@/components/Navbar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// output_url may be absolute (Vercel Blob) or relative (local API) — handle both.
function resolveUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

// Use the reel's opening line as a human-friendly card title.
function getReelTitle(job: any): string {
    const slides = job.slides_snapshot;
    if (Array.isArray(slides) && slides.length) {
        const first = slides[0];
        const text = typeof first === "string" ? first : first?.text;
        if (text && text.trim()) return text.trim();
    }
    return job.brand_name || "Untitled Reel";
}

function ReelCard({ job, onEdit }: { job: any; onEdit: (job: any) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoUrl = resolveUrl(job.output_url);
    const isDone = job.status === "done" && !!videoUrl;
    const title = getReelTitle(job);

    const handleEnter = () => {
        const v = videoRef.current;
        if (v) { v.currentTime = 0; v.play().catch(() => { }); }
    };
    const handleLeave = () => {
        const v = videoRef.current;
        if (v) { v.pause(); try { v.currentTime = 0.5; } catch { } }
    };

    return (
        <div className="glass-card-hover rounded-2xl overflow-hidden flex flex-col">
            {/* Thumbnail (9:16 reel, first frame as poster, plays on hover) */}
            <div
                className="group relative w-full"
                style={{ aspectRatio: "4 / 5", background: "#0d0d18" }}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
            >
                {isDone ? (
                    <>
                        <video
                            ref={videoRef}
                            src={`${videoUrl}#t=0.5`}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            onLoadedMetadata={(e) => { try { e.currentTarget.currentTime = 0.5; } catch { } }}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 opacity-100 group-hover:opacity-0">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(15,15,26,0.65)", border: "1px solid rgba(255,255,255,0.25)" }}>
                                <Play className="w-5 h-5 text-white ml-0.5" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(13,148,136,0.25))" }}>
                        <Video className="w-10 h-10" style={{ color: "rgba(255,255,255,0.35)" }} />
                    </div>
                )}

                {/* Status badge */}
                <div
                    className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
                    style={{
                        background: job.status === "done" ? "rgba(52,211,153,0.25)" : job.status === "failed" ? "rgba(248,113,113,0.25)" : "rgba(124,58,237,0.25)",
                        color: job.status === "done" ? "#34d399" : job.status === "failed" ? "#f87171" : "#a78bfa",
                        backdropFilter: "blur(4px)",
                    }}
                >
                    {job.status}
                </div>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-base mb-1 line-clamp-2" style={{ color: "#f8fafc" }}>
                    {title}
                </h3>
                <div className="flex items-center gap-2 text-xs mb-4" style={{ color: "#94a3b8" }}>
                    <span className="truncate max-w-[55%]">{job.brand_name || "Brand Video"}</span>
                    <span>•</span>
                    <span className="capitalize">{job.theme.replace("-", " ")}</span>
                    <span>•</span>
                    <span>{new Date(job.created_at).toLocaleDateString()}</span>
                </div>

                <div className="mt-auto">
                    {isDone ? (
                        <div className="flex gap-2 w-full">
                            <a
                                href={videoUrl!}
                                download={`reelforge-${job.id.substring(0, 6)}.mp4`}
                                className="btn-secondary flex-1 justify-center group"
                            >
                                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                                <span>Download</span>
                            </a>
                            <button
                                onClick={() => onEdit(job)}
                                className="btn-secondary flex-1 justify-center group"
                            >
                                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span>Re-edit</span>
                            </button>
                        </div>
                    ) : job.status === "failed" ? (
                        <button disabled className="btn-secondary w-full justify-center opacity-50 cursor-not-allowed">
                            Render Failed
                        </button>
                    ) : (
                        <button disabled className="btn-secondary w-full justify-center opacity-50 cursor-wait">
                            Processing...
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const router = useRouter();
    const getToken = useCallback(async () => "mock_token", []);
    const isLoaded = true;
    const isSignedIn = true;
    const [jobs, setJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!isLoaded || !isSignedIn) return;
        setIsLoading(true);
        setError(null);
        try {
            const token = await getToken();
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiBase}/render/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to load render history");
            const data = await res.json();
            setJobs(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, isSignedIn, getToken]);

    const handleEdit = (job: any) => {
        // Hydrate Brand
        const brandData = {
            brandName: job.brand_name || "Brand Video",
            websiteUrl: job.website_url_snapshot || "",
            logoPreview: job.logo_url_snapshot || null,
            watermarkPreview: job.watermark_url_snapshot || null,
            watermarkOpacity: job.watermark_opacity ?? 18,
            logoPosition: job.logo_position || "bottom_center",
            logoSize: job.logo_size_snapshot ?? 120,
            slideLogoPosition: job.slide_logo_position || "none",
            qrCodePreview: job.qr_code_url_snapshot || null,
            qrCodeText: job.qr_text_snapshot || "",
        };
        localStorage.setItem("reelforge_brand", JSON.stringify(brandData));

        // Hydrate Script
        const scriptData = {
            title: job.brand_name ? `${job.brand_name} (Edited)` : "Edited Script",
            slides: job.slides_snapshot ? job.slides_snapshot.map((s: any) => typeof s === "object" ? s.text : s) : [],
            outroVoiceover: job.outro_voiceover_snapshot || "",
        };
        localStorage.setItem("reelforge_script", JSON.stringify(scriptData));

        // Hydrate Theme
        localStorage.setItem("reelforge_theme", job.theme || "dark");

        // Hydrate Audio
        const audioData = {
            musicPreview: job.music_url_snapshot || null,
            musicVolume: job.music_volume_snapshot ? job.music_volume_snapshot * 100 : 15,
            musicStartTime: job.music_start_time_snapshot || 0,
            aiVoice: job.ai_voice_snapshot || null,
        };
        localStorage.setItem("reelforge_audio", JSON.stringify(audioData));

        // Redirect to first step
        router.push("/brand-setup");
    };

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    if (!isLoaded) return null;

    if (!isSignedIn) {
        return (
            <div className="page-container flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Welcome to ReelForge</h1>
                    <Link href="/brand-setup" className="btn-primary">Start Building</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
                    <div>
                        <h1 className="section-title text-3xl mb-2">My Dashboard</h1>
                        <p className="text-sm" style={{ color: "#94a3b8" }}>Manage and download all your generated reels.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={fetchHistory}
                            className="flex items-center justify-center w-12 h-12 rounded-xl border transition-colors hover:bg-white/5"
                            style={{ borderColor: "rgba(45,45,74,0.6)", color: "#94a3b8" }}
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
                        </button>
                        <Link href="/brand-setup" className="btn-primary px-8 h-12 inline-flex">
                            <Video className="w-4 h-4 mr-2" />
                            Create New Reel
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-xl mb-8 flex border" style={{ background: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.3)" }}>
                        <p className="text-sm font-medium" style={{ color: "#f87171" }}>{error}</p>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-24 rounded-3xl border border-dashed" style={{ borderColor: "rgba(45,45,74,0.6)", background: "rgba(26,26,46,0.5)" }}>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)" }}>
                            <Video className="w-8 h-8" style={{ color: "#a78bfa" }} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">No reels yet</h3>
                        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#94a3b8" }}>
                            You haven't generated any MP4s yet. Create your first brand Reel now!
                        </p>
                        <Link href="/brand-setup" className="btn-primary">Get Started</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map((job) => (
                            <ReelCard key={job.id} job={job} onEdit={handleEdit} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
