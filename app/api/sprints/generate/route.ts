// TODO: POST /api/sprints/generate - Generate compete sprint via AI
// Rate limit: 5/user/hour
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
