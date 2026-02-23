"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Video, Download, RefreshCw, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Dashboard() {
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
                            <div key={job.id} className="glass-card-hover rounded-2xl p-5 flex flex-col justify-between">
                                <div className="mb-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div
                                            className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
                                            style={{
                                                background: job.status === "done" ? "rgba(52,211,153,0.2)" : job.status === "failed" ? "rgba(248,113,113,0.2)" : "rgba(124,58,237,0.2)",
                                                color: job.status === "done" ? "#34d399" : job.status === "failed" ? "#f87171" : "#a78bfa"
                                            }}
                                        >
                                            {job.status}
                                        </div>
                                        <span className="text-xs" style={{ color: "#64748b" }}>
                                            {new Date(job.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1 truncate" style={{ color: "#f8fafc" }}>
                                        {job.brand_name || "Brand Video"}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm" style={{ color: "#94a3b8" }}>
                                        <span className="capitalize">{job.theme.replace("-", " ")}</span>
                                        <span>•</span>
                                        <span className="truncate">{job.id.substring(0, 8)}</span>
                                    </div>
                                </div>

                                {job.status === "done" && job.output_url ? (
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${job.output_url}`}
                                        download={`reelforge-${job.id.substring(0, 6)}.mp4`}
                                        className="btn-secondary w-full justify-center mt-2 group"
                                    >
                                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                                        <span>Download MP4</span>
                                    </a>
                                ) : job.status === "failed" ? (
                                    <button disabled className="btn-secondary w-full justify-center mt-2 opacity-50 cursor-not-allowed">
                                        Render Failed
                                    </button>
                                ) : (
                                    <button disabled className="btn-secondary w-full justify-center mt-2 opacity-50 cursor-wait">
                                        Processing...
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
