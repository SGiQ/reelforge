import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;
    console.log("Upload API Received Body:", JSON.stringify(body, null, 2));

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                return {
                    allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'],
                    addRandomSuffix: true,
                    tokenPayload: JSON.stringify({
                        // optional payload
                    }),
                };
            },
            // NOTE: no onUploadCompleted. Defining it makes the SDK embed a
            // server-to-server completion callback in the client token, and the
            // browser's upload() promise won't resolve until that callback
            // returns 200 — a delayed/failed callback leaves the UI stuck on
            // "Saving…" forever. We don't need the hook (it only logged), so
            // omit it and let uploads finalize on the PUT alone.
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error("Vercel Blob failed:", error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 },
        );
    }
}
