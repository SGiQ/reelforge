"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import ThemeCard, { THEMES } from "@/components/ThemeCard";

export default function ThemeSelectorPage() {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("reelforge_theme");
        if (saved) setSelectedId(saved);
    }, []);

    const handleContinue = () => {
        if (!selectedId) return;
        localStorage.setItem("reelforge_theme", selectedId);
        router.push("/preview");
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
