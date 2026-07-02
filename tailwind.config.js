/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Cinematic Studio — single lime accent. Brand names kept so
                // existing `brand-*` utility classes flip to lime automatically.
                brand: {
                    purple: "#c6f135",
                    "purple-light": "#d4f96a",
                    "purple-dark": "#acd60e",
                    teal: "#c6f135",
                    "teal-light": "#d4f96a",
                    "teal-dark": "#acd60e",
                },
                accent: {
                    DEFAULT: "#c6f135",
                    dim: "#acd60e",
                    ink: "#0a0a0f",
                },
                surface: {
                    DEFAULT: "#0a0a0f",
                    card: "#101018",
                    elevated: "#16161f",
                    border: "#26262e",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
                mono: ["Geist Mono", "Space Mono", "ui-monospace", "monospace"],
            },
            // Larger type scale app-wide (~1.2–1.25× the Tailwind defaults). Bumps
            // every text-xs/sm/base/lg/... without touching spacing, so layouts
            // stay put. [size, lineHeight] tuples keep sensible leading.
            fontSize: {
                xs: ["0.875rem", { lineHeight: "1.25rem" }],   // 14 (was 12)
                sm: ["1rem", { lineHeight: "1.5rem" }],        // 16 (was 14)
                base: ["1.125rem", { lineHeight: "1.7rem" }],  // 18 (was 16)
                lg: ["1.3125rem", { lineHeight: "1.8rem" }],   // 21 (was 18)
                xl: ["1.5rem", { lineHeight: "1.9rem" }],      // 24 (was 20)
                "2xl": ["1.75rem", { lineHeight: "2.1rem" }],  // 28 (was 24)
                "3xl": ["2.25rem", { lineHeight: "2.5rem" }],  // 36 (was 30)
                "4xl": ["2.75rem", { lineHeight: "1.1" }],     // 44 (was 36)
                "5xl": ["3.5rem", { lineHeight: "1" }],        // 56 (was 48)
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-brand": "linear-gradient(135deg, #c6f135 0%, #acd60e 100%)",
                "gradient-dark": "linear-gradient(180deg, #0a0a0f 0%, #101018 100%)",
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-in-out",
                "slide-up": "slideUp 0.6s ease-out",
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "spin-slow": "spin 8s linear infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(24px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
};
