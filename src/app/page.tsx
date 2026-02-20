import Link from "next/link";
import { ArrowRight, Zap, Film, Palette, Download, CheckCircle } from "lucide-react";

const features = [
    { icon: <Film className="w-5 h-5" />, title: "3 Emotional Scripts", desc: "Pre-written, conversion-tested scripts ready to go." },
    { icon: <Palette className="w-5 h-5" />, title: "4 Color Themes", desc: "Dark, Light, Sky Blue, Warm Gold — pick your vibe." },
    { icon: <Zap className="w-5 h-5" />, title: "Live Browser Preview", desc: "See your reel animated before you render it." },
    { icon: <Download className="w-5 h-5" />, title: "MP4 Export", desc: "1080×1920 HD MP4 ready for Instagram, TikTok, Reels." },
];

const steps = [
    { num: "01", title: "Setup Your Brand", desc: "Upload logo, watermark photo, set your brand name." },
    { num: "02", title: "Pick a Script", desc: "Choose from 3 emotional, story-driven scripts." },
    { num: "03", title: "Choose a Theme", desc: "Select dark, light, sky blue, or warm gold colors." },
    { num: "04", title: "Preview & Export", desc: "Watch your reel live, then download the MP4." },
];

export default function HomePage() {
    return (
        <div className="page-container">
            {/* Nav */}
            <header className="sticky top-0 z-50 w-full" style={{ borderBottom: "1px solid rgba(45,45,74,0.4)", background: "rgba(15,15,26,0.9)", backdropFilter: "blur(12px)" }}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #0d9488)" }}>
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">
                            Reel<span style={{ color: "#a78bfa" }}>Forge</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/sign-in" className="text-sm font-medium" style={{ color: "#94a3b8" }}>Sign In</Link>
                        <Link href="/sign-up" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden py-28 px-6">
                {/* Background glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
                    style={{ background: "radial-gradient(ellipse, #7c3aed 0%, #0d9488 60%, transparent 100%)" }} />

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
                        style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}>
                        <Zap className="w-3 h-3" /> Multi-brand AI Reel Builder
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
                        Build Reels That{" "}
                        <span className="text-gradient-brand">Hit Different</span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto" style={{ color: "#94a3b8" }}>
                        Upload your logo, pick an emotional script, choose a theme — and download a stunning 1080×1920 MP4 in minutes.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/sign-up" className="btn-primary text-base px-8 py-4">
                            Start Building Free <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/sign-in" className="btn-secondary text-base px-8 py-4">
                            Sign In
                        </Link>
                    </div>
                    <p className="mt-6 text-sm" style={{ color: "#64748b" }}>No credit card required — free plan available</p>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Everything you need to go viral</h2>
                        <p style={{ color: "#94a3b8" }}>Built for brand owners who don&apos;t have time to learn complex video tools.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((f) => (
                            <div key={f.title} className="glass-card rounded-2xl p-6">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>
                                    {f.icon}
                                </div>
                                <h3 className="font-semibold mb-2">{f.title}</h3>
                                <p className="text-sm" style={{ color: "#94a3b8" }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">How it works</h2>
                        <p style={{ color: "#94a3b8" }}>Four steps from zero to shareable MP4.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {steps.map((step) => (
                            <div key={step.num} className="glass-card-hover rounded-2xl p-6 flex items-start gap-5">
                                <span className="text-3xl font-black flex-shrink-0 " style={{ color: "rgba(124,58,237,0.4)" }}>{step.num}</span>
                                <div>
                                    <h3 className="font-semibold mb-1.5">{step.title}</h3>
                                    <p className="text-sm" style={{ color: "#94a3b8" }}>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="animated-border">
                        <div className="animated-border-inner p-12">
                            <h2 className="text-3xl font-bold mb-4">Ready to forge your first reel?</h2>
                            <p className="mb-8" style={{ color: "#94a3b8" }}>Join brand owners creating reels that convert.</p>
                            <Link href="/sign-up" className="btn-primary text-base px-8 py-4 inline-flex">
                                Get Started Free <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 px-6 border-t" style={{ borderColor: "rgba(45,45,74,0.4)" }}>
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" style={{ color: "#a78bfa" }} />
                        <span className="font-bold">ReelForge</span>
                    </div>
                    <p className="text-sm" style={{ color: "#64748b" }}>© 2026 ReelForge. All rights reserved.</p>
                    <div className="flex gap-6 text-sm" style={{ color: "#64748b" }}>
                        <Link href="/sign-in">Sign In</Link>
                        <Link href="/sign-up">Sign Up</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
