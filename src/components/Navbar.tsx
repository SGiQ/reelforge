"use client";
import Link from "next/link";
import { Zap, User } from "lucide-react";

import { UserButton } from "@clerk/nextjs";

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
    return (
        <nav className="sticky top-0 z-50 w-full" style={{ borderBottom: "1px solid rgba(45,45,74,0.6)", background: "rgba(15,15,26,0.9)", backdropFilter: "blur(12px)" }}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #0d9488)" }}>
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight" style={{ color: "#f8fafc" }}>
                        Reel<span style={{ color: "#a78bfa" }}>Forge</span>
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
                                            background: isActive ? "rgba(124,58,237,0.2)" : "transparent",
                                            color: isActive ? "#a78bfa" : isDone ? "#2dd4bf" : "#64748b",
                                        }}
                                    >
                                        <span
                                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{
                                                background: isActive
                                                    ? "rgba(124,58,237,0.4)"
                                                    : isDone
                                                        ? "rgba(13,148,136,0.3)"
                                                        : "rgba(45,45,74,0.6)",
                                                color: isActive ? "#a78bfa" : isDone ? "#2dd4bf" : "#64748b",
                                            }}
                                        >
                                            {isDone ? "✓" : i + 1}
                                        </span>
                                        {step.label}
                                    </Link>
                                    {i < steps.length - 1 && (
                                        <div className="w-4 h-px" style={{ background: isDone ? "rgba(13,148,136,0.4)" : "rgba(45,45,74,0.6)" }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* User button */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="hidden sm:flex text-sm font-medium transition-colors cursor-pointer" style={{ color: "#94a3b8" }} onMouseOver={(e) => e.currentTarget.style.color = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.color = "#94a3b8"}>
                        Dashboard
                    </Link>
                    <UserButton />
                </div>
            </div>
        </nav>
    );
}
