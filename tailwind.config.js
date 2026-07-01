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
