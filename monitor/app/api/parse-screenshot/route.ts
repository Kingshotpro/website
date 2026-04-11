import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("screenshot") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No screenshot provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `This is a screenshot of the Alliance Power Rankings screen from the mobile game Kingshots.

Extract all visible alliance entries and return them as a JSON array. Each entry should have:
- rank: integer (the rank number shown, e.g. 1, 2, 3...)
- tag: string (the alliance tag in brackets, e.g. "TNP", "PSY" — omit brackets)
- name: string (the full alliance name, e.g. "TheNakedPenguins")
- power: integer (the power number — remove dots/commas, e.g. "21.348.002.913" → 21348002913)

Rules:
- Include every row you can see, even partial ones at screen edges
- If tag is not visible, use empty string ""
- If name is not visible, use empty string ""
- Power must be a plain integer with no separators
- Preserve the exact rank numbers shown

Return ONLY valid JSON like this (no explanation, no markdown):
[{"rank":1,"tag":"TNP","name":"TheNakedPenguins","power":21348002913},...]`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse the JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse rankings from screenshot" }, { status: 422 });
    }

    const rankings = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ rankings });
  } catch (err) {
    console.error("parse-screenshot error:", err);
    return NextResponse.json({ error: "Failed to parse screenshot" }, { status: 500 });
  }
}
