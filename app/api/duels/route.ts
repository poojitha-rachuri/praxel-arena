// TODO: POST /api/duels - Create or join duel
// Matchmaking: within 200 Elo, expand to 400 after 60s
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
