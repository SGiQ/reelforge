import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
    title: "ReelForge — AI Reel Builder for Brands",
    description:
        "Create stunning short-form video reels for your brand in minutes. Upload assets, pick a script, choose a theme, and download your MP4.",
    keywords: "reel builder, AI video, brand reel, short form video, MP4 generator",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@700;900&family=Oswald:wght@700&family=Bebas+Neue&family=Cinzel:wght@700&family=Space+Mono:wght@700&family=Playfair+Display:wght@700;900&family=Outfit:wght@700;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased" style={{ background: "#0f0f1a", color: "#f8fafc" }}>
                {children}
            </body>
        </html>
    );
}
