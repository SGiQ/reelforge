import { NextRequest, NextResponse } from "next/server";

// Autonomous reel director. Claude plans the whole reel (script + per-scene
// visual decisions), Pexels supplies candidate clips, and Claude vision-ranks
// the thumbnails to pick the best footage per scene. Returns a complete,
// editable reel spec — the client either opens it in Preview or renders it.

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const PEXELS_URL = "https://api.pexels.com/videos/search";
const THEME_IDS = ["dark", "light", "sky-blue", "warm-gold", "crimson-red", "forest-green", "amethyst", "monochrome"];
const FONTS = ["DejaVuSans-Bold.ttf", "Montserrat-Bold.ttf", "Oswald-Bold.ttf", "BebasNeue-Regular.ttf", "PlayfairDisplay-Bold.ttf", "Outfit-Bold.ttf", "SpaceMono-Bold.ttf", "Cinzel-Bold.ttf", "DejaVuSerif.ttf", "DejaVuSansMono.ttf"];
// Per-scene emphasis → caption font size (px in the 1080-wide frame).
const EMPHASIS_SIZE: Record<string, number> = { small: 74, medium: 92, large: 116, xl: 142 };
// Where an accent element sits — kept out of the centered caption zone.
const POSITION_XY: Record<string, [number, number]> = {
    top: [0.5, 0.15], top_left: [0.22, 0.17], top_right: [0.78, 0.17],
    bottom: [0.5, 0.85], bottom_left: [0.22, 0.83], bottom_right: [0.78, 0.83],
};
// Curated Lucide icon names the AI may use (must be valid component names).
const ICON_NAMES = ["Heart", "Star", "Check", "CheckCircle", "ThumbsUp", "Flame", "Zap", "Sparkles", "Bell", "Gift", "Crown", "Award", "Trophy", "Rocket", "Sun", "Moon", "Cloud", "Music", "Camera", "Phone", "Mail", "MapPin", "Calendar", "Clock", "ShoppingCart", "Tag", "Percent", "DollarSign", "TrendingUp", "Target", "Lightbulb", "Smile", "Coffee", "Gem", "Megaphone", "Quote", "ArrowRight", "Play", "Lock", "Shield", "Globe", "Users", "MessageCircle", "AlertCircle", "Info", "Eye", "Home", "Handshake"];
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

async function claude(body: any) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("NO_ANTHROPIC_KEY");
    const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return res.json();
}

function toolInput(resp: any, name: string): any {
    const block = (resp?.content || []).find((b: any) => b.type === "tool_use" && b.name === name);
    if (!block) throw new Error(`Claude did not return the ${name} tool call`);
    return block.input;
}

// Pexels candidates for one query — a few portrait clips with thumbnails.
async function pexelsCandidates(query: string): Promise<any[]> {
    const key = process.env.PEXELS_API_KEY;
    if (!key || !query.trim()) return [];
    const url = `${PEXELS_URL}?query=${encodeURIComponent(query)}&orientation=portrait&per_page=4&size=medium`;
    try {
        const res = await fetch(url, { headers: { Authorization: key } });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.videos || []).map((v: any) => {
            const mp4 = (v.video_files || []).filter((f: any) => f.file_type === "video/mp4" && f.link);
            mp4.sort((a: any, b: any) => (a.height || 0) - (b.height || 0));
            const chosen = mp4.find((f: any) => (f.height || 0) >= 1080) || mp4[mp4.length - 1] || (v.video_files || [])[0];
            return { thumbnail: v.image, duration: v.duration, downloadUrl: chosen?.link || null };
        }).filter((c: any) => c.downloadUrl).slice(0, 4);
    } catch {
        return [];
    }
}

