import Link from "next/link";
import { Play, ArrowUpRight, SquareTerminal, Palette, Eye, Download, AudioLines } from "lucide-react";

/* ── Cinematic Studio landing ─────────────────────────────────────────────────
   Ported from the Google Stitch "Cinematic Studio" concept. Styling is scoped
   under .cine so it doesn't affect the rest of the app during this pilot.
   Media are CSS-only film-frame placeholders (no hotlinked images) — real reel
   thumbnails can be dropped into <ReelFrame> later. ────────────────────────── */

const LIME = "#c6f135";

const showcase = [
    { label: "AURORA_01", meta: "LIFESTYLE / 15s", tone: "linear-gradient(155deg,#161922,#0a0a0f)" },
    { label: "MERIDIAN", meta: "PRODUCT / 12s", tone: "linear-gradient(155deg,#1b1712,#0a0a0f)" },
    { label: "SIGNAL", meta: "TECH / 08s", tone: "linear-gradient(155deg,#0f1b1a,#0a0a0f)" },
    { label: "ATLAS", meta: "BRAND / 20s", tone: "linear-gradient(155deg,#151221,#0a0a0f)" },
];

const features = [
    { icon: <SquareTerminal className="w-7 h-7" />, title: "SCRIPTS THAT CONVERT", body: "AI-engineered hooks and pacing designed for maximum viewer retention." },
    { icon: <Palette className="w-7 h-7" />, title: "DISTINCT COLOR THEMES", body: "Brand-safe palettes and looks that keep every reel visually consistent." },
    { icon: <Eye className="w-7 h-7" />, title: "LIVE BROWSER PREVIEW", body: "Watch your reel animate in 1080×1920 before you ever hit render." },
    { icon: <Download className="w-7 h-7" />, title: "1080×1920 MP4 EXPORT", body: "High-bitrate exports ready for TikTok, Reels, and YouTube Shorts." },
];

const steps = [
    { n: "01", k: "BRAND", d: "Upload logo, watermark, and details" },
    { n: "02", k: "SCRIPT", d: "Write it or let the AI draft it" },
    { n: "03", k: "THEME", d: "Apply a cinematic visual style" },
    { n: "04", k: "EXPORT", d: "Ship a 1080×1920 MP4" },
];

function Ticks({ c = LIME, o = 0.4, size = "1.5rem", off = "-0.75rem" }: { c?: string; o?: number; size?: string; off?: string }) {
    const s = { width: size, height: size, opacity: o } as const;
    return (
        <>
            <span className="absolute pointer-events-none" style={{ ...s, top: off, left: off, borderTop: `1px solid ${c}`, borderLeft: `1px solid ${c}` }} />
            <span className="absolute pointer-events-none" style={{ ...s, top: off, right: off, borderTop: `1px solid ${c}`, borderRight: `1px solid ${c}` }} />
            <span className="absolute pointer-events-none" style={{ ...s, bottom: off, left: off, borderBottom: `1px solid ${c}`, borderLeft: `1px solid ${c}` }} />
            <span className="absolute pointer-events-none" style={{ ...s, bottom: off, right: off, borderBottom: `1px solid ${c}`, borderRight: `1px solid ${c}` }} />
        </>
    );
}

