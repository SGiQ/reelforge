"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Users, Play, X, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import { API_BASE, authHeaders, useRequireAuth } from "@/lib/auth";

function resolveUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function CommunityCard({ reel }: { reel: any }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [open, setOpen] = useState(false);
    const url = resolveUrl(reel.output_url);
    if (!url) return null;

    return (
        <div className="glass-card-hover rounded-lg overflow-hidden flex flex-col">
            <div
                className="group relative w-full cursor-pointer film-ticks"
                style={{ aspectRatio: "4 / 5", background: "var(--color-surface)" }}
                onMouseEnter={() => { const v = videoRef.current; if (v) v.play().catch(() => { }); }}
                onMouseLeave={() => { const v = videoRef.current; if (v) { v.pause(); try { v.currentTime = 0.5; } catch { } } }}
                onClick={() => setOpen(true)}
            >
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video ref={videoRef} src={`${url}#t=0.5`} muted loop playsInline preload="metadata"
                    onLoadedMetadata={(e) => { try { e.currentTarget.currentTime = 0.5; } catch { } }}
                    className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 opacity-100 group-hover:opacity-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(10,10,15,0.55)", border: "1px solid rgba(198,241,53,0.4)" }}>
                        <Play className="w-5 h-5 ml-0.5" style={{ color: "var(--color-accent)" }} />
                    </div>
                </div>
                <div className="absolute top-3 right-3 meta text-[10px] px-2 py-1 rounded" style={{ background: "rgba(10,10,15,0.82)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>9:16</div>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>{reel.brand_name || "Untitled Reel"}</h3>
                <p className="meta text-[11px] mt-1">
                    SHARED BY <span style={{ color: "var(--color-text-secondary)" }}>{reel.shared_by || "Someone"}</span>
                </p>
            </div>

            {open && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }} onClick={() => setOpen(false)}>
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <video src={url} controls autoPlay playsInline className="rounded-lg" style={{ maxHeight: "88vh", maxWidth: "92vw", background: "#000" }} />
                        <button onClick={() => setOpen(false)} className="absolute -top-3 -right-3 w-9 h-9 rounded-full flex items-center justify-center"
                            style={{ background: "var(--color-surface-elevated)", border: "1px solid rgba(255,255,255,0.25)" }} aria-label="Close">
                            <X className="w-5 h-5" style={{ color: "var(--color-text-primary)" }} />
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default function CommunityPage() {
    const authed = useRequireAuth();
    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFeed = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/community`, { headers: authHeaders() });
            if (!res.ok) throw new Error("Failed to load the community feed.");
            setReels(await res.json());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (authed) fetchFeed(); }, [authed, fetchFeed]);

    if (!authed) return null;

    return (
        <div className="page-container">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-end justify-between mb-10 gap-6">
                    <div>
                        <h1 className="section-title text-3xl mb-2 flex items-center gap-2">
                            <Users className="w-7 h-7" style={{ color: "var(--color-accent)" }} /> Community
                        </h1>
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Reels shared by members. Download yours and share to add it here.</p>
                    </div>
                    <button onClick={fetchFeed} className="flex items-center justify-center w-12 h-12 rounded-xl border transition-colors hover:bg-white/5"
                        style={{ borderColor: "rgb(var(--rgb-surface-border) / 0.6)", color: "var(--color-text-secondary)" }}>
                        <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {error && <p className="text-sm mb-6" style={{ color: "#f87171" }}>{error}</p>}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
                    </div>
                ) : reels.length === 0 ? (
                    <div className="text-center py-24 rounded-3xl border border-dashed" style={{ borderColor: "rgb(var(--rgb-surface-border) / 0.6)", background: "rgb(var(--rgb-surface-card) / 0.5)" }}>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(198,241,53,0.1)" }}>
                            <Users className="w-8 h-8" style={{ color: "var(--color-accent)" }} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">No shared reels yet</h3>
                        <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--color-text-secondary)" }}>
                            Be the first — download a reel from your dashboard and choose “Share” to feature it here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reels.map((r) => <CommunityCard key={r.id} reel={r} />)}
                    </div>
                )}
            </main>
        </div>
    );
}
