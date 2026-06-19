// Shared scene model for reels. A reel is an ordered list of scenes.
// Scenes are stored in localStorage (reelforge_script.slides) and sent to the
// backend as `slides` — kept backward compatible with the old text-only shape.

export interface TextScene {
    kind?: "text";
    text: string;
    fontSize: number;
    textColor: string;
    fontFamily: string;
}

export interface VideoScene {
    kind: "video";
    videoUrl: string;
    // Trim window within the source clip, in seconds.
    trimStart: number;
    trimEnd: number;
    // Optional caption rendered over the clip (same styling as text scenes).
    text: string;
    fontSize: number;
    textColor: string;
    fontFamily: string;
}

export type Scene = TextScene | VideoScene;

export const DEFAULT_SCENE_STYLE = {
    fontSize: 88,
    textColor: "#ffffff",
    fontFamily: "DejaVuSans-Bold.ttf",
};

export function isVideoScene(s: any): s is VideoScene {
    return !!s && typeof s === "object" && s.kind === "video" && typeof s.videoUrl === "string";
}

// Normalize any legacy shape (plain string, or text object) into a Scene.
export function toScene(s: any): Scene {
    if (typeof s === "string") return { kind: "text", text: s, ...DEFAULT_SCENE_STYLE };
    if (isVideoScene(s)) {
        return {
            kind: "video",
            videoUrl: s.videoUrl,
            trimStart: typeof s.trimStart === "number" ? s.trimStart : 0,
            trimEnd: typeof s.trimEnd === "number" ? s.trimEnd : 0,
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
    };
}

// A scene is renderable if it has caption text (text scene) or a clip (video scene).
export function isRenderableScene(s: Scene): boolean {
    if (isVideoScene(s)) return !!s.videoUrl;
    return !!(s.text && s.text.trim());
}

export function sceneTrimDuration(s: VideoScene): number {
    const d = (s.trimEnd || 0) - (s.trimStart || 0);
    return d > 0 ? d : 0;
}
