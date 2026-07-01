"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, User, LogOut, Shield, Wand2 } from "lucide-react";
import { clearAuth, isAdmin } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";



const steps = [
    { label: "Brand", href: "/brand-setup" },
    { label: "Script", href: "/script-picker" },
    { label: "Theme", href: "/theme-selector" },
    { label: "Preview", href: "/preview" },
    { label: "Export", href: "/export" },
];

interface NavbarProps {
    currentStep?: number; // 0-indexed
}

export default function Navbar({ currentStep }: NavbarProps) {
    const router = useRouter();
    const [admin, setAdmin] = useState(false);
    useEffect(() => { setAdmin(isAdmin()); }, []);
    const logout = () => { clearAuth(); router.replace("/login"); };
    return (
        <nav className="sticky top-0 z-50 w-full" style={{ borderBottom: "1px solid rgb(var(--rgb-surface-border) / 0.6)", background: "rgb(var(--rgb-surface) / 0.9)", backdropFilter: "blur(12px)" }}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-accent)" }}>
                        <Zap className="w-4 h-4" style={{ color: "var(--color-accent-ink)" }} />
                    </div>
                    <span className="font-bold text-lg tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                        Reel<span style={{ color: "var(--color-accent)" }}>SGiQ</span>
                    </span>
                </Link>

                {/* Step indicator */}
                {currentStep !== undefined && (
                    <div className="hidden md:flex items-center gap-1">
                        {steps.map((step, i) => {
                            const isActive = i === currentStep;
                            const isDone = i < currentStep;
                            return (
                                <div key={step.label} className="flex items-center gap-1">
                                    <Link
                                        href={step.href}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                                        style={{
                                            background: isActive ? "rgba(198,241,53,0.2)" : "transparent",
                                            color: isActive ? "var(--color-accent)" : isDone ? "var(--color-accent)" : "var(--color-text-muted)",
                                        }}
                                    >
                                        <span
                                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{
                                                background: isActive
                                                    ? "rgba(198,241,53,0.4)"
                                                    : isDone
                                                        ? "rgba(198,241,53,0.3)"
                                                        : "rgb(var(--rgb-surface-border) / 0.6)",
                                                color: isActive ? "var(--color-accent)" : isDone ? "var(--color-accent)" : "var(--color-text-muted)",
                                            }}
                                        >
                                            {isDone ? "✓" : i + 1}
                                        </span>
                                        {step.label}
                                    </Link>
                                    {i < steps.length - 1 && (
                                        <div className="w-4 h-px" style={{ background: isDone ? "rgba(198,241,53,0.4)" : "rgb(var(--rgb-surface-border) / 0.6)" }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* User button */}
                <div className="flex items-center gap-4">
                    {admin && (
                        <Link href="/admin" className="hidden sm:flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer" style={{ color: "var(--color-accent)" }} onMouseOver={(e) => e.currentTarget.style.color = "var(--color-text-primary)"} onMouseOut={(e) => e.currentTarget.style.color = "var(--color-accent)"}>
                            <Shield className="w-4 h-4" /> Admin
                        </Link>
                    )}
                    <Link href="/auto" className="hidden sm:flex items-center gap-1 text-sm font-semibold transition-colors cursor-pointer" style={{ color: "var(--color-accent)" }} onMouseOver={(e) => e.currentTarget.style.color = "var(--color-text-primary)"} onMouseOut={(e) => e.currentTarget.style.color = "var(--color-accent)"}>
                        <Wand2 className="w-4 h-4" /> AI Director
                    </Link>
                    <Link href="/community" className="hidden sm:flex text-sm font-medium transition-colors cursor-pointer" style={{ color: "var(--color-text-secondary)" }} onMouseOver={(e) => e.currentTarget.style.color = "var(--color-text-primary)"} onMouseOut={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}>
                        Community
                    </Link>
                    <Link href="/help" className="hidden sm:flex text-sm font-medium transition-colors cursor-pointer" style={{ color: "var(--color-text-secondary)" }} onMouseOver={(e) => e.currentTarget.style.color = "var(--color-text-primary)"} onMouseOut={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}>
                        Help
                    </Link>
                    <Link href="/dashboard" className="hidden sm:flex text-sm font-medium transition-colors cursor-pointer" style={{ color: "var(--color-text-secondary)" }} onMouseOver={(e) => e.currentTarget.style.color = "var(--color-text-primary)"} onMouseOut={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}>
                        Dashboard
                    </Link>
                    <Link href="/account" title="Account" className="hidden sm:flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer" style={{ color: "var(--color-text-secondary)" }} onMouseOver={(e) => e.currentTarget.style.color = "var(--color-text-primary)"} onMouseOut={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}>
                        <User className="w-4 h-4" />
                    </Link>
                    <button onClick={logout} title="Log out" className="hidden sm:flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer" style={{ color: "var(--color-text-secondary)" }} onMouseOver={(e) => e.currentTarget.style.color = "var(--color-text-primary)"} onMouseOut={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}>
                        <LogOut className="w-4 h-4" />
                    </button>

                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
}
