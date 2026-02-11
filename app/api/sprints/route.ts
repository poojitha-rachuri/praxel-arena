// TODO: GET /api/sprints?skillSlug=X&mode=LEARN - Fetch sprints by skill + mode
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ sprints: [] });
}
