// TODO: GET /api/skills - All skills with career mappings
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ skills: [] });
}
