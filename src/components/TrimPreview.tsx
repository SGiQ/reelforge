"use client";
import { useEffect, useRef, CSSProperties } from "react";

/**
 * Previews ONLY the trimmed section of a clip — autoplays muted and loops
 * within [start, end], so what you see is exactly what ends up in the reel.
 */
export default function TrimPreview({
    src,
    start,
    end,
    className,
    style,
}: {
    src: string;
    start: number;
    end: number;
    className?: string;
    style?: CSSProperties;
}) {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const v = ref.current;
        if (!v) return;
        const s = Math.max(0, start || 0);

        const seekToStart = () => { try { v.currentTime = s; } catch { } };
        const onTime = () => {
            const e = end && end > s ? end : (v.duration || 0);
            if (e && v.currentTime >= e) seekToStart();
            else if (v.currentTime < s - 0.1) seekToStart();
        };

        v.addEventListener("loadedmetadata", seekToStart);
        v.addEventListener("timeupdate", onTime);
        if (v.readyState >= 1) seekToStart();
        v.play().catch(() => { });

        return () => {
            v.removeEventListener("loadedmetadata", seekToStart);
            v.removeEventListener("timeupdate", onTime);
        };
    }, [src, start, end]);

    return (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video ref={ref} src={src} muted playsInline autoPlay className={className} style={style} />
    );
}
