"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Video, Download, RefreshCw, ExternalLink, Play, X, Share2, Check, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { authHeaders, useRequireAuth } from "@/lib/auth";

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

function ReelCard({ job, onEdit, onDeleted }: { job: any; onEdit: (job: any) => void; onDeleted: (id: string) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [shared, setShared] = useState(!!job.shared);
    const [sharing, setSharing] = useState(false);
    const videoUrl = resolveUrl(job.output_url);
    const isDone = job.status === "done" && !!videoUrl;
    const title = getReelTitle(job);

    const handleDelete = async () => {
        if (!window.confirm("Delete this reel permanently?")) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/render/${job.id}`, { method: "DELETE", headers: authHeaders() });
            if (!res.ok) throw new Error(await res.text());
            onDeleted(job.id);
        } catch (e: any) {
            alert(`Delete failed: ${e.message}`);
            setDeleting(false);
        }
    };

    const shareToCommunity = async () => {
        setSharing(true);
        try {
            const res = await fetch(`${API_BASE}/render/${job.id}/share`, {
                method: "POST",
                headers: authHeaders(),
            });
            if (res.ok) setShared(true);
        } catch { /* ignore */ } finally {
            setSharing(false);
            setShareOpen(false);
        }
    };

    const [downloading, setDownloading] = useState(false);

    // Play from the already-decoded poster frame instead of seeking to 0 on
    // every hover — seeking forces a keyframe re-decode that makes the preview
    // stutter. Looping handles the wrap-around smoothly.
    const handleEnter = () => {
        const v = videoRef.current;
        if (v) v.play().catch(() => { });
    };
    const handleLeave = () => {
        const v = videoRef.current;
        if (v) { v.pause(); try { v.currentTime = 0.5; } catch { } }
    };

    // Esc closes the details modal; standard, expected exit affordance.
    useEffect(() => {
        if (!detailsOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDetailsOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [detailsOpen]);

    // Download instantly. Vercel Blob's ?download=1 sets Content-Disposition:
    // attachment server-side, so the browser saves the file instead of opening
    // it — reliable cross-origin (no fetch/CORS dependency).
    const handleDownload = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!videoUrl || downloading) return;
        const filename = `reelsgiq-${job.id.substring(0, 6)}.mp4`;
        setDownloading(true);
        try {
            const a = document.createElement("a");
            a.href = `${videoUrl}${videoUrl.includes("?") ? "&" : "?"}download=1`;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } finally {
            setDownloading(false);
            // After downloading from a card, nudge to share (once). Skipped when
            // the details modal is open — it already has a Share button.
            if (!shared && !detailsOpen) setShareOpen(true);
        }
    };

    return (
        <div className="glass-card-hover rounded-lg overflow-hidden flex flex-col">
            {/* Thumbnail (9:16 reel, first frame as poster, plays on hover, click to open player) */}
            <div
                className={`group relative w-full film-ticks ${isDone ? "cursor-pointer" : ""}`}
                style={{ aspectRatio: "4 / 5", background: "var(--color-surface)" }}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                onClick={() => { if (isDone) setDetailsOpen(true); }}
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
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(10,10,15,0.55)", border: "1px solid rgba(198,241,53,0.5)" }}>
                                <Play className="w-5 h-5 ml-0.5" style={{ color: "var(--color-accent-surface)" }} />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgb(var(--rgb-surface-elevated) / 0.6)" }}>
                        <Video className="w-10 h-10" style={{ color: "rgba(255,255,255,0.25)" }} />
                    </div>
                )}

                {/* Status chip (mono) */}
                <div
                    className="absolute top-3 left-3 meta-caps text-[10px] px-2 py-1 rounded"
                    style={{
                        background: "rgba(10,10,15,0.82)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: job.status === "done" ? "var(--color-accent-surface)" : job.status === "failed" ? "#ff8a80" : "rgba(255,255,255,0.72)",
                    }}
                >
                    {job.status}
                </div>
                {/* Aspect/format badge (mono) */}
                <div
                    className="absolute top-3 right-3 meta text-[10px] px-2 py-1 rounded"
                    style={{ background: "rgba(10,10,15,0.82)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.72)" }}
                >
                    9:16
                </div>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-base mb-1 line-clamp-2" style={{ color: "var(--color-text-primary)" }}>
                    {title}
                </h3>
                <div className="meta flex items-center gap-2 text-[11px] mb-4">
                    <span className="truncate max-w-[55%]">{job.brand_name || "Brand Video"}</span>
                    <span>·</span>
                    <span className="uppercase">{job.theme.replace("-", " ")}</span>
                    <span>·</span>
                    <span>{new Date(job.created_at).toLocaleDateString()}</span>
                </div>

                <div className="mt-auto flex gap-2 items-stretch">
                    <div className="flex-1">
                        {isDone ? (
                            <div className="flex gap-2 w-full">
                                <a
                                    href={videoUrl!}
                                    onClick={handleDownload}
                                    className="btn-secondary flex-1 justify-center group"
                                    style={{ opacity: downloading ? 0.6 : 1 }}
                                >
                                    <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                                    <span>{downloading ? "Downloading…" : "Download"}</span>
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
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        title="Delete reel"
                        className="btn-secondary px-3 justify-center text-red-400 hover:bg-red-500/10"
                        style={{ opacity: deleting ? 0.6 : 1 }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Details modal: centered card with the playing reel + metadata + actions.
                Portaled to <body> so the fixed overlay isn't trapped inside the
                card's backdrop-filter containing block (which broke centering). */}
            {detailsOpen && isDone && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                    style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
                    onClick={() => setDetailsOpen(false)}
                >
                    <div
                        className="glass-card rounded-lg w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col md:flex-row relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setDetailsOpen(false)}
                            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.25)" }}
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>

                        {/* Video */}
                        <div className="flex items-center justify-center p-4 md:w-1/2" style={{ background: "#000" }}>
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <video
                                src={videoUrl!}
                                controls
                                autoPlay
                                playsInline
                                className="rounded-lg w-auto max-h-[45vh] md:max-h-[84vh]"
                                style={{ maxWidth: "100%" }}
                            />
                        </div>

                        {/* Details + actions */}
                        <div className="md:w-1/2 p-6 flex flex-col overflow-y-auto">
                            <span
                                className="self-start meta-caps text-[10px] px-2 py-1 rounded mb-3"
                                style={{ background: "rgba(10,10,15,0.82)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-accent)" }}
                            >
                                {job.status}
                            </span>
                            <h3 className="font-bold text-lg mb-2 pr-8" style={{ color: "var(--color-text-primary)", fontFamily: "'Space Grotesk', 'Inter', sans-serif", letterSpacing: "-0.02em" }}>{title}</h3>
                            <div className="meta flex flex-wrap items-center gap-2 text-[11px] mb-6">
                                <span>{job.brand_name || "Brand Video"}</span>
                                <span>·</span>
                                <span className="uppercase">{job.theme.replace("-", " ")}</span>
                                <span>·</span>
                                <span>{new Date(job.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="mt-auto flex flex-col gap-2">
                                <a
                                    href={videoUrl!}
                                    onClick={handleDownload}
                                    className="btn-primary w-full justify-center group"
                                    style={{ opacity: downloading ? 0.6 : 1 }}
                                >
                                    <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                                    <span>{downloading ? "Downloading…" : "Download MP4"}</span>
                                </a>
                                <button
                                    onClick={shareToCommunity}
                                    disabled={sharing || shared}
                                    className="btn-secondary w-full justify-center"
                                    style={{ opacity: sharing ? 0.6 : 1 }}
                                >
                                    {shared ? <><Check className="w-4 h-4" /> Shared to Community</>
                                        : <><Share2 className="w-4 h-4" /> {sharing ? "Sharing…" : "Share to Community"}</>}
                                </button>
                                {shared && (
                                    <Link href="/community" className="text-xs text-center transition-colors" style={{ color: "var(--color-accent)" }}>
                                        View in community →
                                    </Link>
                                )}
                                <div className="flex gap-2">
                                    <button onClick={() => onEdit(job)} className="btn-secondary flex-1 justify-center group">
                                        <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        <span>Re-edit</span>
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        title="Delete reel"
                                        className="btn-secondary px-3 justify-center text-red-400 hover:bg-red-500/10"
                                        style={{ opacity: deleting ? 0.6 : 1 }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Share-to-community prompt (after download) — also portaled */}
            {shareOpen && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setShareOpen(false)}>
                    <div className="glass-card rounded-2xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(198,241,53,0.2)" }}>
                            <Share2 className="w-6 h-6" style={{ color: "var(--color-accent)" }} />
                        </div>
                        <h3 className="text-lg font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>Share to the community?</h3>
                        <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
                            Your reel downloaded. Add it to the community dashboard so other members can see it.
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setShareOpen(false)} className="btn-secondary flex-1 justify-center">Not now</button>
                            <button onClick={shareToCommunity} disabled={sharing} className="btn-primary flex-1 justify-center" style={{ opacity: sharing ? 0.6 : 1 }}>
                                {sharing ? "Sharing…" : "Share"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default function Dashboard() {
    const router = useRouter();
    const authed = useRequireAuth();
    const [jobs, setJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/render/history`, { headers: authHeaders() });
            if (!res.ok) throw new Error("Failed to load render history");
            const data = await res.json();
            setJobs(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleEdit = (job: any) => {
        // Hydrate Brand
        const brandData = {
            brandName: job.brand_name || "Brand Video",
            websiteUrl: job.website_url_snapshot || "",
            phone: job.phone_snapshot || "",
            logoPreview: job.logo_url_snapshot || null,
            watermarkPreview: job.watermark_url_snapshot || null,
            watermarkOpacity: job.watermark_opacity ?? 18,
            logoPosition: job.logo_position || "bottom_center",
            logoSize: job.logo_size_snapshot ?? 120,
            slideLogoPosition: job.slide_logo_position || "none",
            slideLogoSize: job.slide_logo_size ?? 44,
            videoOverlay: job.video_overlay ?? false,
            qrCodePreview: job.qr_code_url_snapshot || null,
            qrCodeText: job.qr_text_snapshot || "",
        };
        localStorage.setItem("reelforge_brand", JSON.stringify(brandData));

        // Hydrate Script — rebuild FULL scenes (snapshot is stored snake_case),
        // not just the caption text, so video clips / images / animations survive.
        const toEditableScene = (s: any) => {
            if (typeof s === "string") return { kind: "text", text: s, fontSize: 88, textColor: "", fontFamily: "DejaVuSans-Bold.ttf" };
            const common = {
                text: s.text ?? "",
                fontSize: s.font_size ?? s.fontSize ?? 88,
                textColor: s.text_color ?? s.textColor ?? "",
                fontFamily: s.font_family ?? s.fontFamily ?? "DejaVuSans-Bold.ttf",
            };
            const videoUrl = s.video_url ?? s.videoUrl;
            const imageUrl = s.image_url ?? s.imageUrl;
            if (s.kind === "video" || videoUrl) {
                return { kind: "video", videoUrl, trimStart: s.trim_start ?? s.trimStart ?? 0, trimEnd: s.trim_end ?? s.trimEnd ?? 0, ...common };
            }
            const still = {
                ...common,
                duration: typeof s.duration === "number" ? s.duration : undefined,
                animation: s.animation || "none",
                textAnimation: s.text_animation ?? s.textAnimation ?? "none",
                elements: Array.isArray(s.elements) ? s.elements : [],
            };
            if (s.kind === "image" || imageUrl) return { kind: "image", imageUrl, ...still };
            return { kind: "text", ...still };
        };
        const scriptData = {
            title: job.brand_name ? `${job.brand_name} (Edited)` : "Edited Script",
            slides: (job.slides_snapshot || []).map(toEditableScene),
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
        if (authed) fetchHistory();
    }, [authed, fetchHistory]);

    if (!authed) return null;

    return (
        <div className="page-container">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
                    <div>
                        <h1 className="section-title text-3xl mb-2">My Dashboard</h1>
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Manage and download all your generated reels.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={fetchHistory}
                            className="flex items-center justify-center w-12 h-12 rounded-xl border transition-colors hover:bg-white/5"
                            style={{ borderColor: "rgb(var(--rgb-surface-border) / 0.6)", color: "var(--color-text-secondary)" }}
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
                    <div className="text-center py-24 rounded-3xl border border-dashed" style={{ borderColor: "rgb(var(--rgb-surface-border) / 0.6)", background: "rgb(var(--rgb-surface-card) / 0.5)" }}>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(198,241,53,0.1)" }}>
                            <Video className="w-8 h-8" style={{ color: "var(--color-accent)" }} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">No reels yet</h3>
                        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--color-text-secondary)" }}>
                            You haven't generated any MP4s yet. Create your first brand Reel now!
                        </p>
                        <Link href="/brand-setup" className="btn-primary">Get Started</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map((job) => (
                            <ReelCard key={job.id} job={job} onEdit={handleEdit} onDeleted={(id) => setJobs((prev) => prev.filter((j) => j.id !== id))} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
