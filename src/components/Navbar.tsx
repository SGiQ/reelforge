"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, User, LogOut, Shield, Wand2, Menu, X } from "lucide-react";
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
    const [menuOpen, setMenuOpen] = useState(false);
    useEffect(() => { setAdmin(isAdmin()); }, []);
    const logout = () => { clearAuth(); router.replace("/login"); };

    // Single source of truth for links (used by desktop row + mobile menu).
    const links = [
        ...(admin ? [{ href: "/admin", label: "Admin", Icon: Shield }] : []),
        { href: "/auto", label: "AI Director", Icon: Wand2 },
        { href: "/community", label: "Community", Icon: undefined },
        { href: "/help", label: "Help", Icon: undefined },
        { href: "/dashboard", label: "Dashboard", Icon: undefined },
        { href: "/account", label: "Account", Icon: User },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full" style={{ borderBottom: "1px solid rgb(var(--rgb-surface-border) / 0.6)", background: "rgb(var(--rgb-surface) / 0.9)", backdropFilter: "blur(12px)" }}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-accent-surface)" }}>
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

                {/* Nav links — muted mono-uppercase, lime on hover (lime is reserved
                    for actions/active state, not resting labels). */}
                <div className="flex items-center gap-5">
                    {admin && (
                        <Link href="/admin" className="hidden sm:flex items-center gap-1.5 meta-caps text-[13px] transition-colors cursor-pointer" onMouseOver={(e) => e.currentTarget.style.color = "var(--color-accent)"} onMouseOut={(e) => e.currentTarget.style.color = ""}>
                            <Shield className="w-3.5 h-3.5" /> Admin
                        </Link>
                    )}
                    <Link href="/auto" className="hidden sm:flex items-center gap-1.5 meta-caps text-[13px] transition-colors cursor-pointer" onMouseOver={(e) => e.currentTarget.style.color = "var(--color-accent)"} onMouseOut={(e) => e.currentTarget.style.color = ""}>
                        <Wand2 className="w-3.5 h-3.5" /> AI Director
                    </Link>
                    <Link href="/community" className="hidden sm:flex meta-caps text-[13px] transition-colors cursor-pointer" onMouseOver={(e) => e.currentTarget.style.color = "var(--color-accent)"} onMouseOut={(e) => e.currentTarget.style.color = ""}>
                        Community
                    </Link>
                    <Link href="/help" className="hidden sm:flex meta-caps text-[13px] transition-colors cursor-pointer" onMouseOver={(e) => e.currentTarget.style.color = "var(--color-accent)"} onMouseOut={(e) => e.currentTarget.style.color = ""}>
                        Help
                    </Link>
                    <Link href="/dashboard" className="hidden sm:flex meta-caps text-[13px] transition-colors cursor-pointer" onMouseOver={(e) => e.currentTarget.style.color = "var(--color-accent)"} onMouseOut={(e) => e.currentTarget.style.color = ""}>
                        Dashboard
                    </Link>
                    <Link href="/account" title="Account" className="hidden sm:flex items-center meta-caps transition-colors cursor-pointer" onMouseOver={(e) => e.currentTarget.style.color = "var(--color-accent)"} onMouseOut={(e) => e.currentTarget.style.color = ""}>
                        <User className="w-4 h-4" />
                    </Link>
                    <button onClick={logout} title="Log out" className="hidden sm:flex items-center meta-caps transition-colors cursor-pointer" onMouseOver={(e) => e.currentTarget.style.color = "var(--color-accent)"} onMouseOut={(e) => e.currentTarget.style.color = ""}>
                        <LogOut className="w-4 h-4" />
                    </button>

                    <ThemeToggle />

                    {/* Mobile hamburger — the desktop links are hidden below sm. */}
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg"
                        style={{ color: "var(--color-text-secondary)" }}
                        aria-label="Menu"
                        aria-expanded={menuOpen}
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu panel */}
            {menuOpen && (
                <div className="sm:hidden" style={{ borderTop: "1px solid rgb(var(--rgb-surface-border) / 0.6)", background: "var(--color-surface)" }}>
                    <div className="px-6 py-2 flex flex-col">
                        {links.map(({ href, label, Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMenuOpen(false)}
                                className="meta-caps text-[13px] py-3.5 flex items-center gap-3"
                                style={{ color: "var(--color-text-secondary)", borderBottom: "1px solid rgb(var(--rgb-surface-border) / 0.4)" }}
                            >
                                {Icon && <Icon className="w-4 h-4" style={{ color: "var(--color-accent)" }} />}
                                {label}
                            </Link>
                        ))}
                        <button
                            onClick={() => { setMenuOpen(false); logout(); }}
                            className="meta-caps text-[13px] py-3.5 flex items-center gap-3 text-left"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            <LogOut className="w-4 h-4" style={{ color: "var(--color-accent)" }} /> Log out
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
