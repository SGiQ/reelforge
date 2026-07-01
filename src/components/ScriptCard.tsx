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
                background: selected ? "rgba(124,58,237,0.12)" : "rgb(var(--rgb-surface-card) / 0.8)",
                border: `1.5px solid ${selected ? "rgba(124,58,237,0.6)" : "rgb(var(--rgb-surface-border) / 0.6)"}`,
                boxShadow: selected ? "0 0 30px rgba(124,58,237,0.15)" : "none",
            }}
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: selected ? "#a78bfa" : "var(--color-text-muted)" }}>
                        Script
                    </p>
                    <h3 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
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
                        style={{ background: "rgb(var(--rgb-surface) / 0.5)" }}
                    >
                        <span
                            className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                            style={{
                                background: selected ? "rgba(124,58,237,0.3)" : "rgb(var(--rgb-surface-border) / 0.6)",
                                color: selected ? "#a78bfa" : "var(--color-text-muted)",
                                fontSize: "9px",
                            }}
                        >
                            {i + 1}
                        </span>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                            {slide}
                        </p>
                    </div>
                ))}
            </div>
        </button>
    );
}
