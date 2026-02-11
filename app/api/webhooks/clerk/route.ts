// TODO: POST /api/webhooks/clerk - Clerk webhook for user sync
// Use svix for webhook verification
// Subscribe to user.created event
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
