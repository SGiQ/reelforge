"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Shield, Trash2, EyeOff, RefreshCw, Film, Users, Music, Upload, Search, Plus, Loader2, KeyRound } from "lucide-react";
import { upload } from "@vercel/blob/client";
import Navbar from "@/components/Navbar";
import { API_BASE, authHeaders, getToken, isAdmin } from "@/lib/auth";

const MOODS = ["upbeat", "calm", "emotional", "cinematic", "corporate"];

export default function AdminPage() {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [tab, setTab] = useState<"reels" | "users" | "music">("reels");
    const [reels, setReels] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState("");
    const [newMood, setNewMood] = useState("upbeat");
    const [uploading, setUploading] = useState(false);
    const [jq, setJq] = useState("");
    const [jmood, setJmood] = useState("upbeat");
    const [jresults, setJresults] = useState<any[]>([]);
    const [jloading, setJloading] = useState(false);
    const [importingId, setImportingId] = useState<number | null>(null);

    // Gate: must be signed in AND an admin.
    useEffect(() => {
        if (!getToken()) { router.replace("/login"); return; }
        if (!isAdmin()) { router.replace("/dashboard"); return; }
        setReady(true);
    }, [router]);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [r, u, m] = await Promise.all([
                fetch(`${API_BASE}/admin/reels`, { headers: authHeaders() }),
                fetch(`${API_BASE}/admin/users`, { headers: authHeaders() }),
                fetch(`${API_BASE}/music`),
            ]);
            if (r.status === 403 || u.status === 403) throw new Error("Admin access required.");
            if (!r.ok || !u.ok) throw new Error("Failed to load admin data.");
            setReels(await r.json());
            setUsers(await u.json());
            if (m.ok) setTracks(await m.json());
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    }, []);

    const addTrack = async (file: File) => {
        setUploading(true);
        try {
            const blob = await upload(file.name, file, {
                access: "public",
                handleUploadUrl: `${window.location.origin}/api/upload`,
                clientPayload: "audio-upload",
            });
            const dur = await new Promise<number>((resolve) => {
                const a = new Audio();
                a.onloadedmetadata = () => resolve(a.duration || 0);
                a.onerror = () => resolve(0);
                a.src = blob.url;
            });
            const res = await fetch(`${API_BASE}/music`, {
                method: "POST",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle.trim() || file.name.replace(/\.[^.]+$/, ""), mood: newMood, url: blob.url, duration: dur }),
            });
            if (!res.ok) throw new Error(await res.text());
            setNewTitle("");
            load();
        } catch (e: any) { alert(`Upload failed: ${e.message}`); } finally { setUploading(false); }
    };

    const searchJamendo = async () => {
        setJloading(true);
        try {
            const res = await fetch(`${API_BASE}/music/jamendo?query=${encodeURIComponent(jq)}&mood=${jmood}`, { headers: authHeaders() });
            const d = await res.json();
            if (!res.ok) throw new Error(d.detail || "Search failed");
            setJresults(d.candidates || []);
        } catch (e: any) { alert(`Jamendo: ${e.message}`); } finally { setJloading(false); }
    };

    const importTrack = async (c: any) => {
        setImportingId(c.jamendo_id);
        try {
            const res = await fetch(`${API_BASE}/music/import`, {
                method: "POST",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({ title: c.title, artist: c.artist, license_url: c.license_url, mood: jmood, duration: c.duration, source_url: c.audio }),
            });
            if (!res.ok) throw new Error(await res.text());
            setJresults((prev) => prev.filter((x) => x.jamendo_id !== c.jamendo_id));
            load();
        } catch (e: any) { alert(`Import failed: ${e.message}`); } finally { setImportingId(null); }
    };

    const resetLink = async (u: any) => {
        try {
            const res = await fetch(`${API_BASE}/admin/users/${u.id}/reset-link`, { method: "POST", headers: authHeaders() });
            const d = await res.json();
            if (!res.ok) throw new Error(d.detail || "Failed to create link");
            try { await navigator.clipboard.writeText(d.reset_url); } catch { /* clipboard may be blocked */ }
            window.prompt(`Reset link for ${u.email} (copied — valid 60 min). Send it to them:`, d.reset_url);
        } catch (e: any) { alert(`Failed: ${e.message}`); }
    };

    useEffect(() => { if (ready) load(); }, [ready, load]);

    const act = async (method: string, path: string, confirmMsg?: string) => {
        if (confirmMsg && !window.confirm(confirmMsg)) return;
        try {
            const res = await fetch(`${API_BASE}${path}`, { method, headers: authHeaders() });
            if (!res.ok) { const t = await res.text(); throw new Error(t); }
            load();
        } catch (e: any) { alert(`Action failed: ${e.message}`); }
    };

    const orphanCount = reels.filter((r) => !r.owner_email).length;

    const claimOrphans = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/claim-orphans`, { method: "POST", headers: authHeaders() });
            if (!res.ok) throw new Error(await res.text());
            const d = await res.json();
            alert(`Claimed ${d.claimed} reel(s) to your account. They'll now show on your dashboard.`);
            load();
        } catch (e: any) { alert(`Claim failed: ${e.message}`); }
    };

    if (!ready) return null;

    return (
        <div className="page-container">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-end justify-between mb-8 gap-6">
                    <div>
                        <h1 className="section-title text-3xl mb-2 flex items-center gap-2">
                            <Shield className="w-7 h-7" style={{ color: "#a78bfa" }} /> Admin
                        </h1>
                        <p className="text-sm" style={{ color: "#94a3b8" }}>Moderate the community and manage reels & users.</p>
                    </div>
                    <button onClick={load} className="flex items-center justify-center w-12 h-12 rounded-xl border hover:bg-white/5"
                        style={{ borderColor: "rgba(45,45,74,0.6)", color: "#94a3b8" }}>
                        <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                <div className="flex gap-2 mb-6">
                    {(["reels", "users", "music"] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors"
                            style={tab === t ? { background: "#7c3aed", color: "#fff" } : { background: "rgba(36,36,56,0.8)", color: "#94a3b8" }}>
                            {t === "reels" ? <Film className="w-4 h-4 inline mr-1" /> : t === "users" ? <Users className="w-4 h-4 inline mr-1" /> : <Music className="w-4 h-4 inline mr-1" />}
                            {t} ({t === "reels" ? reels.length : t === "users" ? users.length : tracks.length})
                        </button>
                    ))}
                </div>

                {error && <p className="text-sm mb-6" style={{ color: "#f87171" }}>{error}</p>}

                {tab === "reels" && orphanCount > 0 && (
                    <div className="rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-4" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)" }}>
                        <p className="text-sm" style={{ color: "#cbd5e1" }}>
                            <strong style={{ color: "#a78bfa" }}>{orphanCount}</strong> reel(s) were created before login and have no owner.
                        </p>
                        <button onClick={claimOrphans} className="btn-primary px-4 py-2 text-sm whitespace-nowrap">
                            Claim to my account
                        </button>
                    </div>
                )}

                {tab === "music" ? (
                    <div className="space-y-4">
                        <div className="glass-card rounded-xl p-4">
                            <p className="text-sm font-semibold mb-1" style={{ color: "#f8fafc" }}>Add a track</p>
                            <p className="text-xs mb-3" style={{ color: "#64748b" }}>
                                Upload a royalty-free MP3/WAV you have the rights to (e.g. from the YouTube Audio Library or Pixabay).
                                It's stored on Blob and becomes available to everyone — and to the AI Director.
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Track title (optional)"
                                    className="input-field text-sm py-2 flex-1 min-w-[160px]" />
                                <select value={newMood} onChange={(e) => setNewMood(e.target.value)}
                                    className="input-field text-sm py-2 capitalize" style={{ width: 140 }}>
                                    {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <label className="btn-primary px-4 py-2 text-sm cursor-pointer inline-flex items-center gap-1.5">
                                    <Upload className="w-4 h-4" /> {uploading ? "Uploading…" : "Upload"}
                                    <input type="file" accept="audio/*" className="hidden" disabled={uploading}
                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) addTrack(f); e.currentTarget.value = ""; }} />
                                </label>
                            </div>
                        </div>

                        {/* Import from Jamendo (free CC music API) */}
                        <div className="glass-card rounded-xl p-4">
                            <p className="text-sm font-semibold mb-1" style={{ color: "#f8fafc" }}>Import from Jamendo</p>
                            <p className="text-xs mb-3" style={{ color: "#64748b" }}>
                                Free Creative-Commons catalog. Non-commercial tracks are filtered out; imports are re-hosted to Blob and the artist/license is saved.
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <select value={jmood} onChange={(e) => setJmood(e.target.value)} className="input-field text-sm py-2 capitalize" style={{ width: 140 }}>
                                    {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <input value={jq} onChange={(e) => setJq(e.target.value)} placeholder="Optional keyword (e.g. piano, drive)"
                                    onKeyDown={(e) => { if (e.key === "Enter") searchJamendo(); }}
                                    className="input-field text-sm py-2 flex-1 min-w-[160px]" />
                                <button onClick={searchJamendo} disabled={jloading} className="btn-secondary px-4 py-2 text-sm inline-flex items-center gap-1.5">
                                    {jloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
                                </button>
                            </div>
                            {jresults.length > 0 && (
                                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                                    {jresults.map((c) => (
                                        <div key={c.jamendo_id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "rgba(15,15,26,0.6)" }}>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate" style={{ color: "#e2e8f0" }}>{c.title}</p>
                                                <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{c.artist}{c.duration ? ` · ${Math.round(c.duration)}s` : ""}</p>
                                                <audio src={c.audio} controls preload="none" className="mt-1.5" style={{ height: 28, width: "100%" }} />
                                            </div>
                                            <button onClick={() => importTrack(c)} disabled={importingId === c.jamendo_id} title="Add to library"
                                                className="btn-primary px-3 py-2 text-xs inline-flex items-center gap-1 whitespace-nowrap">
                                                {importingId === c.jamendo_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            {tracks.map((t) => (
                                <div key={t.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                                    <Music className="w-4 h-4 flex-shrink-0" style={{ color: "#a78bfa" }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate" style={{ color: "#f8fafc" }}>{t.title}</p>
                                        <p className="text-xs" style={{ color: "#94a3b8" }}>
                                            <span className="capitalize">{t.mood}</span>{t.duration ? ` · ${Math.round(t.duration)}s` : ""}
                                            {t.artist ? ` · ${t.artist}` : ""}
                                            {t.source === "jamendo" && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]" style={{ background: "rgba(45,212,191,0.15)", color: "#2dd4bf" }}>JAMENDO</span>}
                                        </p>
                                    </div>
                                    <audio src={t.url} controls preload="none" style={{ height: 32 }} />
                                    <button onClick={() => act("DELETE", `/music/${t.id}`, "Delete this track?")} title="Delete track"
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                            {!loading && tracks.length === 0 && <p className="text-sm" style={{ color: "#64748b" }}>No tracks yet — upload one above.</p>}
                        </div>
                    </div>
                ) : tab === "reels" ? (
                    <div className="space-y-2">
                        {reels.map((r) => (
                            <div key={r.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate" style={{ color: "#f8fafc" }}>{r.brand_name || "Untitled"}</p>
                                    <p className="text-xs" style={{ color: "#94a3b8" }}>
                                        {r.owner_email || "unknown"} · {r.status} · {r.theme}
                                        {r.shared && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]" style={{ background: "rgba(52,211,153,0.2)", color: "#34d399" }}>SHARED</span>}
                                    </p>
                                </div>
                                {r.output_url && <a href={r.output_url} target="_blank" rel="noreferrer" className="text-xs" style={{ color: "#a78bfa" }}>view</a>}
                                {r.shared && (
                                    <button onClick={() => act("POST", `/admin/reels/${r.id}/unshare`)} title="Remove from community"
                                        className="p-2 rounded-lg hover:bg-white/5" style={{ color: "#facc15" }}><EyeOff className="w-4 h-4" /></button>
                                )}
                                <button onClick={() => act("DELETE", `/admin/reels/${r.id}`, "Delete this reel permanently?")} title="Delete reel"
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                        {!loading && reels.length === 0 && <p className="text-sm" style={{ color: "#64748b" }}>No reels.</p>}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {users.map((u) => (
                            <div key={u.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate" style={{ color: "#f8fafc" }}>
                                        {u.display_name || u.email}
                                        {u.is_admin && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]" style={{ background: "rgba(124,58,237,0.25)", color: "#a78bfa" }}>ADMIN</span>}
                                    </p>
                                    <p className="text-xs" style={{ color: "#94a3b8" }}>{u.email} · {u.reel_count} reel(s)</p>
                                </div>
                                <button onClick={() => resetLink(u)} title="Generate password reset link"
                                    className="p-2 rounded-lg hover:bg-white/5" style={{ color: "#a78bfa" }}><KeyRound className="w-4 h-4" /></button>
                                {!u.is_admin && (
                                    <button onClick={() => act("DELETE", `/admin/users/${u.id}`, `Delete ${u.email}? Their reels stay but leave the community feed.`)} title="Delete user"
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 className="w-4 h-4" /></button>
                                )}
                            </div>
                        ))}
                        {!loading && users.length === 0 && <p className="text-sm" style={{ color: "#64748b" }}>No users.</p>}
                    </div>
                )}
            </main>
        </div>
    );
}
