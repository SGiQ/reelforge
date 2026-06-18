import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for the gated /tts/preview endpoint.
// Injects the X-API-Key server-side and streams the audio back to the browser.
const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
    const body = await req.text();

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.REELFORGE_API_KEY) headers["X-API-Key"] = process.env.REELFORGE_API_KEY;

    try {
        const res = await fetch(`${API_BASE}/tts/preview`, { method: "POST", headers, body });
        if (!res.ok) {
            const text = await res.text();
            return new NextResponse(text, { status: res.status });
        }
        const buf = await res.arrayBuffer();
        return new NextResponse(buf, {
            status: 200,
            headers: { "Content-Type": res.headers.get("content-type") || "audio/mpeg" },
        });
    } catch (e: any) {
        return NextResponse.json({ detail: `TTS proxy failed: ${e.message || "unknown error"}` }, { status: 502 });
    }
}
