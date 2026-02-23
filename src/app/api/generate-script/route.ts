import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

export async function POST(req: NextRequest) {
    try {
        const userId = "guest_user_123";


        const body = await req.json();
        const { prompt, websiteUrl, slideCount = 8 } = body;

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
        }

        // 1. Dual-AI Pipeline: Perplexity Research
        let researchContext = "";
        if (websiteUrl && process.env.PERPLEXITY_API_KEY) {
            try {
                const perplexityRes = await fetch("https://api.perplexity.ai/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "sonar-pro",
                        messages: [
                            {
                                role: "system",
                                content: "You are an expert brand researcher. Your job is to extract the core value proposition, key services, and target demographic of the provided company website."
                            },
                            {
                                role: "user",
                                content: `Please visit and analyze this website: ${websiteUrl}. Summarize what this company does, who they help, and their main selling points in 2-3 clear paragraphs.`
                            }
                        ]
                    })
                });

                if (perplexityRes.ok) {
                    const perplexityData = await perplexityRes.json();
                    if (perplexityData.choices && perplexityData.choices[0]?.message?.content) {
                        researchContext = `\n\n### BACKGROUND RESEARCH (from the user's website):\n${perplexityData.choices[0].message.content}\nUse this background research to deeply personalize the script to their actual business.`;
                    }
                } else {
                    console.warn("Perplexity API error:", await perplexityRes.text());
                }
            } catch (err) {
                console.error("Failed to fetch Perplexity context:", err);
            }
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const systemInstruction = `You are an expert short-form video script writer for TikTok, Instagram Reels, and YouTube Shorts.
The user will give you a topic or prompt.
You must write a highly engaging script consisting of exactly ${slideCount} short, punchy lines.
Each line is a "slide" that will be displayed on screen for about 2.5 seconds.
Keep the text on each slide extremely concise (under 20 words per slide if possible).
Focus on emotional hooks, pain points, or strong value propositions.${researchContext}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "ScriptSchema",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            title: {
                                type: "string",
                                description: "A short, catchy title for the script"
                            },
                            slides: {
                                type: "array",
                                items: {
                                    type: "string"
                                },
                                description: `An array of exactly ${slideCount} short strings, each representing one slide/scene in the video.`
                            }
                        },
                        required: ["title", "slides"],
                        additionalProperties: false
                    }
                }
            }
        });

        const outputText = response.choices[0]?.message?.content;
        if (!outputText) throw new Error("No response from AI");

        const scriptData = JSON.parse(outputText);

        return NextResponse.json(scriptData);
    } catch (error: any) {
        console.error("Error generating script:", error);
        return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
    }
}
