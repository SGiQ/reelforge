// Shared scene model for reels. A reel is an ordered list of scenes.
// Scenes are stored in localStorage (reelforge_script.slides) and sent to the
// backend as `slides` — kept backward compatible with the old text-only shape.

// Background motion preset applied to still (text/image) scenes during render.
export type SceneAnimation = "none" | "zoom_in" | "zoom_out" | "pan_right" | "pan_left";

// How the caption text animates onto the scene.
export type TextAnimation = "none" | "fade" | "fade_up" | "slide_left" | "slide_right";

// A placed graphic element (icon / emoji / uploaded image) on a still scene.
export type ElementType = "icon" | "emoji" | "image";
export type ElementAnimation = "none" | "pop" | "fade" | "bounce";
export interface SceneElement {
    id: string;
    type: ElementType;
    value: string;          // lucide icon name | emoji char | image URL
    x: number;              // 0..1 normalized center position
    y: number;              // 0..1 normalized center position
    size: number;           // px in the 1080-wide frame
    color?: string;         // icon tint (icon type only)
    animation: ElementAnimation;
}

export function sanitizeElements(raw: any): SceneElement[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter((e) => e && typeof e === "object" && e.value)
        .map((e, i) => ({
            id: typeof e.id === "string" ? e.id : `el_${i}_${e.value}`,
            type: (["icon", "emoji", "image"].includes(e.type) ? e.type : "emoji") as ElementType,
            value: String(e.value),
            x: typeof e.x === "number" ? Math.min(1, Math.max(0, e.x)) : 0.5,
            y: typeof e.y === "number" ? Math.min(1, Math.max(0, e.y)) : 0.5,
            size: typeof e.size === "number" ? Math.max(24, Math.min(600, e.size)) : 140,
            color: typeof e.color === "string" ? e.color : undefined,
            animation: (["none", "pop", "fade", "bounce"].includes(e.animation) ? e.animation : "none") as ElementAnimation,
        }));
}

export interface TextScene {
    kind?: "text";
    text: string;
    fontSize: number;
    textColor: string;
    fontFamily: string;
    // Seconds the scene holds (0/undefined = auto from voiceover or default).
    duration?: number;
    animation?: SceneAnimation;
    textAnimation?: TextAnimation;
    elements?: SceneElement[];
}

export interface VideoScene {
    kind: "video";
    videoUrl: string;
    // Trim window within the source clip, in seconds.
    trimStart: number;
    trimEnd: number;
    // Full length of the source clip in seconds (for bounding the trim UI).
    durationHint?: number;
    // Optional caption rendered over the clip (same styling as text scenes).
    text: string;
    fontSize: number;
    textColor: string;
    fontFamily: string;
}

export interface ImageScene {
    kind: "image";
    imageUrl: string;
    // Optional caption rendered over the image (same styling as text scenes).
    text: string;
    fontSize: number;
    textColor: string;
    fontFamily: string;
    duration?: number;
    animation?: SceneAnimation;
    textAnimation?: TextAnimation;
    elements?: SceneElement[];
}

export type Scene = TextScene | VideoScene | ImageScene;

export const DEFAULT_SCENE_STYLE = {
    fontSize: 88,
    textColor: "#ffffff",
    fontFamily: "DejaVuSans-Bold.ttf",
};

export function isVideoScene(s: any): s is VideoScene {
    return !!s && typeof s === "object" && s.kind === "video" && typeof s.videoUrl === "string";
}

export function isImageScene(s: any): s is ImageScene {
    return !!s && typeof s === "object" && s.kind === "image" && typeof s.imageUrl === "string";
}

// Normalize any legacy shape (plain string, or text object) into a Scene.
export function toScene(s: any): Scene {
    if (typeof s === "string") return { kind: "text", text: s, ...DEFAULT_SCENE_STYLE };
    if (isImageScene(s)) {
        return {
            kind: "image",
            imageUrl: s.imageUrl,
            text: s.text ?? "",
            fontSize: s.fontSize ?? DEFAULT_SCENE_STYLE.fontSize,
            textColor: s.textColor ?? DEFAULT_SCENE_STYLE.textColor,
            fontFamily: s.fontFamily ?? DEFAULT_SCENE_STYLE.fontFamily,
            duration: typeof s.duration === "number" ? s.duration : undefined,
            animation: s.animation || "none",
            textAnimation: s.textAnimation || "none",
            elements: sanitizeElements(s.elements),
        };
    }
    if (isVideoScene(s)) {
        return {
            kind: "video",
            videoUrl: s.videoUrl,
            trimStart: typeof s.trimStart === "number" ? s.trimStart : 0,
            trimEnd: typeof s.trimEnd === "number" ? s.trimEnd : 0,
            durationHint: typeof s.durationHint === "number" ? s.durationHint : undefined,
            text: s.text ?? "",
            fontSize: s.fontSize ?? DEFAULT_SCENE_STYLE.fontSize,
            textColor: s.textColor ?? DEFAULT_SCENE_STYLE.textColor,
            fontFamily: s.fontFamily ?? DEFAULT_SCENE_STYLE.fontFamily,
        };
    }
    return {
        kind: "text",
        text: s?.text ?? "",
        fontSize: s?.fontSize ?? DEFAULT_SCENE_STYLE.fontSize,
        textColor: s?.textColor ?? DEFAULT_SCENE_STYLE.textColor,
        fontFamily: s?.fontFamily ?? DEFAULT_SCENE_STYLE.fontFamily,
        duration: typeof s?.duration === "number" ? s.duration : undefined,
        animation: s?.animation || "none",
        textAnimation: s?.textAnimation || "none",
        elements: sanitizeElements(s?.elements),
    };
}

// A scene is renderable if it has a clip, an image, or caption text.
export function isRenderableScene(s: Scene): boolean {
    if (isVideoScene(s)) return !!s.videoUrl;
    if (isImageScene(s)) return !!s.imageUrl;
    return !!(s.text && s.text.trim());
}

export function sceneTrimDuration(s: VideoScene): number {
    const d = (s.trimEnd || 0) - (s.trimStart || 0);
    return d > 0 ? d : 0;
}
