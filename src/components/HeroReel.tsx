"use client";
import { useEffect, useState } from "react";
import { AudioLines } from "lucide-react";

/* Landing hero reel: fetches the latest shared community reel (public endpoint)
   and autoplays it inside the film frame. Falls back to a styled caption slide
   if none is shared yet or the fetch fails. Rendered inside .cine so the mono/
   disp/scan classes apply. */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const LIME = "#c6f135";

export default function HeroReel({ fallbackCap, fallbackBrand }: { fallbackCap: string; fallbackBrand: string }) {
    const [url, setUrl] = useState<string | null>(null);
    const [brand, setBrand] = useState<string>(fallbackBrand);

    useEffect(() => {
        let alive = true;
        fetch(`${API_BASE}/community/featured`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!alive || !d?.output_url) return;
                setUrl(d.output_url);
                if (d.brand_name) setBrand(d.brand_name);
            })
            .catch(() => { /* keep fallback */ });
        return () => { alive = false; };
    }, []);

    return (
        <div className="relative w-full aspect-[9/16] overflow-hidden" style={{ background: "linear-gradient(160deg,#161b2e,#0a0a0f)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="scan" />
            {url ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={url} autoPlay muted loop playsInline preload="metadata"
                    className="absolute inset-0 w-full h-full object-cover" style={{ maxWidth: "100%", maxHeight: "100%" }} />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <p className="disp font-bold" style={{ color: "#e9edff", fontSize: 24, lineHeight: 1.15, textShadow: "0 2px 14px rgba(0,0,0,0.45)" }}>{fallbackCap}</p>
                    <p className="mono mt-3 text-[13px]" style={{ color: "#8ab4ff", letterSpacing: "0.12em" }}>{fallbackBrand.toUpperCase()}</p>
                </div>
            )}
            {/* mono badge */}
            <div className="absolute top-3 left-3">
                <span className="mono px-2 py-1 text-[13px]" style={{ background: "rgba(10,10,15,0.8)", color: LIME, border: "1px solid rgba(198,241,53,0.25)" }}>0:07 · 1080×1920</span>
            </div>
            {/* timeline */}
            <div className="absolute bottom-0 left-0 w-full p-3" style={{ background: "linear-gradient(to top,#0a0a0f,transparent)" }}>
                <div className="flex justify-between items-end mb-2">
                    <span className="mono text-[13px] truncate" style={{ color: "#c5c9ae", maxWidth: "70%" }}>{url ? brand.toUpperCase() : "SCENE 01 / 03"}</span>
                    <AudioLines className="w-3.5 h-3.5 shrink-0" style={{ color: LIME }} />
                </div>
                <div className="relative w-full" style={{ height: 2, background: "rgba(255,255,255,0.14)" }}>
                    <div className="absolute top-0 left-0 h-full" style={{ width: "40%", background: LIME }} />
                    <div className="absolute" style={{ top: -3, left: "40%", width: 8, height: 8, background: LIME, boxShadow: `0 0 10px ${LIME}` }} />
                </div>
            </div>
        </div>
    );
}
