"use client";
import { useEffect, useState } from "react";

export type UITheme = "dark" | "light";
const THEME_KEY = "reelforge_ui_theme";

/** Read the persisted UI theme. Dark is the default. */
export function getTheme(): UITheme {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

/** Apply a theme to <html> and persist it. */
export function applyTheme(theme: UITheme) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
}

/**
 * Theme hook: returns the current theme and a toggle. Reads the class the
 * no-flash script already set on <html> so first paint and React agree.
 */
export function useTheme(): { theme: UITheme; toggle: () => void; setTheme: (t: UITheme) => void } {
    const [theme, setThemeState] = useState<UITheme>("dark");

    useEffect(() => {
        setThemeState(document.documentElement.classList.contains("light") ? "light" : "dark");
    }, []);

    const setTheme = (t: UITheme) => {
        applyTheme(t);
        setThemeState(t);
    };

    return { theme, toggle: () => setTheme(theme === "dark" ? "light" : "dark"), setTheme };
}