export async function POST(req: NextRequest) {
    try {
        const { prompt, brandName, websiteUrl, slideCount = 6 } = await req.json();
        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
        }
        const n = Math.max(3, Math.min(10, Number(slideCount) || 6));

        // Load the music library so Claude can score the reel by mood.
        let tracks: any[] = [];
        try {
            const api = process.env.NEXT_PUBLIC_API_URL;
            if (api) {
                const mr = await fetch(`${api}/music`);
                if (mr.ok) tracks = await mr.json();
            }
        } catch { /* library is optional */ }
        const musicList = tracks.length
            ? `\n\nAVAILABLE MUSIC — pick the best fit by mood, or "none":\n${tracks.map((t) => `- "${t.title}" (${t.mood})`).join("\n")}`
            : "";

        // 1. Optional brand research (same pattern as the script generator).
        let research = "";
        if (websiteUrl && process.env.PERPLEXITY_API_KEY) {
            try {
                const r = await fetch("https://api.perplexity.ai/chat/completions", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "sonar-pro",
                        messages: [
                            { role: "system", content: "Extract a company's value prop, services, and audience." },
                            { role: "user", content: `Analyze ${websiteUrl}. Who do they help and what are their selling points? 2-3 short paragraphs.` },
                        ],
                    }),
                });
                if (r.ok) {
                    const d = await r.json();
                    const txt = d.choices?.[0]?.message?.content;
                    if (txt) research = `\n\n### BACKGROUND ON THE BRAND:\n${txt}`;
                }
            } catch { /* research is best-effort */ }
        }

        // 2. Plan the whole reel with Claude (forced structured output).
        const system = `You are an expert short-form video ART DIRECTOR for TikTok / Reels / Shorts.
Plan a vertical (9:16) reel of EXACTLY ${n} scenes for the brand "${brandName || "the brand"}". Make it look designed, not templated.
Content:
- Scene 1 is a strong hook; the final scene is a clear call to action.
- Captions are punchy — under ~16 words each.
- Choose each scene's "type": "video" when real footage helps (people, places, action) or "text" for bold statements/hooks/CTAs. Aim for a mix.
- For "video" scenes, give a concise 2-4 word "stock_query".
- "duration" is seconds on screen (2.5-5).
Design (this is what makes it look good):
- Pick ONE "font" for the whole reel that fits the brand's tone (e.g. BebasNeue/Oswald = bold punchy, Playfair/Cinzel = elegant, Outfit/Montserrat = modern clean, SpaceMono = techy).
- Pick a "theme" whose colors match the mood.
- Per scene set "emphasis": "xl" or "large" for the hook & key lines, "medium" for normal copy, "small" for fine print. Vary it for visual rhythm.
- Optionally set "text_color" as a #RRGGBB hex when a specific color sharpens the message; otherwise omit it (a readable default is used). Over video, keep text light.
- Pick a fitting "text_animation"; for text scenes also a subtle "background_motion".
- Optionally add up to 2 "elements" (an icon or emoji) on a scene to accent it — place them in a corner/top/bottom (NOT over the caption). Use sparingly. For kind "icon", "value" MUST be one of: ${ICON_NAMES.join(", ")}. For kind "emoji", "value" is the emoji character.
- Set "music" to the EXACT title of the best-fitting track below, or "none".
- Do NOT fabricate statistics, prices, or medical/clinical claims. Keep claims emotional and truthful.${musicList}${research}`;

        const planResp = await claude({
            model: MODEL,
            max_tokens: 2000,
            system,
            messages: [{ role: "user", content: prompt }],
            tools: [{
                name: "build_reel_plan",
                description: "Return a structured plan for the reel.",
                input_schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        theme: { type: "string", enum: THEME_IDS },
                        font: { type: "string", enum: FONTS, description: "One font for the whole reel." },
                        music: { type: "string", description: "Exact title of a track from the list, or 'none'." },
                        scenes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string", enum: ["text", "video"] },
                                    caption: { type: "string" },
                                    stock_query: { type: "string" },
                                    emphasis: { type: "string", enum: ["small", "medium", "large", "xl"] },
                                    text_color: { type: "string", description: "#RRGGBB hex, or omit for the default." },
                                    text_animation: { type: "string", enum: ["none", "fade", "fade_up", "slide_left", "slide_right"] },
                                    background_motion: { type: "string", enum: ["none", "zoom_in", "zoom_out", "pan_left", "pan_right"] },
                                    elements: {
                                        type: "array",
                                        description: "Up to 2 accent graphics, placed away from the caption.",
                                        items: {
                                            type: "object",
                                            properties: {
                                                kind: { type: "string", enum: ["emoji", "icon"] },
                                                value: { type: "string", description: "An emoji char, or a Lucide icon name from the allowed set." },
                                                position: { type: "string", enum: ["top", "top_left", "top_right", "bottom", "bottom_left", "bottom_right"] },
                                                animation: { type: "string", enum: ["pop", "fade", "bounce"] },
                                            },
                                            required: ["kind", "value", "position"],
                                        },
                                    },
                                    duration: { type: "number" },
                                },
                                required: ["type", "caption", "emphasis", "text_animation", "background_motion", "duration"],
                            },
                        },
                    },
                    required: ["title", "theme", "font", "scenes"],
                },
            }],
            tool_choice: { type: "tool", name: "build_reel_plan" },
        });
        const plan = toolInput(planResp, "build_reel_plan");
        const scenes: any[] = Array.isArray(plan.scenes) ? plan.scenes : [];

        // 3. Fetch stock candidates for every video scene (in parallel).
        const candidatesByScene: Record<number, any[]> = {};
        await Promise.all(scenes.map(async (s, i) => {
            if (s.type === "video") candidatesByScene[i] = await pexelsCandidates(s.stock_query || s.caption || "");
        }));

        // 4. Vision-rank: Claude looks at the thumbnails and picks the best clip per scene.
        const videoIdx = scenes.map((s, i) => i).filter((i) => (candidatesByScene[i]?.length || 0) > 0);
        const chosen: Record<number, number> = {};
        videoIdx.forEach((i) => { chosen[i] = 0; }); // default: top Pexels result
        if (videoIdx.length > 0) {
            try {
                const content: any[] = [{
                    type: "text",
                    text: "For each scene below, pick the option number whose footage best matches the caption. Prefer clear, on-topic, well-composed clips.",
                }];
                videoIdx.forEach((i) => {
                    content.push({ type: "text", text: `\nSCENE ${i} — caption: "${scenes[i].caption}" (query: ${scenes[i].stock_query || ""})` });
                    candidatesByScene[i].forEach((c, oi) => {
                        content.push({ type: "text", text: `Option ${oi}:` });
                        content.push({ type: "image", source: { type: "url", url: c.thumbnail } });
                    });
                });
                const rankResp = await claude({
                    model: MODEL,
                    max_tokens: 1000,
                    messages: [{ role: "user", content }],
                    tools: [{
                        name: "pick_clips",
                        description: "Pick the best option index for each scene.",
                        input_schema: {
                            type: "object",
                            properties: {
                                picks: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: { scene: { type: "integer" }, option: { type: "integer" } },
                                        required: ["scene", "option"],
                                    },
                                },
                            },
                            required: ["picks"],
                        },
                    }],
                    tool_choice: { type: "tool", name: "pick_clips" },
                });
                const picks = toolInput(rankResp, "pick_clips").picks || [];
                for (const p of picks) {
                    const cands = candidatesByScene[p.scene];
                    if (cands && p.option >= 0 && p.option < cands.length) chosen[p.scene] = p.option;
                }
            } catch { /* fall back to top results already set */ }
        }

        // 5. Assemble the editable reel spec (scene shapes match src/lib/scenes.ts).
        const fontFamily = FONTS.includes(plan.font) ? plan.font : "Montserrat-Bold.ttf";
        let elId = 0;
        const slides = scenes.map((s, i) => {
            const cands = candidatesByScene[i];
            const clip = cands?.[chosen[i] ?? 0];
            const fontSize = EMPHASIS_SIZE[s.emphasis] || 92;
            const textColor = typeof s.text_color === "string" && HEX_RE.test(s.text_color) ? s.text_color : "";
            const common = { text: s.caption || "", fontSize, textColor, fontFamily };
            if (s.type === "video" && clip) {
                const dur = Math.min(clip.duration || 6, Math.max(3, Number(s.duration) || 5));
                return { kind: "video", videoUrl: clip.downloadUrl, trimStart: 0, trimEnd: dur, ...common };
            }
            // text scene (also the fallback when stock is unavailable)
            const elements = (Array.isArray(s.elements) ? s.elements : []).slice(0, 2).map((el: any) => {
                const isIcon = el.kind === "icon" && ICON_NAMES.includes(el.value);
                if (el.kind === "icon" && !isIcon) return null; // drop hallucinated icon names
                const [x, y] = POSITION_XY[el.position] || POSITION_XY.top;
                return {
                    id: `ael_${elId++}`,
                    type: isIcon ? "icon" : "emoji",
                    value: el.value,
                    x, y, size: isIcon ? 120 : 140,
                    color: isIcon ? (textColor || "#ffffff") : undefined,
                    animation: ["pop", "fade", "bounce"].includes(el.animation) ? el.animation : "pop",
                };
            }).filter(Boolean);
            return {
                kind: "text",
                ...common,
                duration: Number(s.duration) || 0,
                animation: s.background_motion || "none",
                textAnimation: s.text_animation || "fade_up",
                elements,
            };
        });

        const pickedTrack = plan.music && plan.music !== "none"
            ? tracks.find((t) => t.title === plan.music)
            : null;

        return NextResponse.json({
            title: plan.title || "AI Reel",
            theme: THEME_IDS.includes(plan.theme) ? plan.theme : "dark",
            slides,
            music_url: pickedTrack?.url || null,
            music_title: pickedTrack?.title || null,
        });
    } catch (e: any) {
        if (e?.message === "NO_ANTHROPIC_KEY") {
            return NextResponse.json({ error: "The reel agent isn't configured yet — add ANTHROPIC_API_KEY in the deployment env." }, { status: 503 });
        }
        return NextResponse.json({ error: e?.message || "Agent failed" }, { status: 500 });
    }
}
