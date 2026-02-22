"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import ThemeCard, { THEMES } from "@/components/ThemeCard";
import UploadZone from "@/components/UploadZone";

// 6 Female and 6 Male voices from ElevenLabs
const AI_VOICES = [
    // Female Voices
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (Mature & Reassuring)" },
    { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura (Quirky Enthusiast)" },
    { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice (Clear Educator)" },
    { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda (Professional)" },
    { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica (Playful & Warm)" },
    { id: "hpp4J3VqNfWAUOO0d1Us", name: "Bella (Bright & Professional)" },
    // Male Voices
    { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger (Laid-Back & Casual)" },
    { id: "JBFqnCBsd6RMkjVDRZzb", name: "George (Warm Storyteller)" },
    { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam (Social Media Creator)" },
    { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie (Deep & Energetic)" },
    { id: "iP95p4xoKVk53GoZ742B", name: "Chris (Charming & Down-to-Earth)" },
    { id: "cjVigY5qzO86Huf0OWal", name: "Eric (Smooth & Trustworthy)" },
];

export default function ThemeSelectorPage() {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [musicFile, setMusicFile] = useState<File | null>(null);
    const [musicPreview, setMusicPreview] = useState<string | null>(null);
    const [aiVoice, setAiVoice] = useState<string>("");

    useEffect(() => {
        const savedTheme = localStorage.getItem("reelforge_theme");
        if (savedTheme) setSelectedId(savedTheme);

        const savedAudio = localStorage.getItem("reelforge_audio");
        if (savedAudio) {
            const parsed = JSON.parse(savedAudio);
            setMusicPreview(parsed.musicPreview);
            if (parsed.aiVoice) setAiVoice(parsed.aiVoice);
        }
    }, []);

    const handleContinue = () => {
        if (!selectedId) return;
        localStorage.setItem("reelforge_theme", selectedId);
        localStorage.setItem("reelforge_audio", JSON.stringify({ musicPreview, aiVoice: aiVoice || null }));
        router.push("/preview");
    };

    const handleMusicUpload = (file: File) => {
        setMusicFile(file);
        setMusicPreview(URL.createObjectURL(file));
    };

    return (
        <div className="page-container">
            <Navbar currentStep={2} />
            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <p className="step-indicator mb-3">
                        <span>Step 3 of 5</span>
                        <span className="text-xs mx-1">·</span>
                        <span style={{ color: "#a78bfa" }}>Theme Selector</span>
                    </p>
                    <h1 className="section-title">Choose your color theme</h1>
                    <p className="section-subtitle">
                        Your theme sets the mood of every slide. Pick one that matches your brand energy.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                    {THEMES.map((theme) => (
                        <ThemeCard
                            key={theme.id}
                            theme={theme}
                            selected={selectedId === theme.id}
                            onSelect={(id) => { setSelectedId(id); localStorage.setItem("reelforge_theme", id); }}
                        />
                    ))}
                </div>

                <div className="mb-10">
                    <h2 className="text-xl font-bold mb-2">Audio Configuration</h2>
                    <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
                        Upload your own background music or voiceover track to play alongside the text animation.
                    </p>

                    <div className="space-y-6">
                        <div className="glass-card rounded-2xl p-6">
                            <UploadZone
                                label="Background Music"
                                hint="MP3 or WAV · Plays at 20% volume"
                                accept="audio/*"
                                onUpload={handleMusicUpload}
                                preview={musicPreview ? "Audio File Attached" : null}
                                onClear={() => { setMusicFile(null); setMusicPreview(null); }}
                            />
                        </div>

                        <div className="glass-card rounded-2xl p-6">
                            <label className="block text-sm font-medium mb-1.5" style={{ color: "#a78bfa" }}>AI Voiceover</label>
                            <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>
                                Select a professional AI voice to narrate your script. Each slide will be perfectly synced to the audio length.
                            </p>
                            <div className="relative">
                                <select
                                    className="input-field w-full appearance-none cursor-pointer"
                                    value={aiVoice}
                                    onChange={(e) => setAiVoice(e.target.value)}
                                >
                                    <option value="">No Voiceover (Music Only)</option>
                                    {AI_VOICES.map(voice => (
                                        <option key={voice.id} value={voice.id}>{voice.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    ▼
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleContinue}
                    disabled={!selectedId}
                    className="btn-primary w-full justify-center py-4 text-base"
                    style={{ opacity: !selectedId ? 0.5 : 1 }}
                >
                    Preview My Reel <ArrowRight className="w-5 h-5" />
                </button>
            </main>
        </div>
    );
}
