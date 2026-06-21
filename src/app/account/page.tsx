"use client";
import { useState } from "react";
import { Loader2, CheckCircle, KeyRound } from "lucide-react";
import Navbar from "@/components/Navbar";
import { API_BASE, authHeaders, getUser, useRequireAuth } from "@/lib/auth";

export default function AccountPage() {
    useRequireAuth();
    const user = getUser();
    const [cur, setCur] = useState("");
    const [pw, setPw] = useState("");
    const [pw2, setPw2] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setDone(false);
        if (pw.length < 8) { setError("New password must be at least 8 characters."); return; }
        if (pw !== pw2) { setError("New passwords don't match."); return; }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/change-password`, {
                method: "POST",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({ current_password: cur, new_password: pw }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Could not change your password.");
            setDone(true); setCur(""); setPw(""); setPw2("");
        } catch (e: any) {
            setError(e?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <Navbar />
            <main className="max-w-md mx-auto px-6 py-12">
                <h1 className="section-title flex items-center gap-2"><KeyRound className="w-6 h-6" style={{ color: "#a78bfa" }} /> Account</h1>
                {user?.email && <p className="section-subtitle">Signed in as {user.email}</p>}

                <div className="glass-card rounded-2xl p-6 mt-6">
                    <h2 className="text-base font-bold mb-4" style={{ color: "#f8fafc" }}>Change password</h2>
                    <form onSubmit={submit} className="space-y-3">
                        <input type="password" value={cur} onChange={(e) => setCur(e.target.value)}
                            placeholder="Current password" autoComplete="current-password"
                            className="input-field w-full text-sm py-2.5" />
                        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                            placeholder="New password (min 8 chars)" autoComplete="new-password"
                            className="input-field w-full text-sm py-2.5" />
                        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)}
                            placeholder="Confirm new password" autoComplete="new-password"
                            className="input-field w-full text-sm py-2.5" />
                        {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}
                        {done && <p className="text-sm flex items-center gap-2" style={{ color: "#34d399" }}><CheckCircle className="w-4 h-4" /> Password updated.</p>}
                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
