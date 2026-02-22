import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import os from "os";

/**
 * GET /api/render-frame-data/[jobId]
 * Serves the pre-written render job JSON that the /render-slide page reads.
 * Data is written by the Python backend to /tmp/reelforge_frames/{jobId}.json before
 * Playwright takes screenshots.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: { jobId: string } }
) {
    try {
        const filePath = path.join(os.tmpdir(), "reelforge_frames", `${params.jobId}.json`);
        const content = readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);
        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "no-store",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch {
        return NextResponse.json({ error: "Frame data not found" }, { status: 404 });
    }
}
