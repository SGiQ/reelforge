"use client";
import { CheckCircle } from "lucide-react";

interface ScriptCardProps {
    id: string;
    title: string;
    slides: string[];
    selected: boolean;
    onSelect: (id: string) => void;
}

export default function ScriptCard({ id, title, slides, selected, onSelect }: ScriptCardProps) {
    return (
        <button
            onClick={() => onSelect(id)}
            className="w-full text-left rounded-2xl p-5 transition-all duration-300 group"
            style={{
                background: selected ? "rgba(124,58,237,0.12)" : "rgba(26,26,46,0.8)",
                border: `1.5px solid ${selected ? "rgba(124,58,237,0.6)" : "rgba(45,45,74,0.6)"}`,
                boxShadow: selected ? "0 0 30px rgba(124,58,237,0.15)" : "none",
            }}
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: selected ? "#a78bfa" : "#64748b" }}>
                        Script
                    </p>
                    <h3 className="text-base font-bold" style={{ color: "#f8fafc" }}>{title}</h3>
                </div>
                {selected && (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#a78bfa" }} />
                )}
            </div>

            {/* Slide preview */}
            <div className="space-y-2">
                {slides.map((slide, i) => (
                    <div
                        key={i}
                        className="flex items-start gap-2.5 rounded-lg px-3 py-2"
                        style={{ background: "rgba(15,15,26,0.5)" }}
                    >
                        <span
                            className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                            style={{
                                background: selected ? "rgba(124,58,237,0.3)" : "rgba(45,45,74,0.6)",
                                color: selected ? "#a78bfa" : "#64748b",
                                fontSize: "9px",
                            }}
                        >
                            {i + 1}
                        </span>
                        <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                            {slide}
                        </p>
                    </div>
                ))}
            </div>
        </button>
    );
}