function ReelFrame({ tone, label, meta, hero = false }: { tone: string; label: string; meta: string; hero?: boolean }) {
    return (
        <div className="relative w-full aspect-[9/16] hair overflow-hidden group" style={{ background: tone }}>
            {hero && <span className="scan" />}
            {/* centered play glyph */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="hair flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style={{ width: 52, height: 52, background: "rgba(10,10,15,0.5)" }}>
                    <Play className="w-5 h-5 ml-0.5" style={{ color: LIME }} />
                </div>
            </div>
            {/* top-left mono badge */}
            <div className="absolute top-3 left-3">
                <span className="mono hair px-2 py-1 text-[10px]" style={{ background: "rgba(10,10,15,0.8)", color: LIME, borderColor: "rgba(198,241,53,0.25)" }}>
                    {hero ? "0:07 · 1080×1920" : meta}
                </span>
            </div>
            {/* bottom timeline strip */}
            <div className="absolute bottom-0 left-0 w-full p-3" style={{ background: "linear-gradient(to top, #0a0a0f, transparent)" }}>
                <div className="flex justify-between items-end mb-2">
                    <span className="mono text-[10px]" style={{ color: "#c5c9ae" }}>{hero ? "SCENE 01 / REELS_GEN_001" : label}</span>
                    <AudioLines className="w-3.5 h-3.5" style={{ color: LIME }} />
                </div>
                <div className="relative w-full" style={{ height: 2, background: "rgba(255,255,255,0.08)" }}>
                    <div className="absolute top-0 left-0 h-full" style={{ width: hero ? "40%" : "62%", background: LIME }} />
                    <div className="absolute" style={{ top: -3, left: hero ? "40%" : "62%", width: 8, height: 8, background: LIME, boxShadow: `0 0 10px ${LIME}` }} />
                </div>
            </div>
        </div>
    );
}

export default function HomePage() {
    const cineCSS = `
    .cine{--bg:#0a0a0f;--s1:#101018;--s2:#16161f;--tx:#f2f2f5;--dim:#c5c9ae;--line:rgba(255,255,255,0.08);background:var(--bg);color:var(--tx);font-family:'Inter',system-ui,sans-serif;}
    .cine .disp{font-family:'Space Grotesk',system-ui,sans-serif;letter-spacing:-0.03em;}
    .cine .mono{font-family:'Geist Mono','Space Mono',ui-monospace,monospace;}
    .cine .hair{border:1px solid var(--line);}
    .cine ::selection{background:#c6f135;color:#0a0a0f;}
    .cine .grain{position:fixed;inset:0;pointer-events:none;z-index:60;opacity:0.05;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
    .cine .scan{position:absolute;left:0;width:100%;height:1px;background:#c6f135;opacity:0.3;z-index:10;animation:cine-scan 7s linear infinite;}
    @keyframes cine-scan{0%{top:-10%}100%{top:110%}}
    .cine .lime-btn{background:#c6f135;color:#0a0a0f;}
    .cine .lime-btn:hover{filter:brightness(1.08);}
    .cine .navlink:hover{color:#c6f135;}
    .cine .cap{font-family:'Geist Mono','Space Mono',monospace;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;}
    `;

    return (
        <div className="cine min-h-screen">
            <style dangerouslySetInnerHTML={{ __html: cineCSS }} />
            <div className="grain" />

            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 hair" style={{ background: "rgba(10,10,15,0.8)", backdropFilter: "blur(12px)", borderLeft: 0, borderRight: 0, borderTop: 0 }}>
                <div className="flex justify-between items-center px-6 md:px-10 py-4 mx-auto" style={{ maxWidth: 1440 }}>
                    <div className="flex items-center gap-8">
                        <Link href="/" className="disp text-lg font-bold" style={{ color: LIME }}>ReelSGiQ</Link>
                        <div className="hidden md:flex gap-6">
                            <a href="#features" className="cap navlink transition-colors" style={{ color: "var(--dim)" }}>Features</a>
                            <a href="#workflow" className="cap navlink transition-colors" style={{ color: "var(--dim)" }}>How it works</a>
                            <Link href="/community" className="cap navlink transition-colors" style={{ color: "var(--dim)" }}>Community</Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/login" className="cap px-4 py-2 transition-colors navlink" style={{ color: "var(--dim)" }}>Sign in</Link>
                        <Link href="/brand-setup" className="lime-btn cap font-bold px-5 py-2.5 transition-all" style={{ borderRadius: 8 }}>Start free</Link>
                    </div>
                </div>
            </nav>

            <main className="pt-24">
                {/* Hero */}
                <section className="relative px-6 md:px-10 mx-auto py-16 lg:py-28 grid lg:grid-cols-2 gap-16 items-center overflow-hidden" style={{ maxWidth: 1440 }}>
                    <div className="absolute -top-40 -left-40 w-80 h-80" style={{ background: "rgba(198,241,53,0.06)", filter: "blur(120px)" }} />
                    <div className="relative z-10 flex flex-col items-start gap-6">
                        <span className="cap pl-4" style={{ color: LIME, borderLeft: `2px solid ${LIME}`, letterSpacing: "0.2em" }}>AI Reel Studio / For Brands</span>
                        <h1 className="disp font-bold max-w-lg" style={{ fontSize: "clamp(2.75rem,6vw,4rem)", lineHeight: 1.03 }}>Reels that hit different.</h1>
                        <p className="max-w-md" style={{ color: "var(--dim)", fontSize: 18, lineHeight: 1.6 }}>
                            Cinematic 9:16 content generated from your brand kit. High fidelity, technical precision, zero fluff.
                        </p>
                        <div className="flex flex-wrap gap-4 mt-2">
                            <Link href="/brand-setup" className="lime-btn cap font-bold px-8 py-4 transition-all" style={{ borderRadius: 8 }}>Start building free</Link>
                            <a href="#showcase" className="cap hair px-8 py-4 transition-colors flex items-center gap-2" style={{ color: "var(--tx)", borderRadius: 8 }}>
                                <Play className="w-4 h-4" /> Watch a sample
                            </a>
                        </div>
                        <div className="mt-10 flex gap-8 items-center" style={{ opacity: 0.4 }}>
                            <div className="flex flex-col gap-1">
                                <span className="mono text-[11px]" style={{ color: "var(--dim)" }}>RENDER_ENGINE</span>
                                <span className="cap">v1.0 · STABLE</span>
                            </div>
                            <div style={{ width: 1, height: 32, background: "var(--line)" }} />
                            <div className="flex flex-col gap-1">
                                <span className="mono text-[11px]" style={{ color: "var(--dim)" }}>OUTPUT</span>
                                <span className="cap">1080×1920 · MP4</span>
                            </div>
                        </div>
                    </div>

                    {/* Hero mockup */}
                    <div className="relative">
                        <Ticks />
                        <div className="max-w-[340px] mx-auto" style={{ boxShadow: "0 0 100px rgba(198,241,53,0.05)" }}>
                            <ReelFrame hero tone="linear-gradient(155deg,#1a1d24,#0a0a0f)" label="" meta="" />
                        </div>
                    </div>
                </section>

                {/* Trust strip */}
                <section className="hair py-10" style={{ borderLeft: 0, borderRight: 0 }}>
                    <div className="px-6 md:px-10 mx-auto flex flex-col md:flex-row items-center justify-between gap-6" style={{ maxWidth: 1440, color: "rgba(197,201,174,0.5)" }}>
                        <span className="cap">Built for brand marketers</span>
                        <div className="flex gap-8 items-center">
                            {["STUDIO_X", "KINETIC", "FRAMED", "PXL.CO"].map((n, i) => (
                                <div key={n} className="flex items-center gap-8">
                                    {i > 0 && <span style={{ width: 1, height: 16, background: "var(--line)" }} />}
                                    <span className="disp italic" style={{ opacity: 0.5 }}>{n}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Showcase */}
                <section id="showcase" className="py-20">
                    <div className="px-6 md:px-10 mx-auto mb-10" style={{ maxWidth: 1440 }}>
                        <h2 className="cap mb-4" style={{ color: LIME }}>Showcase / Recent_Sessions</h2>
                        <div style={{ height: 1, background: "var(--line)" }} />
                    </div>
                    <div className="flex gap-4 px-6 md:px-10 overflow-x-auto pb-6" style={{ scrollbarWidth: "none" }}>
                        {showcase.map((s) => (
                            <div key={s.label} className="shrink-0" style={{ width: 300 }}>
                                <ReelFrame tone={s.tone} label={s.label} meta={s.meta} />
                                <div className="flex justify-between items-start mt-3">
                                    <div>
                                        <p className="cap" style={{ color: "var(--tx)" }}>{s.label}</p>
                                        <p className="mono text-[11px] mt-1" style={{ color: "var(--dim)" }}>{s.meta}</p>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4" style={{ color: LIME }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-20" style={{ background: "var(--s1)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
                    <div className="px-6 md:px-10 mx-auto" style={{ maxWidth: 1440 }}>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4">
                            {features.map((f, i) => (
                                <div key={f.title} className="p-8 lg:p-10 transition-colors" style={{ borderRight: i < 3 ? "1px solid var(--line)" : undefined, borderTop: 0 }}>
                                    <div className="mb-8" style={{ color: LIME }}>{f.icon}</div>
                                    <h3 className="cap mb-3" style={{ color: "var(--tx)" }}>{f.title}</h3>
                                    <p style={{ color: "var(--dim)", fontSize: 15, lineHeight: 1.5 }}>{f.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Workflow */}
                <section id="workflow" className="py-28 px-6 md:px-10 mx-auto" style={{ maxWidth: 1440 }}>
                    <div className="mb-16">
                        <h2 className="disp font-bold mb-2" style={{ fontSize: "clamp(1.75rem,4vw,2rem)" }}>Technical Workflow</h2>
                        <p className="mono text-[11px]" style={{ color: LIME, letterSpacing: "0.3em" }}>REEL_ASSEMBLY_SEQUENCE_v1.0</p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">
                        {steps.map((s) => (
                            <div key={s.n} className="flex flex-col gap-5">
                                <span className="disp font-bold select-none" style={{ fontSize: 64, lineHeight: 1, opacity: 0.1 }}>{s.n}</span>
                                <div className="hair aspect-square relative overflow-hidden flex items-center justify-center" style={{ background: "var(--s2)" }}>
                                    <span className="mono text-[10px] absolute top-3 left-3" style={{ color: "var(--dim)" }}>STEP_{s.n}</span>
                                    <span className="disp" style={{ fontSize: 40, color: "rgba(198,241,53,0.25)" }}>{s.k[0]}</span>
                                </div>
                                <div>
                                    <h4 className="cap mb-2" style={{ color: "var(--tx)" }}>{s.k}</h4>
                                    <p className="mono text-[11px] uppercase" style={{ color: "var(--dim)" }}>{s.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA band */}
                <section className="relative py-28 overflow-hidden" style={{ borderTop: "1px solid var(--line)" }}>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.03 }}>
                        <span className="disp font-bold whitespace-nowrap" style={{ fontSize: "22vw", color: "#fff" }}>REELS</span>
                    </div>
                    <div className="relative px-6 md:px-10 mx-auto text-center flex flex-col items-center" style={{ maxWidth: 1440 }}>
                        <Ticks c={LIME} o={1} size="1rem" off="0" />
                        <h2 className="disp font-bold mb-8 max-w-2xl" style={{ fontSize: "clamp(2rem,5vw,3rem)", lineHeight: 1.05 }}>Make your first reel in minutes.</h2>
                        <Link href="/brand-setup" className="lime-btn cap font-bold px-12 py-5 transition-transform hover:scale-105" style={{ borderRadius: 8 }}>Initialize creation</Link>
                        <p className="mono text-[11px] uppercase mt-8" style={{ color: "var(--dim)", letterSpacing: "0.15em" }}>No credit card required · Beta access available</p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-16" style={{ background: "#0a0a0f", borderTop: "1px solid var(--line)" }}>
                <div className="px-6 md:px-10 mx-auto flex flex-col md:flex-row justify-between items-start gap-10" style={{ maxWidth: 1440 }}>
                    <div className="flex flex-col gap-5">
                        <span className="cap font-bold" style={{ color: LIME }}>REELSGIQ</span>
                        <p className="mono text-[11px]" style={{ color: "var(--dim)", maxWidth: 220 }}>© 2026 SGiQ · AI-DRIVEN CINEMATICS · ALL RIGHTS RESERVED.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
                        {[
                            { h: "PRODUCT", links: [["Dashboard", "/dashboard"], ["AI Director", "/auto"], ["Community", "/community"]] },
                            { h: "ACCOUNT", links: [["Sign in", "/login"], ["Create reel", "/brand-setup"], ["Help", "/help"]] },
                            { h: "CONNECT", links: [["Twitter / X", "#"], ["Discord", "#"], ["Status", "#"]] },
                        ].map((col) => (
                            <div key={col.h} className="flex flex-col gap-3">
                                <span className="cap" style={{ color: "var(--tx)" }}>{col.h}</span>
                                {col.links.map(([label, href]) => (
                                    <Link key={label} href={href} className="mono text-[11px] transition-colors navlink" style={{ color: "var(--dim)" }}>{label}</Link>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}
