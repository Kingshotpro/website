import { NextRequest, NextResponse } from "next/server";
import { insertSnapshot } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kingdom_id, captured_at, submitted_by, rankings } = body;

    if (!kingdom_id || !rankings || !Array.isArray(rankings) || rankings.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const kingdomNum = parseInt(kingdom_id);
    if (isNaN(kingdomNum) || kingdomNum < 1) {
      return NextResponse.json({ error: "Invalid kingdom ID" }, { status: 400 });
    }

    // Validate rankings
    for (const r of rankings) {
      if (typeof r.rank !== "number" || typeof r.power !== "number") {
        return NextResponse.json({ error: "Invalid ranking entry" }, { status: 400 });
      }
    }

    const snapId = insertSnapshot(
      kingdomNum,
      captured_at || new Date().toISOString(),
      submitted_by || null,
      "screenshot",
      rankings.map((r: { rank: number; game_id?: string; name?: string; tag?: string; power: number }) => ({
        rank: r.rank,
        game_id: r.game_id || String(r.rank).padStart(4, "0"),
        name: r.name || "",
        tag: r.tag || "",
        power: r.power,
      }))
    );

    return NextResponse.json({ success: true, snapshot_id: snapId, kingdom_id: kingdomNum });
  } catch (err) {
    console.error("submit error:", err);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
