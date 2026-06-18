import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for the gated /render/create endpoint.
// Injects the X-API-Key from a SERVER-ONLY env var so the shared secret is
// never shipped to the browser. Set REELFORGE_API_KEY in the Vercel project
// (same value as the Railway backend).
const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
    const body = await req.text(); // pass the JSON through untouched

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.REELFORGE_API_KEY) headers["X-API-Key"] = process.env.REELFORGE_API_KEY;
    const auth = req.headers.get("authorization");
    if (auth) headers["Authorization"] = auth;

    try {
        const res = await fetch(`${API_BASE}/render/create`, { method: "POST", headers, body });
        const text = await res.text();
        return new NextResponse(text, {
            status: res.status,
            headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
        });
    } catch (e: any) {
        return NextResponse.json({ detail: `Render proxy failed: ${e.message || "unknown error"}` }, { status: 502 });
    }
}
