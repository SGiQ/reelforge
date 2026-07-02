"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Play, Wand2, Palette, Eye, Download, Sparkles } from "lucide-react";
import ThreeField from "@/components/ThreeField";
import HeroReel from "@/components/HeroReel";

const HERO = { cap: "Someone should be checking on her.", brand: "CheckWellCall" };

const features = [
    { Icon: Wand2, title: "Write or generate", body: "Draft your script line by line, or let AI compose it from a single prompt.", c: "#a78bfa" },
    { Icon: Palette, title: "Distinct themes", body: "Eight cinematic looks so every reel stays unmistakably on-brand.", c: "#4fc3f7" },
    { Icon: Eye, title: "Live preview", body: "Watch it animate in the browser before you spend a second rendering.", c: "#c6f135" },
    { Icon: Download, title: "1080×1920 MP4", body: "Export a clean vertical file, ready for Reels, TikTok and Shorts.", c: "#7cc4ff" },
];

const steps = [
    { n: "01", k: "BRAND", d: "Logo, watermark, details" },
    { n: "02", k: "SCRIPT", d: "Write it or generate it" },
    { n: "03", k: "THEME", d: "Pick a cinematic look" },
    { n: "04", k: "EXPORT", d: "Render a 1080×1920 MP4" },
];

export default function HomePage() {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        let frame = 0;
        const onMove = (e: MouseEvent) => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                root.style.setProperty("--px", ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
                root.style.setProperty("--py", ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
            });
        };
        window.addEventListener("mousemove", onMove);

        const reveals = root.querySelectorAll(".reveal");
        // Safety net: never leave content permanently hidden if the observer
        // doesn't fire (unsupported / edge cases) — reveal after a short beat.
        const safety = window.setTimeout(() => reveals.forEach((el) => el.classList.add("in")), 2500);
        const io = "IntersectionObserver" in window
            ? new IntersectionObserver(
                (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io!.unobserve(en.target); } }),
                { threshold: 0.12 }
            )
            : null;
        if (io) reveals.forEach((el) => io.observe(el));
        else reveals.forEach((el) => el.classList.add("in"));

        return () => { window.removeEventListener("mousemove", onMove); io?.disconnect(); window.clearTimeout(safety); if (frame) cancelAnimationFrame(frame); };
    }, []);

    return (
        <div ref={rootRef} className="nx relative min-h-screen overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            {/* Background layers */}
            <div className="nx-base" />
            <ThreeField />
            <div className="nx-orb nx-orb1" />
            <div className="nx-orb nx-orb2" />
            <div className="nx-orb nx-orb3" />
            <div className="nx-grid" />
            <div className="nx-vignette" />

            <div className="relative" style={{ zIndex: 10 }}>
                {/* Nav */}
                <nav className="fixed top-0 w-full z-50 nx-navbar">
                    <div className="mx-auto flex items-center justify-between px-6 md:px-10 py-4" style={{ maxWidth: 1320 }}>
                        <Link href="/" className="flex items-center gap-2">
                            <span className="nx-mark" />
                            <span className="disp font-bold text-lg tracking-tight">Reel<span style={{ color: "#c6f135" }}>SGiQ</span></span>
                        </Link>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="nx-link">Features</a>
                            <a href="#flow" className="nx-link">How it works</a>
                            <Link href="/community" className="nx-link">Community</Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/login" className="nx-link hidden sm:block">Sign in</Link>
                            <Link href="/brand-setup" className="nx-cta">Start free</Link>
                        </div>
                    </div>
                </nav>

                <main className="pt-28 md:pt-24">
                    {/* Hero */}
                    <section className="relative mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-14 items-center" style={{ maxWidth: 1320, paddingTop: "3rem", paddingBottom: "5rem" }}>
                        <div className="reveal">
                            <span className="nx-kicker"><Sparkles className="w-4 h-4" /> Next-gen reel studio</span>
                            <h1 className="disp font-bold mt-6" style={{ fontSize: "clamp(3rem,7vw,5.25rem)", lineHeight: 1.02, letterSpacing: "-0.03em" }}>
                                Reels from<br /><span className="nx-grad">another dimension.</span>
                            </h1>
                            <p className="mt-6 max-w-xl" style={{ color: "#aeb9d6", fontSize: 22, lineHeight: 1.55 }}>
                                Turn your brand kit into cinematic 9:16 reels — scripted, themed, previewed live, and rendered to a 1080×1920 MP4 in minutes.
                            </p>
                            <div className="flex flex-wrap gap-4 mt-9">
                                <Link href="/brand-setup" className="nx-cta nx-cta-lg">Start building free <ArrowRight className="w-5 h-5" /></Link>
                                <a href="#showcase" className="nx-ghost nx-cta-lg"><Play className="w-4 h-4" /> See examples</a>
                            </div>
                            <div className="flex items-center gap-6 mt-10" style={{ color: "#7f8bab" }}>
                                <span className="mono text-[13px]">NO CREDIT CARD</span>
                                <span style={{ width: 1, height: 22, background: "rgba(255,255,255,0.12)" }} />
                                <span className="mono text-[13px]">1080×1920 · MP4</span>
                            </div>
                        </div>

                        {/* Floating holographic reel */}
                        <div className="reveal flex justify-center" id="showcase">
                            <div className="nx-parallax" style={{ ["--depth" as any]: 1.4 }}>
                                <div className="nx-hero-panel nx-float">
                                    <span className="nx-corner nx-corner-tl" /><span className="nx-corner nx-corner-tr" />
                                    <span className="nx-corner nx-corner-bl" /><span className="nx-corner nx-corner-br" />
                                    <div className="nx-hero-inner">
                                        <HeroReel fallbackCap={HERO.cap} fallbackBrand={HERO.brand} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features */}
                    <section id="features" className="relative mx-auto px-6 md:px-10 py-20" style={{ maxWidth: 1320 }}>
                        <div className="reveal mb-12">
                            <span className="mono text-[13px]" style={{ color: "#4fc3f7", letterSpacing: "0.25em" }}>SYSTEM // CAPABILITIES</span>
                            <h2 className="disp font-bold mt-3" style={{ fontSize: "clamp(2rem,4vw,2.75rem)" }}>Everything you need to go viral</h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {features.map((f, i) => (
                                <div key={f.title} className="reveal nx-glass nx-card" style={{ transitionDelay: `${i * 80}ms` }}>
                                    <span className="nx-ico" style={{ ["--g" as any]: f.c }}><f.Icon className="w-6 h-6" /></span>
                                    <h3 className="disp font-semibold text-lg mt-5">{f.title}</h3>
                                    <p className="mt-2" style={{ color: "#9aa6c6", fontSize: 16, lineHeight: 1.5 }}>{f.body}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Flow */}
                    <section id="flow" className="relative mx-auto px-6 md:px-10 py-20" style={{ maxWidth: 1320 }}>
                        <div className="reveal mb-12">
                            <span className="mono text-[13px]" style={{ color: "#a78bfa", letterSpacing: "0.25em" }}>SEQUENCE // FOUR STEPS</span>
                            <h2 className="disp font-bold mt-3" style={{ fontSize: "clamp(2rem,4vw,2.75rem)" }}>From brand kit to finished reel</h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {steps.map((s, i) => (
                                <div key={s.n} className="reveal nx-glass nx-node" style={{ transitionDelay: `${i * 80}ms` }}>
                                    <span className="disp nx-node-num">{s.n}</span>
                                    <h4 className="mono mt-6" style={{ letterSpacing: "0.15em", color: "#c6f135" }}>{s.k}</h4>
                                    <p className="mono text-[13px] mt-2 uppercase" style={{ color: "#8592b3" }}>{s.d}</p>
                                    {i < steps.length - 1 && <span className="nx-node-link" />}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="relative mx-auto px-6 md:px-10 py-24" style={{ maxWidth: 1320 }}>
                        <div className="reveal nx-glass nx-cta-band">
                            <div className="nx-orb nx-orb-cta" />
                            <h2 className="disp font-bold relative" style={{ fontSize: "clamp(2.25rem,5vw,3.5rem)", lineHeight: 1.05 }}>Enter the studio.</h2>
                            <p className="mt-4 relative" style={{ color: "#aeb9d6", fontSize: 20 }}>Make your first reel in minutes — no credit card required.</p>
                            <Link href="/brand-setup" className="nx-cta nx-cta-lg mt-8 relative">Start building free <ArrowRight className="w-5 h-5" /></Link>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="relative mx-auto px-6 md:px-10 py-14" style={{ maxWidth: 1320, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2"><span className="nx-mark" /><span className="disp font-bold">ReelSGiQ</span></div>
                            <p className="mono text-[13px] mt-3" style={{ color: "#6b779a", maxWidth: 240 }}>© 2026 SGiQ · AI-DRIVEN CINEMATICS</p>
                        </div>
                        <div className="flex gap-12">
                            {[
                                { h: "PRODUCT", l: [["Dashboard", "/dashboard"], ["AI Director", "/auto"], ["Community", "/community"]] },
                                { h: "ACCOUNT", l: [["Sign in", "/login"], ["Create reel", "/brand-setup"], ["Help", "/help"]] },
                            ].map((col) => (
                                <div key={col.h} className="flex flex-col gap-3">
                                    <span className="mono text-[13px]" style={{ color: "#aeb9d6" }}>{col.h}</span>
                                    {col.l.map(([label, href]) => <Link key={label} href={href} className="nx-link mono text-[13px]">{label}</Link>)}
                                </div>
                            ))}
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

const CSS = `
.nx{ background:#05060a; color:#eaf0ff; font-family:'Inter',system-ui,sans-serif; }
.nx .disp{ font-family:'Space Grotesk','Inter',sans-serif; }
.nx .mono{ font-family:'Geist Mono','Space Mono',ui-monospace,monospace; }
.nx ::selection{ background:#c6f135; color:#05060a; }

.nx-base{ position:fixed; inset:0; z-index:0; background:
  radial-gradient(1200px 600px at 50% -15%, rgba(79,195,247,0.10), transparent 60%),
  radial-gradient(900px 500px at 100% 10%, rgba(167,139,250,0.08), transparent 60%),
  #05060a; }
.nx-grid{ position:fixed; inset:0; z-index:0; pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px);
  background-size:64px 64px;
  -webkit-mask-image:radial-gradient(circle at 50% 28%, #000 0%, transparent 72%);
  mask-image:radial-gradient(circle at 50% 28%, #000 0%, transparent 72%); }
.nx-vignette{ position:fixed; inset:0; z-index:1; pointer-events:none;
  background:radial-gradient(120% 120% at 50% 40%, transparent 55%, rgba(0,0,0,0.55) 100%); }

.nx-orb{ position:fixed; border-radius:50%; z-index:0; pointer-events:none; filter:blur(64px); opacity:0.42;
  transform:translate3d(calc(var(--px,0)*-24px), calc(var(--py,0)*-24px), 0); will-change:transform; }
.nx-orb1{ width:440px; height:440px; top:-80px; left:-60px; background:radial-gradient(circle,#4fc3f7,transparent 70%); animation:nx-drift 16s ease-in-out infinite; }
.nx-orb2{ width:520px; height:520px; top:20%; right:-120px; background:radial-gradient(circle,#a78bfa,transparent 70%); animation:nx-drift 20s ease-in-out infinite reverse; }
.nx-orb3{ width:360px; height:360px; bottom:-60px; left:30%; background:radial-gradient(circle,#c6f135,transparent 70%); opacity:0.22; animation:nx-drift 24s ease-in-out infinite; }
@keyframes nx-drift{ 0%,100%{ margin-top:0; margin-left:0 } 50%{ margin-top:26px; margin-left:20px } }

.nx-navbar{ background:rgba(5,6,10,0.55); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border-bottom:1px solid rgba(255,255,255,0.07); }
.nx-mark{ width:26px; height:26px; border-radius:8px; background:linear-gradient(135deg,#c6f135,#4fc3f7); box-shadow:0 0 18px rgba(198,241,53,0.5); display:inline-block; }
.nx-link{ font-family:'Geist Mono',monospace; font-size:13px; letter-spacing:0.06em; color:#9aa6c6; text-transform:uppercase; transition:color .2s; }
.nx-link:hover{ color:#c6f135; }

.nx-kicker{ display:inline-flex; align-items:center; gap:8px; font-family:'Geist Mono',monospace; font-size:13px; letter-spacing:0.18em; text-transform:uppercase; color:#4fc3f7; padding:7px 14px; border:1px solid rgba(79,195,247,0.3); border-radius:999px; background:rgba(79,195,247,0.06); }
.nx-grad{ background:linear-gradient(100deg,#4fc3f7,#a78bfa 45%,#c6f135); -webkit-background-clip:text; background-clip:text; color:transparent; }

.nx-cta{ display:inline-flex; align-items:center; gap:8px; font-family:'Geist Mono',monospace; font-size:13px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#05060a; background:linear-gradient(135deg,#c6f135,#8fe36b); padding:10px 18px; border-radius:10px; box-shadow:0 0 24px rgba(198,241,53,0.35); transition:transform .2s, box-shadow .2s; }
.nx-cta:hover{ transform:translateY(-2px); box-shadow:0 0 40px rgba(198,241,53,0.55); }
.nx-cta-lg{ font-size:14px; padding:15px 30px; border-radius:12px; }
.nx-ghost{ display:inline-flex; align-items:center; gap:8px; font-family:'Geist Mono',monospace; font-size:14px; letter-spacing:0.06em; text-transform:uppercase; color:#eaf0ff; padding:15px 26px; border-radius:12px; border:1px solid rgba(255,255,255,0.16); background:rgba(255,255,255,0.03); transition:border-color .2s, background .2s; }
.nx-ghost:hover{ border-color:rgba(198,241,53,0.5); background:rgba(198,241,53,0.06); }

.nx-glass{ background:rgba(255,255,255,0.045); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.1); box-shadow:0 10px 46px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08); border-radius:18px; }
.nx-card{ padding:26px 24px; transition:transform .3s, border-color .3s, box-shadow .3s, opacity .8s; }
.nx-card:hover{ transform:translateY(-6px); border-color:rgba(255,255,255,0.2); box-shadow:0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(79,195,247,0.12); }
.nx-ico{ display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:12px; color:var(--g);
  background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.16); box-shadow:0 0 24px rgba(255,255,255,0.06);
  background:color-mix(in srgb, var(--g) 14%, transparent); border:1px solid color-mix(in srgb, var(--g) 35%, transparent); box-shadow:0 0 24px color-mix(in srgb, var(--g) 25%, transparent); }

.nx-node{ position:relative; padding:24px; }
.nx-node-num{ font-size:42px; font-weight:700; line-height:1; background:linear-gradient(135deg,#4fc3f7,#a78bfa); -webkit-background-clip:text; background-clip:text; color:transparent; opacity:0.9; }
.nx-node-link{ position:absolute; top:44px; right:-13px; width:26px; height:1px; background:linear-gradient(90deg,rgba(198,241,53,0.5),transparent); display:none; }
@media(min-width:1024px){ .nx-node-link{ display:block; } }

.nx-parallax{ transform:translate3d(calc(var(--px,0)*18px*var(--depth,1)), calc(var(--py,0)*18px*var(--depth,1)), 0); transition:transform .18s ease-out; will-change:transform; }
.nx-hero-panel{ position:relative; width:min(330px,80vw); padding:10px; border-radius:24px; background:rgba(255,255,255,0.04); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border:1px solid rgba(255,255,255,0.12); box-shadow:0 30px 80px rgba(0,0,0,0.55), 0 0 60px rgba(79,195,247,0.15); }
.nx-hero-inner{ border-radius:16px; overflow:hidden; }
.nx-float{ animation:nx-floaty 7s ease-in-out infinite; }
@keyframes nx-floaty{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-16px) } }
.nx-corner{ position:absolute; width:16px; height:16px; z-index:2; }
.nx-corner-tl{ top:-1px; left:-1px; border-top:2px solid #c6f135; border-left:2px solid #c6f135; }
.nx-corner-tr{ top:-1px; right:-1px; border-top:2px solid #4fc3f7; border-right:2px solid #4fc3f7; }
.nx-corner-bl{ bottom:-1px; left:-1px; border-bottom:2px solid #4fc3f7; border-left:2px solid #4fc3f7; }
.nx-corner-br{ bottom:-1px; right:-1px; border-bottom:2px solid #c6f135; border-right:2px solid #c6f135; }

.nx-cta-band{ position:relative; overflow:hidden; text-align:center; padding:64px 24px; }
.nx-orb-cta{ position:absolute; width:420px; height:420px; top:50%; left:50%; transform:translate(-50%,-50%); background:radial-gradient(circle,rgba(198,241,53,0.18),transparent 70%); filter:blur(50px); }

.reveal{ opacity:0; transform:translateY(26px); transition:opacity .8s ease, transform .8s ease; }
.reveal.in{ opacity:1; transform:none; }

@media (prefers-reduced-motion: reduce){
  .nx-float,.nx-orb1,.nx-orb2,.nx-orb3{ animation:none; }
  .nx-parallax,.nx-orb{ transform:none; }
  .reveal{ opacity:1; transform:none; transition:none; }
}
`;
