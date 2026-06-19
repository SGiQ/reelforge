import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for Pexels video search. Keeps PEXELS_API_KEY server-only.
// Returns a simplified clip list the builder can render and select from.
const PEXELS_URL = "https://api.pexels.com/videos/search";

export async function GET(req: NextRequest) {
    const key = process.env.PEXELS_API_KEY;
    if (!key) {
        return NextResponse.json({ error: "Stock search is not configured (missing PEXELS_API_KEY)." }, { status: 503 });
    }

    const q = (req.nextUrl.searchParams.get("query") || "").trim();
    if (!q) return NextResponse.json({ clips: [] });

    const orientation = req.nextUrl.searchParams.get("orientation") || "portrait";
    const perPage = req.nextUrl.searchParams.get("per_page") || "12";
    const url = `${PEXELS_URL}?query=${encodeURIComponent(q)}&orientation=${orientation}&per_page=${perPage}&size=medium`;

    try {
        const res = await fetch(url, { headers: { Authorization: key } });
        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json({ error: `Pexels error ${res.status}: ${text.slice(0, 200)}` }, { status: 502 });
        }
        const data = await res.json();
        const clips = (data.videos || []).map((v: any) => {
            const mp4 = (v.video_files || []).filter((f: any) => f.file_type === "video/mp4" && f.link);
            mp4.sort((a: any, b: any) => (a.height || 0) - (b.height || 0));
            // Prefer a file at least 1080px tall but avoid huge 4K downloads.
            const chosen = mp4.find((f: any) => (f.height || 0) >= 1080) || mp4[mp4.length - 1] || (v.video_files || [])[0];
            return {
                id: v.id,
                thumbnail: v.image,
                duration: v.duration,
                author: v.user?.name || "Pexels",
                width: chosen?.width || null,
                height: chosen?.height || null,
                downloadUrl: chosen?.link || null,
            };
        }).filter((c: any) => c.downloadUrl);

        return NextResponse.json({ clips });
    } catch (e: any) {
        return NextResponse.json({ error: `Stock search failed: ${e.message || "unknown error"}` }, { status: 502 });
    }
}
