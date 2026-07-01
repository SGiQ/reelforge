"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

/**
 * Light/dark toggle. `floating` renders a self-contained pill for pages
 * without a navbar (login, reset); otherwise it's a bare icon button that
 * inherits the surrounding chrome.
 */
export default function ThemeToggle({ floating = false }: { floating?: boolean }) {
    const { theme, toggle } = useTheme();
    const isDark = theme === "dark";

    const btn = (
        <button
            onClick={toggle}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 cursor-pointer"
            style={{
                background: "rgb(var(--rgb-surface-border) / 0.4)",
                color: "var(--color-text-secondary)",
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = "var(--color-text-primary)"; e.currentTarget.style.background = "rgba(124,58,237,0.15)"; }}
            onMouseOut={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; e.currentTarget.style.background = "rgb(var(--rgb-surface-border) / 0.4)"; }}
        >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
    );

    if (!floating) return btn;

    return (
        <div className="fixed top-5 right-5 z-50">{btn}</div>
    );
}
