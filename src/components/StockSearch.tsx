"use client";
import { useState } from "react";

export interface StockClip {
    id: number;
    thumbnail: string;
    duration: number;
    author: string;
    downloadUrl: string;
}

export default function StockSearch({ onSelect }: { onSelect: (clip: StockClip) => void }) {
    const [q, setQ] = useState("");
    const [clips, setClips] = useState<StockClip[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const search = async () => {
        if (!q.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/stock/search?query=${encodeURIComponent(q)}&orientation=portrait`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Search failed");
            setClips(data.clips || []);
            setSearched(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }}
                    placeholder="Search stock footage — e.g. city, nature, coffee"
                    className="input-field flex-1 text-sm py-2"
                />
                <button
                    onClick={search}
                    disabled={loading || !q.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: "#0d9488" }}
                >
                    {loading ? "Searching…" : "Search"}
                </button>
            </div>

            {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}

            {clips.length > 0 && (
                <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1">
                    {clips.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => onSelect(c)}
                            title={`by ${c.author} · ${c.duration}s`}
                            className="relative rounded-lg overflow-hidden group"
                            style={{ aspectRatio: "9 / 16", background: "#0d0d18" }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={c.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity group-hover:opacity-75" />
                            <span className="absolute bottom-1 right-1 text-[10px] px-1 rounded text-white" style={{ background: "rgba(0,0,0,0.7)" }}>{c.duration}s</span>
                        </button>
                    ))}
                </div>
            )}

            {searched && !loading && clips.length === 0 && !error && (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No results — try a different search.</p>
            )}
            <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Stock clips provided by Pexels.</p>
        </div>
    );
}
