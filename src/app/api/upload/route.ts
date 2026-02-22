import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
        return NextResponse.json(
            { error: 'Filename is required' },
            { status: 400 },
        );
    }

    // The request.body is a readable stream of the file content
    if (!request.body) {
        return NextResponse.json(
            { error: 'Request body is required' },
            { status: 400 },
        );
    }

    try {
        const blob = await put(filename, request.body, {
            access: 'public',
        });

        return NextResponse.json(blob);
    } catch (error) {
        console.error("Vercel Blob failed:", error);
        return NextResponse.json(
            { error: 'Failed to upload to blob storage' },
            { status: 500 },
        );
    }
}
