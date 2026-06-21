"use client";
/**
 * SceneElementsEditor — place icons / emoji / uploaded graphics on a still scene.
 * Drag elements anywhere on a 9:16 canvas; each gets a size, animation, and
 * (for icons) a color. Elements are stored normalized (x/y in 0..1).
 */
import { useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import { upload } from "@vercel/blob/client";
import { SceneElement, ElementType } from "@/lib/scenes";
import { Smile, Shapes, Upload, Trash2 } from "lucide-react";

const ICON_NAMES = [
    "Heart", "Star", "Check", "CheckCircle", "ThumbsUp", "Flame", "Zap", "Sparkles",
    "Bell", "Gift", "Crown", "Award", "Trophy", "Rocket", "Sun", "Moon",
    "Cloud", "Music", "Camera", "Video", "Phone", "Mail", "MapPin", "Calendar",
    "Clock", "ShoppingCart", "Tag", "Percent", "DollarSign", "TrendingUp", "Target", "Lightbulb",
    "Smile", "Coffee", "Gem", "Megaphone", "Quote", "ArrowRight", "ArrowUp", "Play",
    "Lock", "Shield", "Globe", "Users", "MessageCircle", "AlertCircle", "Info", "Eye",
];

const EMOJIS = [
    "😀", "😍", "🔥", "✨", "💯", "🎉", "🎊", "🚀", "⭐", "❤️", "👍", "👏",
    "🙌", "💪", "🤩", "😎", "🥳", "💸", "💰", "📈", "📊", "🛒", "🎁", "🏆",
    "🥇", "💡", "📣", "🔔", "✅", "❌", "⚡", "🌟", "🌈", "☀️", "🌙", "🍕",
    "☕", "🎵", "🎬", "📸", "📱", "💬", "❓", "👀", "🤔", "🙏", "👇", "💎",
];

const ELEMENT_ANIMS = [
    { value: "pop", label: "Pop in" },
    { value: "fade", label: "Fade in" },
    { value: "bounce", label: "Bounce" },
    { value: "none", label: "None" },
];

const newId = () =>
    (typeof crypto !== "undefined" && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : `el_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

function ElementGlyph({ el, px }: { el: SceneElement; px: number }) {
    if (el.type === "emoji") return <span style={{ fontSize: px, lineHeight: 1 }}>{el.value}</span>;
    if (el.type === "image")
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={el.value} alt="" style={{ width: px, height: px, objectFit: "contain", display: "block" }} />;
    const Cmp = (LucideIcons as any)[el.value];
    return Cmp ? <Cmp size={px} color={el.color || "#ffffff"} strokeWidth={2.2} /> : null;
}

export default function SceneElementsEditor({
    elements,
    onChange,
    bgImage,
}: {
    elements: SceneElement[];
    onChange: (els: SceneElement[]) => void;
    bgImage?: string;
}) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [tab, setTab] = useState<"" | "emoji" | "icon" | "upload">("");
    const [iconQuery, setIconQuery] = useState("");
    const [uploading, setUploading] = useState(false);
    const dragId = useRef<string | null>(null);

    const selected = elements.find((e) => e.id === selectedId) || null;

    const addElement = (type: ElementType, value: string) => {
        const el: SceneElement = {
            id: newId(), type, value,
            x: 0.5, y: 0.35, size: type === "emoji" ? 150 : 130,
            color: type === "icon" ? "#ffffff" : undefined,
            animation: "pop",
        };
        onChange([...elements, el]);
        setSelectedId(el.id);
        setTab("");
    };

    const updateEl = (id: string, patch: Partial<SceneElement>) =>
        onChange(elements.map((e) => (e.id === id ? { ...e, ...patch } : e)));

    const removeEl = (id: string) => {
        onChange(elements.filter((e) => e.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragId.current || !canvasRef.current) return;
        const r = canvasRef.current.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        updateEl(dragId.current, { x, y });
    };

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const blob = await upload(file.name, file, {
                access: "public",
                handleUploadUrl: `${window.location.origin}/api/upload`,
            });
            addElement("image", blob.url);
        } catch (e: any) {
            // eslint-disable-next-line no-alert
            alert(`Upload failed: ${e?.message || "unknown error"}`);
        } finally {
            setUploading(false);
        }
    };

    // Canvas px → element size scales relative to a 1080-wide frame; canvas is ~160px wide.
    const CANVAS_W = 160;
    const sizeToPx = (size: number) => (size / 1080) * CANVAS_W;

    return (
        <div className="pt-3 mt-1 border-t" style={{ borderColor: "rgba(45,45,74,0.4)" }}>
            <div className="flex items-start gap-4 flex-wrap">
                {/* Drag canvas */}
                <div
                    ref={canvasRef}
                    onPointerMove={onPointerMove}
                    onPointerUp={() => (dragId.current = null)}
                    onPointerLeave={() => (dragId.current = null)}
                    style={{
                        width: CANVAS_W, height: (CANVAS_W * 16) / 9, position: "relative",
                        borderRadius: 10, overflow: "hidden", flexShrink: 0,
                        background: bgImage ? `center/cover no-repeat url(${bgImage})` : "linear-gradient(160deg,#1a1a2e,#0f0f1a)",
                        border: "1px solid rgba(255,255,255,0.08)", touchAction: "none",
                    }}
                    onPointerDown={() => setSelectedId(null)}
                >
                    {elements.map((el) => (
                        <div
                            key={el.id}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                dragId.current = el.id;
                                setSelectedId(el.id);
                                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                            }}
                            style={{
                                position: "absolute", left: `${el.x * 100}%`, top: `${el.y * 100}%`,
                                transform: "translate(-50%,-50%)", cursor: "grab",
                                outline: selectedId === el.id ? "2px solid #2dd4bf" : "none",
                                outlineOffset: 3, borderRadius: 6, touchAction: "none",
                            }}
                        >
                            <ElementGlyph el={el} px={Math.max(12, sizeToPx(el.size))} />
                        </div>
                    ))}
                    {elements.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-center px-2"
                            style={{ color: "#475569", fontSize: 10 }}>
                            Add an icon, emoji,<br />or image →
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex-1 min-w-[200px] space-y-3">
                    {/* Add buttons */}
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setTab(tab === "icon" ? "" : "icon")}
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-white/10 hover:border-white/30"
                            style={{ color: "#a78bfa" }}>
                            <Shapes className="w-3.5 h-3.5" /> Icon
                        </button>
                        <button type="button" onClick={() => setTab(tab === "emoji" ? "" : "emoji")}
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-white/10 hover:border-white/30"
                            style={{ color: "#fbbf24" }}>
                            <Smile className="w-3.5 h-3.5" /> Emoji
                        </button>
                        <label className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-white/10 hover:border-white/30 cursor-pointer"
                            style={{ color: "#2dd4bf" }}>
                            <Upload className="w-3.5 h-3.5" /> {uploading ? "Uploading…" : "Upload"}
                            <input type="file" accept="image/*" className="hidden" disabled={uploading}
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.currentTarget.value = ""; }} />
                        </label>
                    </div>

                    {/* Picker panels */}
                    {tab === "icon" && (
                        <div className="rounded-lg p-2" style={{ background: "rgba(15,15,26,0.6)" }}>
                            <input value={iconQuery} onChange={(e) => setIconQuery(e.target.value)}
                                placeholder="Search icons…"
                                className="input-field w-full text-xs py-1 mb-2" />
                            <div className="grid grid-cols-8 gap-1 max-h-28 overflow-y-auto">
                                {ICON_NAMES.filter((n) => n.toLowerCase().includes(iconQuery.toLowerCase())).map((name) => {
                                    const Cmp = (LucideIcons as any)[name];
                                    return Cmp ? (
                                        <button key={name} type="button" title={name} onClick={() => addElement("icon", name)}
                                            className="flex items-center justify-center p-1.5 rounded hover:bg-white/10">
                                            <Cmp className="w-4 h-4" color="#e2e8f0" />
                                        </button>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}
                    {tab === "emoji" && (
                        <div className="rounded-lg p-2" style={{ background: "rgba(15,15,26,0.6)" }}>
                            <div className="grid grid-cols-8 gap-1 max-h-28 overflow-y-auto">
                                {EMOJIS.map((em) => (
                                    <button key={em} type="button" onClick={() => addElement("emoji", em)}
                                        className="text-lg rounded hover:bg-white/10 leading-none py-0.5">{em}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected element controls */}
                    {selected ? (
                        <div className="rounded-lg p-3 space-y-2.5" style={{ background: "rgba(15,15,26,0.6)" }}>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold" style={{ color: "#94a3b8" }}>
                                    Selected: {selected.type === "emoji" ? selected.value : selected.type === "image" ? "Image" : selected.value}
                                </span>
                                <button type="button" onClick={() => removeEl(selected.id)} title="Remove"
                                    className="p-1 rounded hover:bg-red-500/20" style={{ color: "#f87171" }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] w-12" style={{ color: "#64748b" }}>Size</span>
                                <input type="range" min={50} max={420} step={10} value={selected.size}
                                    onChange={(e) => updateEl(selected.id, { size: parseInt(e.target.value, 10) })}
                                    className="flex-1 accent-brand-purple" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] w-12" style={{ color: "#64748b" }}>Motion</span>
                                <select value={selected.animation} onChange={(e) => updateEl(selected.id, { animation: e.target.value as any })}
                                    className="bg-transparent text-[11px] border border-white/10 rounded px-1 py-0.5 outline-none flex-1" style={{ color: "#2dd4bf" }}>
                                    {ELEMENT_ANIMS.map((a) => <option key={a.value} value={a.value} className="bg-[#1a1a2e] text-white">{a.label}</option>)}
                                </select>
                            </div>
                            {selected.type === "icon" && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] w-12" style={{ color: "#64748b" }}>Color</span>
                                    <input type="color" value={selected.color || "#ffffff"}
                                        onChange={(e) => updateEl(selected.id, { color: e.target.value })}
                                        className="w-7 h-7 rounded bg-transparent border border-white/10 cursor-pointer" />
                                </div>
                            )}
                        </div>
                    ) : elements.length > 0 ? (
                        <p className="text-[11px]" style={{ color: "#64748b" }}>Tap an element on the canvas to edit it.</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
