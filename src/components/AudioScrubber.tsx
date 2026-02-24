"use client";
import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause } from "lucide-react";

interface AudioScrubberProps {
    src: string;
    onTimeChange: (time: number) => void;
    initialTime?: number;
}

export default function AudioScrubber({ src, onTimeChange, initialTime = 0 }: AudioScrubberProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(initialTime);
    const [duration, setDuration] = useState(0);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize WaveSurfer
        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: "rgba(167, 139, 250, 0.4)", // Muted purple
            progressColor: "#a78bfa", // Active purple
            cursorColor: "#fff",
            barWidth: 3,
            barGap: 3,
            barRadius: 3,
            height: 60,
            normalize: true,
            minPxPerSec: 50, // Zoom level
            hideScrollbar: false,
        });

        // Load the audio file
        ws.load(src);
        wavesurferRef.current = ws;

        // Event listeners
        ws.on("ready", () => {
            setIsReady(true);
            setDuration(ws.getDuration());

            // Set initial position if provided
            if (initialTime > 0) {
                ws.setTime(initialTime);
            }
        });

        ws.on("timeupdate", (time) => setCurrentTime(time));
        ws.on("interaction", () => {
            const time = ws.getCurrentTime();
            setCurrentTime(time);
            onTimeChange(Number(time.toFixed(1))); // Bubble up the time to the parent
        });

        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));
        ws.on("finish", () => setIsPlaying(false));

        return () => {
            ws.destroy();
        };
    }, [src]);

    const handlePlayPause = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    const formatTime = (secs: number) => {
        const minutes = Math.floor(secs / 60);
        const seconds = Math.floor(secs % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    return (
        <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePlayPause}
                        disabled={!isReady}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30 transition-colors disabled:opacity-50"
                        title={isPlaying ? "Pause preview" : "Play preview"}
                    >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <div className="flex flex-col">
                        <span className="font-semibold text-white">Start time selected</span>
                        <span className="text-slate-400 text-xs">
                            {isReady ? `Starting at ${formatTime(currentTime)}` : "Loading audio..."}
                        </span>
                    </div>
                </div>
                {isReady && (
                    <span className="text-slate-400 font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                )}
            </div>

            {/* Waveform Container */}
            <div
                className="w-full rounded-xl overflow-hidden relative cursor-pointer group"
                style={{
                    // Gradient background to mimic the user's screenshot
                    background: "linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
                    padding: "16px 0",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)"
                }}
            >
                {/* The WaveSurfer div */}
                <div ref={containerRef} className="w-full px-2" />

                {/* Selection Window Overlay (visual effect mimicking Reels/TikTok) */}
                <div className="absolute top-0 bottom-0 left-0 w-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute top-0 bottom-0 bg-white/10 w-32 border-x-2 border-white/50 backdrop-blur-sm shadow-xl transition-all duration-100 ease-linear"
                        style={{
                            left: isReady ? `${Math.min((currentTime / duration) * 100, 100)}%` : '0%',
                            transform: 'translateX(-50%)'
                        }}>
                    </div>
                </div>
            </div>
            <p className="text-xs text-slate-500 text-center w-full">
                Drag on the waveform or click to select where the background music should begin.
            </p>
        </div>
    );
}
