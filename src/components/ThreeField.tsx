"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* Real WebGL 3D scene: an additive-blended particle cloud with a wireframe
   core, fog depth, slow rotation and mouse-driven camera parallax.
   Safeguards for mobile: capped DPR, reduced particle count on phones, pauses
   when the tab is hidden, honors prefers-reduced-motion, and fails gracefully
   (no WebGL / context loss → renders nothing, the CSS orbs behind remain). */

function glowTexture() {
    const s = 64;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.75)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
}

export default function ThreeField() {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
        } catch {
            return; // no WebGL — leave the CSS background as-is
        }
        const W = () => mount.clientWidth || window.innerWidth;
        const H = () => mount.clientHeight || window.innerHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setSize(W(), H());
        renderer.domElement.style.cssText = "position:fixed;inset:0;width:100%;height:100%;display:block;";
        mount.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x05060a, 0.045);
        const camera = new THREE.PerspectiveCamera(62, W() / H(), 0.1, 120);
        camera.position.set(0, 0, 24);

        const isMobile = W() < 640;
        const COUNT = reduce ? 700 : isMobile ? 1500 : 4400;
        const R = 30;
        const positions = new Float32Array(COUNT * 3);
        const colors = new Float32Array(COUNT * 3);
        const palette = [new THREE.Color("#4fc3f7"), new THREE.Color("#a78bfa"), new THREE.Color("#c6f135"), new THREE.Color("#7cc4ff")];
        for (let i = 0; i < COUNT; i++) {
            const r = R * Math.cbrt(Math.random());
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.62;
            positions[i * 3 + 2] = r * Math.cos(phi);
            const col = palette[(Math.random() * palette.length) | 0];
            colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        const sprite = glowTexture();
        const mat = new THREE.PointsMaterial({
            size: 0.55, map: sprite, vertexColors: true, transparent: true,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, opacity: 0.92,
        });
        const points = new THREE.Points(geo, mat);
        scene.add(points);

        const wire = new THREE.LineSegments(
            new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(10, 1)),
            new THREE.LineBasicMaterial({ color: 0x3350a0, transparent: true, opacity: 0.22 })
        );
        scene.add(wire);

        const target = { x: 0, y: 0 };
        const cur = { x: 0, y: 0 };
        const onMove = (e: MouseEvent) => { target.x = e.clientX / window.innerWidth - 0.5; target.y = e.clientY / window.innerHeight - 0.5; };
        const onResize = () => { camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()); };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("resize", onResize);

        const clock = new THREE.Clock();
        let raf = 0;
        const frame = () => {
            const t = clock.getElapsedTime();
            points.rotation.y = t * 0.03;
            points.rotation.x = Math.sin(t * 0.1) * 0.06;
            wire.rotation.y = -t * 0.05;
            wire.rotation.x = t * 0.028;
            cur.x += (target.x - cur.x) * 0.045;
            cur.y += (target.y - cur.y) * 0.045;
            camera.position.x = cur.x * 7;
            camera.position.y = -cur.y * 5;
            camera.lookAt(0, 0, 0);
            renderer.render(scene, camera);
            raf = requestAnimationFrame(frame);
        };
        if (reduce) renderer.render(scene, camera); else frame();

        const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden && !reduce) raf = requestAnimationFrame(frame); };
        document.addEventListener("visibilitychange", onVis);
        const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); };
        renderer.domElement.addEventListener("webglcontextlost", onLost);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("resize", onResize);
            document.removeEventListener("visibilitychange", onVis);
            renderer.domElement.removeEventListener("webglcontextlost", onLost);
            geo.dispose(); mat.dispose(); sprite.dispose();
            wire.geometry.dispose();
            (wire.material as THREE.Material).dispose();
            renderer.dispose();
            renderer.domElement.remove();
        };
    }, []);

    return <div ref={mountRef} aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}
