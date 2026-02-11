// TODO: GET /api/leaderboard?skillSlug=X - Leaderboard by skill
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ entries: [] });
}
