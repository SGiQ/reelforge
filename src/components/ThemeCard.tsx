"use client";
import { Check } from "lucide-react";

export interface Theme {
    id: string;
    label: string;
    description: string;
    overlayColor: string;
    textColor: string;
    bgGradient: string;
    accentColor: string;
}

export const THEMES: Theme[] = [
    {
        id: "dark",
        label: "Dark Professional",
        description: "Deep navy with bold white text",
        overlayColor: "#1a1a2e",
        textColor: "#ffffff",
        bgGradient: "linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)",
        accentColor: "#a78bfa",
    },
    {
        id: "light",
        label: "Clean Light",
        description: "Crisp white with charcoal text",
        overlayColor: "#f8f8f8",
        textColor: "#1a1a2e",
        bgGradient: "linear-gradient(135deg, #f8f8f8 0%, #e2e8f0 100%)",
        accentColor: "#7c3aed",
    },
    {
        id: "sky-blue",
        label: "Sky Blue",
        description: "Vivid azure with white text",
        overlayColor: "#0ea5e9",
        textColor: "#ffffff",
        bgGradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
        accentColor: "#7dd3fc",
    },
    {
        id: "warm-gold",
        label: "Warm Gold",
        description: "Rich amber with dark text",
        overlayColor: "#d97706",
        textColor: "#1c1917",
        bgGradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
        accentColor: "#fcd34d",
    },
    {
        id: "crimson-red",
        label: "Crimson Red",
        description: "Deep ruby with bold white text",
        overlayColor: "#9f1239",
        textColor: "#ffffff",
        bgGradient: "linear-gradient(135deg, #9f1239 0%, #4c0519 100%)",
        accentColor: "#f43f5e",
    },
    {
        id: "forest-green",
        label: "Forest Green",
        description: "Dark emerald with clean white text",
        overlayColor: "#166534",
        textColor: "#ffffff",
        bgGradient: "linear-gradient(135deg, #166534 0%, #14532d 100%)",
        accentColor: "#34d399",
    },
    {
        id: "amethyst",
        label: "Amethyst",
        description: "Deep violet with bright lavender accent",
        overlayColor: "#4c1d95",
        textColor: "#ffffff",
        bgGradient: "linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)",
        accentColor: "#c084fc",
    },
    {
        id: "monochrome",
        label: "Monochrome",
        description: "Pure black with sleek gray scale",
        overlayColor: "#000000",
        textColor: "#ffffff",
        bgGradient: "linear-gradient(135deg, #171717 0%, #000000 100%)",
        accentColor: "#a3a3a3",
    },
];

interface ThemeCardProps {
    theme: Theme;
    selected: boolean;
    onSelect: (id: string) => void;
}

export default function ThemeCard({ theme, selected, onSelect }: ThemeCardProps) {
    return (
        <button
            onClick={() => onSelect(theme.id)}
            className="group relative rounded-2xl overflow-hidden transition-all duration-300"
            style={{
                border: `2px solid ${selected ? theme.accentColor : "rgba(45,45,74,0.6)"}`,
                boxShadow: selected ? `0 0 30px ${theme.accentColor}40` : "none",
                transform: selected ? "scale(1.02)" : "scale(1)",
            }}
        >
            {/* Preview area */}
            <div
                className="h-40 flex items-center justify-center relative overflow-hidden"
                style={{ background: theme.bgGradient }}
            >
                {/* Simulated text slides */}
                <div className="text-center px-4">
                    <p
                        className="text-sm font-bold leading-snug text-center"
                        style={{ color: theme.textColor, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                    >
                        "Someone should be checking on her."
                    </p>
                    <p
                        className="text-xs mt-2 font-medium"
                        style={{ color: theme.accentColor }}
                    >
                        BrandName
                    </p>
                </div>

                {/* Frame overlay */}
                <div
                    className="absolute inset-0"
                    style={{ background: "rgba(0,0,0,0.15)" }}
                />

                {/* 9:16 aspect ratio indicator */}
                <div
                    className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{ background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.6)" }}
                >
                    9:16
                </div>
            </div>

            {/* Info area */}
            <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ background: selected ? "rgba(124,58,237,0.1)" : "rgba(26,26,46,0.95)" }}
            >
                <div>
                    <p className="text-sm font-semibold" style={{ color: "#f8fafc" }}>{theme.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{theme.description}</p>
                </div>
                {selected && (
                    <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: theme.accentColor }}
                    >
                        <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                )}
            </div>
        </button>
    );
}
