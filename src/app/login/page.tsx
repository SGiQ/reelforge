"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight } from "lucide-react";
import { API_BASE, setAuth } from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        try {
            const body: any = { email: email.trim(), password };
            if (mode === "register" && displayName.trim()) body.display_name = displayName.trim();
            const res = await fetch(`${API_BASE}/auth/${mode === "login" ? "login" : "register"}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Something went wrong.");
            setAuth(data.token, data.user);
            router.replace("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="page-container flex items-center justify-center min-h-screen px-6">
            <div className="w-full max-w-md">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #0d9488)" }}>
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight" style={{ color: "#f8fafc" }}>
                        Reel<span style={{ color: "#a78bfa" }}>SGiQ</span>
                    </span>
                </div>

                <div className="glass-card rounded-2xl p-8">
                    <h1 className="text-xl font-bold mb-1" style={{ color: "#f8fafc" }}>
                        {mode === "login" ? "Welcome back" : "Create your account"}
                    </h1>
                    <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
                        {mode === "login" ? "Sign in to your reels and the community." : "Start building branded reels."}
                    </p>

                    <form onSubmit={submit} className="space-y-4">
                        {mode === "register" && (
                            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Display name (optional)" className="input-field w-full" />
                        )}
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email" required className="input-field w-full" />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            placeholder={mode === "register" ? "Password (8+ characters)" : "Password"} required className="input-field w-full" />

                        {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}

                        <button type="submit" disabled={busy} className="btn-primary w-full justify-center py-3" style={{ opacity: busy ? 0.6 : 1 }}>
                            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <p className="text-sm text-center mt-6" style={{ color: "#94a3b8" }}>
                        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
                        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
                            className="font-semibold" style={{ color: "#a78bfa" }}>
                            {mode === "login" ? "Create an account" : "Sign in"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
