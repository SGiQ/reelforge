import Link from "next/link";
import { ArrowUpRight, SquareTerminal, Palette, Eye, Download, AudioLines, Play } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import HeroReel from "@/components/HeroReel";

/* ── Cinematic Studio landing ─────────────────────────────────────────────────
   Chrome is driven by the app theme tokens (flips light/dark). The reel FRAMES
   are video content — they keep their own dark/themed colors in both modes,
   the same way a dark reel stays dark inside the light app. ─────────────────── */

// Sample reels shown as film-framed "slides" (video content — fixed colors).
const HERO = { cap: "Someone should be checking on her.", brand: "CheckWellCall", bg: "linear-gradient(160deg,#161b2e,#0a0a0f)", text: "#e9edff", accent: "#8ab4ff" };
const showcase = [
    { cap: "Your morning call, every morning.", brand: "CheckWellCall", meta: "WELLNESS / 15s", bg: "linear-gradient(160deg,#101a2e,#0a0a0f)", text: "#e6efff", accent: "#7cc4ff" },
    { cap: "New drop. Limited run.", brand: "Nomad Goods", meta: "PRODUCT / 12s", bg: "linear-gradient(160deg,#2a1c08,#0a0a0f)", text: "#ffe9c4", accent: "#f5b642" },
    { cap: "Book a demo in thirty seconds.", brand: "FlowOps", meta: "SAAS / 08s", bg: "linear-gradient(160deg,#07202a,#0a0a0f)", text: "#d8f3ff", accent: "#4fc3f7" },
    { cap: "We show up. Every single day.", brand: "Meridian Care", meta: "BRAND / 20s", bg: "linear-gradient(160deg,#2a0f18,#0a0a0f)", text: "#ffd9e1", accent: "#ff6b8a" },
];

const features = [
    { icon: <SquareTerminal className="w-7 h-7" />, title: "WRITE OR GENERATE", body: "Draft your script line by line, or let AI write it from a one-line prompt." },
    { icon: <Palette className="w-7 h-7" />, title: "DISTINCT THEMES", body: "Eight cinematic color themes so every reel stays unmistakably on-brand." },
    { icon: <Eye className="w-7 h-7" />, title: "LIVE PREVIEW", body: "Watch your reel animate in the browser before you spend a second rendering." },
    { icon: <Download className="w-7 h-7" />, title: "1080×1920 MP4", body: "Export a clean vertical MP4, ready for Reels, TikTok, and YouTube Shorts." },
];

const steps = [
    { n: "01", k: "BRAND", d: "Add your logo, watermark, and details", img: "/workflow/brand.png" },
    { n: "02", k: "SCRIPT", d: "Write it or generate it with AI", img: "/workflow/script.png" },
    { n: "03", k: "THEME", d: "Pick a cinematic visual style", img: "/workflow/theme.png" },
    { n: "04", k: "EXPORT", d: "Render a 1080×1920 MP4", img: "/workflow/export.png" },
];

