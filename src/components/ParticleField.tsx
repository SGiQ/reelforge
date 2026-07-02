"use client";
import { useEffect, useRef } from "react";

/* Lightweight canvas-2D constellation field. Mouse-reactive, capped particle
   count (reduced on small screens), pauses when the tab is hidden, and respects
   prefers-reduced-motion. No WebGL — safe on mobile Safari. */

type P = { x: number; y: number; vx: number; vy: number; r: number; c: string };

const COLORS = ["#4fc3f7", "#a78bfa", "#c6f135", "#7cc4ff"];

export default function ParticleField() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let w = 0, h = 0, raf = 0;
        let particles: P[] = [];
        const mouse = { x: -9999, y: -9999 };
        const LINK = 140 * 140;   // px² distance to draw a link
        const MLINK = 150 * 150;  // px² distance for mouse links

        const build = () => {
            w = canvas.clientWidth; h = canvas.clientHeight;
            canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const density = w < 640 ? 22000 : 15000; // fewer on phones
            let count = Math.floor((w * h) / density);
            count = Math.min(reduce ? 34 : 110, Math.max(24, count));
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
                r: Math.random() * 1.7 + 0.6, c: COLORS[(Math.random() * COLORS.length) | 0],
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            const n = particles.length;
            for (let i = 0; i < n; i++) {
                const p = particles[i];
                if (!reduce) {
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
                    if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
                }
                for (let j = i + 1; j < n; j++) {
                    const q = particles[j];
                    const dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
                    if (d2 < LINK) {
                        ctx.strokeStyle = `rgba(120,160,255,${(1 - d2 / LINK) * 0.16})`;
                        ctx.lineWidth = 0.6;
                        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
                    }
                }
                const mdx = p.x - mouse.x, mdy = p.y - mouse.y, md2 = mdx * mdx + mdy * mdy;
                if (md2 < MLINK) {
                    ctx.strokeStyle = `rgba(198,241,53,${(1 - md2 / MLINK) * 0.35})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
                }
                ctx.fillStyle = p.c; ctx.globalAlpha = 0.9;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            }
            raf = requestAnimationFrame(draw);
        };

        const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
        const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
        const onResize = () => build();
        const onVis = () => {
            cancelAnimationFrame(raf);
            if (!document.hidden) raf = requestAnimationFrame(draw);
        };

        build(); draw();
        window.addEventListener("resize", onResize);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseout", onLeave);
        document.addEventListener("visibilitychange", onVis);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseout", onLeave);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, []);

    return <canvas ref={ref} aria-hidden className="fixed inset-0 w-full h-full" style={{ zIndex: 0, pointerEvents: "none" }} />;
}
