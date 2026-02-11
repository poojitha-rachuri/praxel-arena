// TODO: GET /api/duels/[duelId] - Duel status (for polling)
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ duelId: string }> }
) {
  const { duelId } = await params;
  return NextResponse.json({ duelId, status: "not_found" });
}
