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
        const system = `You are an expert short-form video director for TikTok / Reels / Shorts.
Plan a vertical (9:16) reel of EXACTLY ${n} scenes for the brand "${brandName || "the brand"}".
Rules:
- Scene 1 is a strong hook; the final scene is a clear call to action.
- Captions are punchy — under ~16 words each.
- Choose each scene's "type": "video" when real footage helps (people, places, action, product context) or "text" for bold statements/hooks/CTAs. Aim for a mix.
- For "video" scenes, give a concise 2-4 word "stock_query" describing the footage to search.
- Pick a fitting "text_animation" and (for text scenes) a subtle "background_motion".
- Optionally add a single relevant "emoji" to a scene for emphasis.
- "duration" is seconds on screen (2.5-5).
- Pick a "theme" that matches the mood.
- Set "music" to the EXACT title of the best-fitting track from the list below, or "none".
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
                        music: { type: "string", description: "Exact title of a track from the list, or 'none'." },
                        scenes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string", enum: ["text", "video"] },
                                    caption: { type: "string" },
                                    stock_query: { type: "string" },
                                    text_animation: { type: "string", enum: ["none", "fade", "fade_up", "slide_left", "slide_right"] },
                                    background_motion: { type: "string", enum: ["none", "zoom_in", "zoom_out", "pan_left", "pan_right"] },
                                    emoji: { type: "string" },
                                    duration: { type: "number" },
                                },
                                required: ["type", "caption", "text_animation", "background_motion", "duration"],
                            },
                        },
                    },
                    required: ["title", "theme", "scenes"],
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
        let elId = 0;
        const slides = scenes.map((s, i) => {
            const cands = candidatesByScene[i];
            const clip = cands?.[chosen[i] ?? 0];
            const common = { text: s.caption || "", fontSize: 90, textColor: "", fontFamily: "Montserrat-Bold.ttf" };
            if (s.type === "video" && clip) {
                const dur = Math.min(clip.duration || 6, Math.max(3, Number(s.duration) || 5));
                return { kind: "video", videoUrl: clip.downloadUrl, trimStart: 0, trimEnd: dur, ...common };
            }
            // text scene (also the fallback when stock is unavailable)
            const elements = s.emoji
                ? [{ id: `ael_${elId++}`, type: "emoji", value: s.emoji, x: 0.5, y: 0.26, size: 150, animation: "pop" }]
                : [];
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