function Ticks({ c = "var(--acc)", o = 0.5, size = "1.5rem", off = "-0.75rem" }: { c?: string; o?: number; size?: string; off?: string }) {
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

/* A film-framed sample reel "slide". Interior is video content (fixed dark
   colors) regardless of the app theme. */
function ReelFrame({ reel, meta, hero = false }: { reel: { cap: string; brand: string; bg: string; text: string; accent: string }; meta?: string; hero?: boolean }) {
    return (
        <div className="relative w-full aspect-[9/16] overflow-hidden" style={{ background: reel.bg, border: "1px solid rgba(255,255,255,0.1)" }}>
            {hero && <span className="scan" />}
            {/* caption slide */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <p className="disp font-bold" style={{ color: reel.text, fontSize: hero ? 24 : 19, lineHeight: 1.15, textShadow: "0 2px 14px rgba(0,0,0,0.45)" }}>{reel.cap}</p>
                <p className="mono mt-3 text-[11px]" style={{ color: reel.accent, letterSpacing: "0.12em" }}>{reel.brand.toUpperCase()}</p>
            </div>
            {/* mono badge */}
            <div className="absolute top-3 left-3">
                <span className="mono px-2 py-1 text-[11px]" style={{ background: "rgba(10,10,15,0.8)", color: "#c6f135", border: "1px solid rgba(198,241,53,0.25)" }}>
                    {hero ? "0:07 · 1080×1920" : meta}
                </span>
            </div>
            {/* timeline strip */}
            <div className="absolute bottom-0 left-0 w-full p-3" style={{ background: "linear-gradient(to top,#0a0a0f,transparent)" }}>
                <div className="flex justify-between items-end mb-2">
                    <span className="mono text-[11px]" style={{ color: "#c5c9ae" }}>{hero ? "SCENE 01 / 03" : "REEL"}</span>
                    <AudioLines className="w-3.5 h-3.5" style={{ color: "#c6f135" }} />
                </div>
                <div className="relative w-full" style={{ height: 2, background: "rgba(255,255,255,0.14)" }}>
                    <div className="absolute top-0 left-0 h-full" style={{ width: hero ? "40%" : "62%", background: "#c6f135" }} />
                    <div className="absolute" style={{ top: -3, left: hero ? "40%" : "62%", width: 8, height: 8, background: "#c6f135", boxShadow: "0 0 10px #c6f135" }} />
                </div>
            </div>
        </div>
    );
}

export default function HomePage() {
    const cineCSS = `
    .cine{
      --bg:var(--color-surface);--s1:var(--color-surface-card);--s2:var(--color-surface-elevated);
      --tx:var(--color-text-primary);--dim:var(--color-text-secondary);--muted:var(--color-text-muted);
      --line:var(--hairline);--acc:var(--color-accent);--accs:var(--color-accent-surface);--ink:var(--color-accent-ink);
      background:var(--bg);color:var(--tx);font-family:'Inter',system-ui,sans-serif;
    }
    .cine .disp{font-family:'Space Grotesk',system-ui,sans-serif;letter-spacing:-0.03em;}
    .cine .mono{font-family:'Geist Mono','Space Mono',ui-monospace,monospace;}
    .cine .hair{border:1px solid var(--line);}
    .cine ::selection{background:var(--accs);color:var(--ink);}
    .cine .scan{position:absolute;left:0;width:100%;height:1px;background:#c6f135;opacity:0.3;z-index:10;animation:cine-scan 7s linear infinite;}
    @keyframes cine-scan{0%{top:-10%}100%{top:110%}}
    .cine .lime-btn{background:var(--accs);color:var(--ink);}
    .cine .lime-btn:hover{filter:brightness(1.08);}
    .cine .navlink:hover{color:var(--acc);}
    .cine .cap{font-family:'Geist Mono','Space Mono',monospace;font-size:17px;letter-spacing:0.1em;text-transform:uppercase;}
    `;

    return (
        <div className="cine min-h-screen">
            <style dangerouslySetInnerHTML={{ __html: cineCSS }} />

            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 hair" style={{ background: "rgb(var(--rgb-surface) / 0.8)", backdropFilter: "blur(12px)", borderLeft: 0, borderRight: 0, borderTop: 0 }}>
                <div className="flex justify-between items-center px-6 md:px-10 py-4 mx-auto" style={{ maxWidth: 1440 }}>
                    <div className="flex items-center gap-8">
                        <Link href="/" className="disp text-lg font-bold" style={{ color: "var(--acc)" }}>ReelSGiQ</Link>
                        <div className="hidden md:flex gap-6">
                            <a href="#features" className="cap navlink transition-colors" style={{ color: "var(--dim)" }}>Features</a>
                            <a href="#workflow" className="cap navlink transition-colors" style={{ color: "var(--dim)" }}>How it works</a>
                            <Link href="/community" className="cap navlink transition-colors" style={{ color: "var(--dim)" }}>Community</Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/login" className="cap px-3 sm:px-4 py-2 transition-colors navlink whitespace-nowrap" style={{ color: "var(--dim)" }}>Sign in</Link>
                        <Link href="/brand-setup" className="lime-btn cap font-bold px-4 sm:px-5 py-2.5 transition-all whitespace-nowrap" style={{ borderRadius: 8 }}>Start free</Link>
                        <ThemeToggle />
                    </div>
                </div>
            </nav>

            <main className="pt-24">
                {/* Hero */}
                <section className="relative px-6 md:px-10 mx-auto py-16 lg:py-28 grid lg:grid-cols-2 gap-16 items-center overflow-hidden" style={{ maxWidth: 1440 }}>
                    <div className="absolute -top-40 -left-40 w-80 h-80" style={{ background: "rgba(198,241,53,0.06)", filter: "blur(120px)" }} />
                    <div className="relative z-10 flex flex-col items-start gap-6">
                        <span className="cap pl-4" style={{ color: "var(--acc)", borderLeft: "2px solid var(--acc)", letterSpacing: "0.2em" }}>AI Reel Studio / For Brands</span>
                        <h1 className="disp font-bold max-w-2xl" style={{ fontSize: "clamp(3.5rem,8vw,5.5rem)", lineHeight: 1.02 }}>Reels that hit different.</h1>
                        <p className="max-w-xl" style={{ color: "var(--dim)", fontSize: 26, lineHeight: 1.55 }}>
                            Turn your logo, script, and clips into branded 9:16 reels. Pick a theme, preview it live in the browser, and export a 1080×1920 MP4 — in minutes.
                        </p>
                        <div className="flex flex-wrap gap-4 mt-2">
                            <Link href="/brand-setup" className="lime-btn cap font-bold px-8 py-4 transition-all" style={{ borderRadius: 8 }}>Start building free</Link>
                            <a href="#showcase" className="cap hair px-8 py-4 transition-colors flex items-center gap-2" style={{ color: "var(--tx)", borderRadius: 8 }}>
                                <Play className="w-4 h-4" /> See examples
                            </a>
                        </div>
                        <div className="mt-10 flex gap-8 items-center" style={{ opacity: 0.55 }}>
                            <div className="flex flex-col gap-1">
                                <span className="mono text-[17px]" style={{ color: "var(--muted)" }}>NO CREDIT CARD</span>
                                <span className="cap">FREE TO START</span>
                            </div>
                            <div style={{ width: 1, height: 32, background: "var(--line)" }} />
                            <div className="flex flex-col gap-1">
                                <span className="mono text-[17px]" style={{ color: "var(--muted)" }}>OUTPUT</span>
                                <span className="cap">1080×1920 · MP4</span>
                            </div>
                        </div>
                    </div>

                    {/* Hero mockup — ticks hug the frame */}
                    <div className="flex justify-center">
                        <div className="relative w-full max-w-[300px]" style={{ boxShadow: "0 0 100px rgba(198,241,53,0.05)" }}>
                            <Ticks />
                            <HeroReel fallbackCap={HERO.cap} fallbackBrand={HERO.brand} />
                        </div>
                    </div>
                </section>

                {/* Trust strip */}
                <section className="hair py-10" style={{ borderLeft: 0, borderRight: 0 }}>
                    <div className="px-6 md:px-10 mx-auto flex flex-col md:flex-row items-center justify-between gap-6" style={{ maxWidth: 1440 }}>
                        <span className="cap" style={{ color: "var(--muted)" }}>Built for brand marketers</span>
                        <div className="flex flex-wrap gap-x-6 gap-y-3 items-center justify-center" style={{ color: "var(--muted)" }}>
                            {["STUDIO_X", "KINETIC", "FRAMED", "PXL.CO"].map((n, i) => (
                                <div key={n} className="flex items-center gap-8">
                                    {i > 0 && <span style={{ width: 1, height: 16, background: "var(--line)" }} />}
                                    <span className="disp italic" style={{ opacity: 0.6 }}>{n}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Showcase */}
                <section id="showcase" className="py-20">
                    <div className="px-6 md:px-10 mx-auto mb-10" style={{ maxWidth: 1440 }}>
                        <h2 className="cap mb-4" style={{ color: "var(--acc)" }}>Showcase / Made with ReelSGiQ</h2>
                        <div style={{ height: 1, background: "var(--line)" }} />
                    </div>
                    {/* Mobile: 2-col grid (vertical scroll only). Desktop: horizontal
                        contact-sheet scroller. Avoids side-to-side drift on phones. */}
                    <div className="px-6 md:px-10 grid grid-cols-2 gap-4 lg:flex lg:overflow-x-auto lg:pb-6" style={{ scrollbarWidth: "none" }}>
                        {showcase.map((s) => (
                            <div key={s.brand} className="lg:shrink-0 lg:w-[300px]">
                                <ReelFrame reel={s} meta={s.meta} />
                                <div className="flex justify-between items-start mt-3">
                                    <div>
                                        <p className="cap" style={{ color: "var(--tx)" }}>{s.brand}</p>
                                        <p className="mono text-[17px] mt-1" style={{ color: "var(--dim)" }}>{s.meta}</p>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4" style={{ color: "var(--acc)" }} />
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
                                <div key={f.title} className="p-8 lg:p-10" style={{ borderRight: i < 3 ? "1px solid var(--line)" : undefined }}>
                                    <div className="mb-8" style={{ color: "var(--acc)" }}>{f.icon}</div>
                                    <h3 className="cap mb-3" style={{ color: "var(--tx)" }}>{f.title}</h3>
                                    <p style={{ color: "var(--dim)", fontSize: 21, lineHeight: 1.5 }}>{f.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Workflow */}
                <section id="workflow" className="py-28 px-6 md:px-10 mx-auto" style={{ maxWidth: 1440 }}>
                    <div className="mb-16">
                        <h2 className="disp font-bold mb-2" style={{ fontSize: "clamp(2.25rem,5vw,2.75rem)" }}>Four steps to a finished reel</h2>
                        <p className="mono text-[17px]" style={{ color: "var(--acc)", letterSpacing: "0.3em" }}>BRAND · SCRIPT · THEME · EXPORT</p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">
                        {steps.map((s) => (
                            <div key={s.n} className="flex flex-col gap-5">
                                <span className="disp font-bold select-none" style={{ fontSize: 64, lineHeight: 1, opacity: 0.12, color: "var(--tx)" }}>{s.n}</span>
                                <div className="hair aspect-square relative overflow-hidden group" style={{ background: "var(--s2)" }}>
                                    {/* Real screenshot of the actual step screen (video/UI content). */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={s.img} alt={`${s.k} step`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: "top" }} />
                                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,15,0.55), transparent 55%)" }} />
                                    <span className="mono text-[11px] absolute top-3 left-3" style={{ color: "rgba(255,255,255,0.82)", background: "rgba(10,10,15,0.65)", padding: "2px 7px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.12)" }}>STEP_{s.n}</span>
                                </div>
                                <div>
                                    <h4 className="cap mb-2" style={{ color: "var(--tx)" }}>{s.k}</h4>
                                    <p className="mono text-[17px] uppercase" style={{ color: "var(--dim)" }}>{s.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA band */}
                <section className="relative py-28 overflow-hidden" style={{ borderTop: "1px solid var(--line)" }}>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.03 }}>
                        <span className="disp font-bold whitespace-nowrap" style={{ fontSize: "22vw", color: "var(--tx)" }}>REELS</span>
                    </div>
                    <div className="relative px-6 md:px-10 mx-auto text-center flex flex-col items-center" style={{ maxWidth: 1440 }}>
                        <Ticks o={1} size="1rem" off="0" />
                        <h2 className="disp font-bold mb-8 max-w-2xl" style={{ fontSize: "clamp(2.5rem,6vw,3.75rem)", lineHeight: 1.05 }}>Make your first reel in minutes.</h2>
                        <Link href="/brand-setup" className="lime-btn cap font-bold px-12 py-5 transition-transform hover:scale-105" style={{ borderRadius: 8 }}>Start building free</Link>
                        <p className="mono text-[17px] uppercase mt-8" style={{ color: "var(--dim)", letterSpacing: "0.15em" }}>No credit card required · Free to start</p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-16" style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
                <div className="px-6 md:px-10 mx-auto flex flex-col md:flex-row justify-between items-start gap-10" style={{ maxWidth: 1440 }}>
                    <div className="flex flex-col gap-5">
                        <span className="cap font-bold" style={{ color: "var(--acc)" }}>REELSGIQ</span>
                        <p className="mono text-[17px]" style={{ color: "var(--dim)", maxWidth: 220 }}>© 2026 SGiQ · AI-DRIVEN CINEMATICS · ALL RIGHTS RESERVED.</p>
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
                                    <Link key={label} href={href} className="mono text-[17px] transition-colors navlink" style={{ color: "var(--dim)" }}>{label}</Link>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}
