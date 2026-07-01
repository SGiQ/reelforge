"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, CheckCircle } from "lucide-react";
import { API_BASE, setAuth } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

export default function ResetPage() {
    const router = useRouter();
    const [token, setToken] = useState("");
    const [pw, setPw] = useState("");
    const [pw2, setPw2] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    useEffect(() => {
        const t = new URLSearchParams(window.location.search).get("token") || "";
        setToken(t);
    }, []);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (pw.length < 8) { setError("Password must be at least 8 characters."); return; }
        if (pw !== pw2) { setError("Passwords don't match."); return; }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, new_password: pw }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Could not reset your password.");
            setAuth(data.token, data.user);
            setDone(true);
            setTimeout(() => router.push("/dashboard"), 1200);
        } catch (e: any) {
            setError(e?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container min-h-screen flex items-center justify-center px-6">
            <ThemeToggle floating />
            <div className="w-full max-w-sm">
                <div className="flex items-center gap-2 justify-center mb-8">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #0d9488)" }}>
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                        Reel<span style={{ color: "#a78bfa" }}>SGiQ</span>
                    </span>
                </div>

                <div className="glass-card rounded-2xl p-6">
                    <h1 className="text-lg font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>Set a new password</h1>
                    {!token ? (
                        <p className="text-sm" style={{ color: "#f87171" }}>
                            This reset link is missing its token. Use the full link you were given, or request a new one.
                        </p>
                    ) : done ? (
                        <p className="text-sm flex items-center gap-2" style={{ color: "#34d399" }}>
                            <CheckCircle className="w-4 h-4" /> Password updated — signing you in…
                        </p>
                    ) : (
                        <form onSubmit={submit} className="space-y-3 mt-3">
                            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                                placeholder="New password (min 8 chars)" autoComplete="new-password"
                                className="input-field w-full text-sm py-2.5" />
                            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)}
                                placeholder="Confirm new password" autoComplete="new-password"
                                className="input-field w-full text-sm py-2.5" />
                            {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}
                            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
                            </button>
                        </form>
                    )}
                    <p className="text-xs text-center mt-4" style={{ color: "var(--color-text-muted)" }}>
                        <Link href="/login" style={{ color: "#a78bfa" }}>Back to login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
