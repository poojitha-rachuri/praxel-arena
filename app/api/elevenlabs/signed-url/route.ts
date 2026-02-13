import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/auth/ensure-user";
import { prisma } from "@/lib/db";
import { AI_VOICE_RATE_LIMIT } from "@/lib/utils/constants";

export async function GET() {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId || !apiKey) {
    return NextResponse.json(
      { error: "Voice mode not configured" },
      { status: 503 }
    );
  }

  // Rate limit: 5 voice sessions per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentVoiceSessions = await prisma.challengeSession.count({
    where: {
      userId: user.id,
      inputMode: { in: ["VOICE", "MIXED"] },
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentVoiceSessions >= AI_VOICE_RATE_LIMIT) {
    return NextResponse.json(
      { error: "Voice rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: { "xi-api-key": apiKey },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[elevenlabs] Failed to get signed URL:", errorText);
      return NextResponse.json(
        { error: "Failed to create voice session" },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (error) {
    console.error("[elevenlabs] Signed URL error:", error);
    return NextResponse.json(
      { error: "Voice service unavailable" },
      { status: 502 }
    );
  }
}
