import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureUser } from "@/lib/auth/ensure-user";
import { prisma } from "@/lib/db";
import { AI_VOICE_RATE_LIMIT } from "@/lib/utils/constants";

const ContextSchema = z
  .object({
    skillId: z.string(),
    challengeType: z
      .enum(["MOCK_INTERVIEW", "SCENARIO_DRILL", "SOCRATIC_COACHING"])
      .optional(),
  })
  .optional();

// ─── Voice prompt builder ────────────────────────────────

function buildVoicePrompt(
  skillName: string,
  challengeType?: string
): { prompt: string; firstMessage: string } {
  const typeLabel =
    challengeType === "MOCK_INTERVIEW"
      ? "mock interview"
      : challengeType === "SCENARIO_DRILL"
        ? "scenario drill"
        : challengeType === "SOCRATIC_COACHING"
          ? "Socratic coaching session"
          : "business challenge";

  return {
    prompt: `You are the Praxel AI Challenger  -  a sharp, professional business coach specializing in ${skillName}. You are running a ${typeLabel} via voice conversation.

RULES:
1. Keep each response under 60 words. Voice conversations must be concise.
2. Ask ONE probing question per turn. Make it scenario-based.
3. Never reveal correct answers directly  -  guide the user to discover insights.
4. Stay focused on ${skillName}. If the user goes off-topic, redirect.
5. Speak naturally  -  no bullet points, no numbered lists, no markdown.
6. Address the user as a professional peer.
7. After 4-5 exchanges, wrap up with a brief actionable insight.
8. Sound like a senior colleague challenging their thinking, not a tutor.`,

    firstMessage:
      challengeType === "MOCK_INTERVIEW"
        ? `Alright, let's jump in. I'm going to test your ${skillName} thinking. Walk me through how you'd approach a situation where your company needs to make a critical ${skillName.toLowerCase()} decision under time pressure. What's your framework?`
        : challengeType === "SCENARIO_DRILL"
          ? `Here's the situation. You're the lead on a high-stakes project and you just got pulled into an urgent ${skillName.toLowerCase()} problem. Your team is looking to you for direction. What's your first move?`
          : `I want to explore something interesting about ${skillName} with you. What do you think is the biggest misconception most professionals have when it comes to ${skillName.toLowerCase()}?`,
  };
}

// ─── Voice Availability Check ────────────────────────────

export async function GET() {
  const available = !!(process.env.ELEVENLABS_AGENT_ID && process.env.ELEVENLABS_API_KEY);
  return NextResponse.json({ available });
}

// ─── Route Handler ───────────────────────────────────────

export async function POST(req: NextRequest) {
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

  // Parse optional challenge context
  let context;
  try {
    const body = await req.json();
    context = ContextSchema.parse(body);
  } catch {
    context = undefined;
  }

  // Rate limit: voice sessions per hour
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

  // Look up skill name for prompt generation
  let voiceOverrides: { prompt: string; firstMessage: string } | undefined;
  if (context?.skillId) {
    const skill = await prisma.skill.findUnique({
      where: { id: context.skillId },
      select: { name: true },
    });
    if (skill) {
      voiceOverrides = buildVoicePrompt(skill.name, context.challengeType);
    }
  }

  try {
    // ElevenLabs API uses hyphenated endpoint: get-signed-url (not get_signed_url)
    const url = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`;
    console.log("[elevenlabs] Requesting signed URL for agent:", agentId);
    
    const response = await fetch(url, {
      method: "GET",
      headers: { "xi-api-key": apiKey },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[elevenlabs] Failed to get signed URL:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return NextResponse.json(
        { error: "Failed to create voice session", details: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();
    console.log("[elevenlabs] Got signed URL successfully");
    
    return NextResponse.json({
      signedUrl: data.signed_url,
      ...(voiceOverrides && { overrides: voiceOverrides }),
    });
  } catch (error) {
    console.error("[elevenlabs] Signed URL error:", error);
    return NextResponse.json(
      { error: "Voice service unavailable", details: String(error) },
      { status: 502 }
    );
  }
}
