import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
    Image as ImageIcon, Film, Type, Video, Search, Scissors, ArrowUpDown,
    Palette, Eye, Download, Mic, Music, QrCode, LayoutDashboard, Play,
    Sparkles, ArrowRight, Clapperboard, MessageSquareText,
    Wand2, Clock, Move, Smile, Shapes, ZoomIn, Blend,
} from "lucide-react";

export const metadata = {
    title: "How ReelSGiQ Works — Help",
    description: "Learn how to build branded short-form video reels in ReelSGiQ: scenes, video clips, stock footage, captions, voiceover, and export.",
};

const STEPS = [
    { n: 1, label: "Brand", color: "#a78bfa", desc: "Logo, watermark & QR" },
    { n: 2, label: "Scenes", color: "#2dd4bf", desc: "Text, image & video" },
    { n: 3, label: "Theme", color: "#a78bfa", desc: "Colors & voice" },
    { n: 4, label: "Preview", color: "#2dd4bf", desc: "Watch it animate" },
    { n: 5, label: "Export", color: "#a78bfa", desc: "Render your MP4" },
];

function Section({ icon, title, accent, children }: { icon: React.ReactNode; title: string; accent: string; children: React.ReactNode }) {
    return (
        <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent}22`, color: accent }}>
                    {icon}
                </div>
                <h3 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
            </div>
            <div className="text-sm leading-relaxed space-y-2" style={{ color: "var(--color-text-secondary)" }}>
                {children}
            </div>
        </div>
    );
}

export default function HelpPage() {
    return (
        <div className="page-container">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Hero */}
                <div className="mb-12">
                    <p className="step-indicator mb-3">
                        <span>Guide</span>
                        <span className="text-xs mx-1">·</span>
                        <span style={{ color: "#a78bfa" }}>How it works</span>
                    </p>
                    <h1 className="section-title">How ReelSGiQ works</h1>
                    <p className="section-subtitle">
                        Build branded 1080×1920 reels in five steps. Mix text, image and video scenes,
                        animate them with motion, icons and emoji, add captions and an AI voiceover,
                        then export a ready-to-post MP4.
                    </p>
                </div>

                {/* 5-step flow */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
                    {STEPS.map((s) => (
                        <div key={s.n} className="glass-card rounded-2xl p-4 text-center">
                            <div className="w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-black"
                                style={{ background: `${s.color}33`, color: s.color }}>
                                {s.n}
                            </div>
                            <div className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>{s.label}</div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{s.desc}</div>
                        </div>
                    ))}
                </div>

                <div className="space-y-5">
                    {/* Step 1 — Brand */}
                    <Section icon={<ImageIcon className="w-5 h-5" />} title="1. Set up your brand" accent="#a78bfa">
                        <p>Your brand assets appear automatically on every reel you make:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: "#cbd5e1" }}>Logo</strong> — shown big on the final slide, and optionally as a small badge on <em>every</em> scene (pick a corner via <em>“Brand Logo on Every Slide”</em>, or turn it off).</li>
                            <li><strong style={{ color: "#cbd5e1" }}>Watermark photo</strong> — a faint background image behind text slides; adjust its opacity. It’s automatically hidden on video scenes and the final branding slide.</li>
                            <li><strong style={{ color: "#cbd5e1" }}>QR code</strong> — upload your own or we generate one from your website URL for the final slide.</li>
                        </ul>
                        <p className="flex items-center gap-2 pt-1"><QrCode className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} /> Your brand is remembered, so you don’t re-upload it every time.</p>
                    </Section>

                    {/* Step 2 — Scenes */}
                    <Section icon={<Clapperboard className="w-5 h-5" />} title="2. Build your scenes" accent="#2dd4bf">
                        <p>A reel is an ordered list of <strong style={{ color: "#cbd5e1" }}>scenes</strong>. You can mix two kinds:</p>
                        <div className="grid sm:grid-cols-3 gap-3 my-2">
                            <div className="rounded-xl p-3" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                                <div className="flex items-center gap-2 font-semibold mb-1" style={{ color: "#a78bfa" }}><Type className="w-4 h-4" /> Text scene</div>
                                <p className="text-xs">A styled text slide — choose the font, size and color. Great for hooks and key messages.</p>
                            </div>
                            <div className="rounded-xl p-3" style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.25)" }}>
                                <div className="flex items-center gap-2 font-semibold mb-1" style={{ color: "#38bdf8" }}><ImageIcon className="w-4 h-4" /> Image scene</div>
                                <p className="text-xs">A still photo background with an optional caption over it. Upload your own image.</p>
                            </div>
                            <div className="rounded-xl p-3" style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(45,212,191,0.25)" }}>
                                <div className="flex items-center gap-2 font-semibold mb-1" style={{ color: "#2dd4bf" }}><Video className="w-4 h-4" /> Video scene</div>
                                <p className="text-xs">A real video clip with an optional caption over it. Upload your own or search stock footage.</p>
                            </div>
                        </div>
                        <p className="font-semibold pt-1" style={{ color: "#cbd5e1" }}>For video scenes you can:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li className="flex items-start gap-2"><Search className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2dd4bf" }} /><span><strong style={{ color: "#cbd5e1" }}>Upload</strong> an MP4/MOV/WebM, or <strong style={{ color: "#cbd5e1" }}>search stock footage</strong> (powered by Pexels) and pick a clip.</span></li>
                            <li className="flex items-start gap-2"><Scissors className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2dd4bf" }} /><span><strong style={{ color: "#cbd5e1" }}>Trim</strong> the clip with start/end seconds.</span></li>
                            <li className="flex items-start gap-2"><MessageSquareText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2dd4bf" }} /><span>Add a <strong style={{ color: "#cbd5e1" }}>caption</strong> — it overlays on the clip and is what the AI voiceover speaks.</span></li>
                            <li className="flex items-start gap-2"><ArrowUpDown className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2dd4bf" }} /><span><strong style={{ color: "#cbd5e1" }}>Reorder</strong> scenes with the up/down arrows.</span></li>
                        </ul>
                        <p className="flex items-center gap-2 pt-1"><Sparkles className="w-4 h-4" style={{ color: "#a78bfa" }} /> In a hurry? Use <strong style={{ color: "#cbd5e1" }}>Generate Script with AI</strong> to draft your text scenes from a prompt.</p>
                        <p className="flex items-center gap-2"><Mic className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} /> The <strong style={{ color: "#cbd5e1" }}>Final Logo Slide</strong> field lets you set a closing line the voiceover says over your logo (it isn’t shown on screen).</p>
                    </Section>

                    {/* Motion & animation */}
                    <Section icon={<Wand2 className="w-5 h-5" />} title="Bring scenes to life — motion & animation" accent="#2dd4bf">
                        <p>Every <strong style={{ color: "#cbd5e1" }}>text</strong> and <strong style={{ color: "#cbd5e1" }}>image</strong> scene has motion controls right under its caption:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li className="flex items-start gap-2"><Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2dd4bf" }} /><span><strong style={{ color: "#cbd5e1" }}>Hold</strong> — how many seconds the scene stays on screen before the next one. Leave it blank for auto (it matches the voiceover length, and never cuts a longer one off).</span></li>
                            <li className="flex items-start gap-2"><ZoomIn className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2dd4bf" }} /><span><strong style={{ color: "#cbd5e1" }}>Background</strong> — a slow Ken-Burns move on the scene: <em>Zoom in</em>, <em>Zoom out</em>, or <em>Pan</em> left/right.</span></li>
                            <li className="flex items-start gap-2"><Type className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2dd4bf" }} /><span><strong style={{ color: "#cbd5e1" }}>Text in</strong> — how the caption appears: <em>Fade</em>, <em>Fade up</em>, or <em>Slide</em> in from a side.</span></li>
                        </ul>

                        <p className="font-semibold pt-2" style={{ color: "#cbd5e1" }}>Add icons, emoji & stickers</p>
                        <p>Each text/image scene has a small <strong style={{ color: "#cbd5e1" }}>9:16 canvas</strong>. Add elements, then <strong style={{ color: "#cbd5e1" }}>drag them anywhere</strong> on the scene:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li className="flex items-start gap-2"><Shapes className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#a78bfa" }} /><span><strong style={{ color: "#cbd5e1" }}>Icon</strong> — search a built-in icon set (hearts, stars, arrows, check marks…) and tint it any color.</span></li>
                            <li className="flex items-start gap-2"><Smile className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#fbbf24" }} /><span><strong style={{ color: "#cbd5e1" }}>Emoji</strong> — pick from a sticker grid (🔥 ✨ 💯 🎉 …).</span></li>
                            <li className="flex items-start gap-2"><ImageIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2dd4bf" }} /><span><strong style={{ color: "#cbd5e1" }}>Upload</strong> — drop in your own PNG/SVG graphic or sticker.</span></li>
                            <li className="flex items-start gap-2"><Move className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#cbd5e1" }} /><span>Tap an element to set its <strong style={{ color: "#cbd5e1" }}>size</strong>, its <strong style={{ color: "#cbd5e1" }}>motion</strong> (<em>Pop</em>, <em>Fade</em>, or <em>Bounce</em> in), and — for icons — its <strong style={{ color: "#cbd5e1" }}>color</strong>.</span></li>
                        </ul>

                        <p className="flex items-center gap-2 pt-1"><Blend className="w-4 h-4" style={{ color: "#a78bfa" }} /> Scenes <strong style={{ color: "#cbd5e1" }}>crossfade</strong> into each other automatically for a smooth flow.</p>
                        <p className="rounded-lg px-3 py-2 mt-1 text-xs" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#cbd5e1" }}>
                            <strong>Tip:</strong> per scene, use <em>Background</em> zoom/pan <em>or</em> placed elements — when a scene has icons/emoji on it, its background stays still so the elements animate crisply.
                        </p>
                    </Section>

                    {/* Step 3 — Theme & voice */}
                    <Section icon={<Palette className="w-5 h-5" />} title="3. Pick a theme & voice" accent="#a78bfa">
                        <p>Choose a color theme that sets the gradient, text and accent colors across the reel.</p>
                        <p className="flex items-center gap-2"><Mic className="w-4 h-4" style={{ color: "#2dd4bf" }} /> Pick an <strong style={{ color: "#cbd5e1" }}>AI voice</strong> to narrate the reel. The voice speaks each text scene, each video caption, and your final outro line.</p>
                        <p className="flex items-center gap-2"><Music className="w-4 h-4" style={{ color: "#2dd4bf" }} /> Add <strong style={{ color: "#cbd5e1" }}>background music</strong> — pick a royalty-free track from the <strong style={{ color: "#cbd5e1" }}>music library</strong> or upload your own, then set its volume. It’s mixed quietly under the voiceover.</p>
                    </Section>

                    {/* Step 4 — Preview */}
                    <Section icon={<Eye className="w-5 h-5" />} title="4. Preview" accent="#2dd4bf">
                        <p>See exactly what your MP4 will look like — scenes animate in sequence, video clips play with their captions, and you can fine-tune each text slide’s styling before rendering.</p>
                    </Section>

                    {/* Step 5 — Export */}
                    <Section icon={<Download className="w-5 h-5" />} title="5. Export your MP4" accent="#a78bfa">
                        <p>Hit render and ReelSGiQ stitches everything together into a 1080×1920 H.264 MP4: each scene is fitted to 9:16, captions and your logo are overlaid, the voiceover and music are mixed, and a branded logo + QR slide is added at the end.</p>
                        <p>Rendering runs in the background — when it’s done you’ll find the reel on your dashboard.</p>
                    </Section>

                    {/* Dashboard */}
                    <Section icon={<LayoutDashboard className="w-5 h-5" />} title="Your dashboard" accent="#2dd4bf">
                        <ul className="list-disc pl-5 space-y-1">
                            <li className="flex items-start gap-2"><Play className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2dd4bf" }} /><span><strong style={{ color: "#cbd5e1" }}>Click any reel</strong> to play it full-screen with sound.</span></li>
                            <li className="flex items-start gap-2"><Download className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2dd4bf" }} /><span><strong style={{ color: "#cbd5e1" }}>Download</strong> the finished MP4.</span></li>
                            <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#2dd4bf" }} /><span><strong style={{ color: "#cbd5e1" }}>Re-edit</strong> reloads a past reel’s brand, scenes, theme and audio so you can tweak and re-render.</span></li>
                        </ul>
                    </Section>

                    {/* Good to know */}
                    <Section icon={<Sparkles className="w-5 h-5" />} title="Good to know" accent="#a78bfa">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Reels are <strong style={{ color: "#cbd5e1" }}>1080×1920 (9:16)</strong> — vertical, for Reels / TikTok / Shorts. Clips are auto-cropped to fit.</li>
                            <li>Up to <strong style={{ color: "#cbd5e1" }}>15 scenes</strong> per reel; captions are best kept under ~150 characters.</li>
                            <li>A scene with a voiceover longer than its clip automatically extends so nothing gets cut off.</li>
                            <li>Video scenes use the <strong style={{ color: "#cbd5e1" }}>AI voiceover</strong>, not the clip’s original sound.</li>
                            <li>Video reels — and scenes with animated icons/emoji — take a little longer to render than plain text-only ones. That’s normal.</li>
                        </ul>
                    </Section>
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <Link href="/brand-setup" className="btn-primary inline-flex justify-center py-4 px-8 text-base">
                        Start building <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </main>
        </div>
    );
}
