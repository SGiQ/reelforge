"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Shield, Trash2, EyeOff, RefreshCw, Film, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { API_BASE, authHeaders, getToken, isAdmin } from "@/lib/auth";

export default function AdminPage() {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [tab, setTab] = useState<"reels" | "users">("reels");
    const [reels, setReels] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Gate: must be signed in AND an admin.
    useEffect(() => {
        if (!getToken()) { router.replace("/login"); return; }
        if (!isAdmin()) { router.replace("/dashboard"); return; }
        setReady(true);
    }, [router]);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [r, u] = await Promise.all([
                fetch(`${API_BASE}/admin/reels`, { headers: authHeaders() }),
                fetch(`${API_BASE}/admin/users`, { headers: authHeaders() }),
            ]);
            if (r.status === 403 || u.status === 403) throw new Error("Admin access required.");
            if (!r.ok || !u.ok) throw new Error("Failed to load admin data.");
            setReels(await r.json());
            setUsers(await u.json());
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    }, []);

    useEffect(() => { if (ready) load(); }, [ready, load]);

    const act = async (method: string, path: string, confirmMsg?: string) => {
        if (confirmMsg && !window.confirm(confirmMsg)) return;
        try {
            const res = await fetch(`${API_BASE}${path}`, { method, headers: authHeaders() });
            if (!res.ok) { const t = await res.text(); throw new Error(t); }
            load();
        } catch (e: any) { alert(`Action failed: ${e.message}`); }
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
                    {(["reels", "users"] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors"
                            style={tab === t ? { background: "#7c3aed", color: "#fff" } : { background: "rgba(36,36,56,0.8)", color: "#94a3b8" }}>
                            {t === "reels" ? <Film className="w-4 h-4 inline mr-1" /> : <Users className="w-4 h-4 inline mr-1" />}
                            {t} ({t === "reels" ? reels.length : users.length})
                        </button>
                    ))}
                </div>

                {error && <p className="text-sm mb-6" style={{ color: "#f87171" }}>{error}</p>}

                {tab === "reels" ? (
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
