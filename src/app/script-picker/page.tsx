"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import ScriptCard from "@/components/ScriptCard";

const DEFAULT_SCRIPTS = [
    {
        id: "script_1",
        title: "Someone Should Check",
        slides: [
            "That look on her face.",
            "The one she gets when she hasn't heard from you in days.",
            "You know the one.",
            "Someone should be checking on her.",
            "Now someone is.",
        ],
    },
    {
        id: "script_2",
        title: "You Can't Be Everywhere",
        slides: [
            "You have a job. Kids. A life.",
            "But this face follows you. Into meetings. Into sleep.",
            "You can't be everywhere.",
            "We can.",
            "Check WellCare calls daily. Listens. Reports back.",
        ],
    },
    {
        id: "script_3",
        title: "Break the Worry Cycle",
        slides: [
            "You know this feeling.",
            "Checking your phone. Wondering if she's okay.",
            "Every. Single. Day.",
            "What if you didn't have to worry anymore?",
            "We check in. So you can breathe.",
        ],
    },
];

export default function ScriptPickerPage() {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("reelforge_script");
        if (saved) setSelectedId(JSON.parse(saved).id);
    }, []);

    const handleContinue = () => {
        const script = DEFAULT_SCRIPTS.find((s) => s.id === selectedId);
        if (!script) return;
        localStorage.setItem("reelforge_script", JSON.stringify(script));
        router.push("/theme-selector");
    };

    return (
        <div className="page-container">
            <Navbar currentStep={1} />
            <main className="max-w-3xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-10">
                    <p className="step-indicator mb-3">
                        <span>Step 2 of 5</span>
                        <span className="text-xs mx-1">·</span>
                        <span style={{ color: "#a78bfa" }}>Script Picker</span>
                    </p>
                    <h1 className="section-title">Choose your script</h1>
                    <p className="section-subtitle">
                        Each script is crafted to create an emotional connection. Pick the one that fits your brand story.
                    </p>
                </div>

                {/* Scripts */}
                <div className="space-y-4 mb-10">
                    {DEFAULT_SCRIPTS.map((script) => (
                        <ScriptCard
                            key={script.id}
                            id={script.id}
                            title={script.title}
                            slides={script.slides}
                            selected={selectedId === script.id}
                            onSelect={setSelectedId}
                        />
                    ))}
                </div>

                {/* Tip */}
                {selectedId && (
                    <div className="rounded-xl px-4 py-3 flex gap-3 mb-8" style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.2)" }}>
                        <span>✨</span>
                        <p className="text-sm" style={{ color: "#94a3b8" }}>
                            <strong style={{ color: "#2dd4bf" }}>
                                &quot;{DEFAULT_SCRIPTS.find((s) => s.id === selectedId)?.title}&quot;
                            </strong>{" "}
                            selected — {DEFAULT_SCRIPTS.find((s) => s.id === selectedId)?.slides.length} slides will be animated.
                        </p>
                    </div>
                )}

                <button
                    onClick={handleContinue}
                    disabled={!selectedId}
                    className="btn-primary w-full justify-center py-4 text-base"
                    style={{ opacity: !selectedId ? 0.5 : 1 }}
                >
                    Continue to Theme <ArrowRight className="w-5 h-5" />
                </button>
            </main>
        </div>
    );
}
