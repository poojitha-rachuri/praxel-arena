import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureUser } from "@/lib/auth/ensure-user";
import { prisma } from "@/lib/db";
import { AI_CHALLENGE_RATE_LIMIT } from "@/lib/utils/constants";

const CreateSessionSchema = z.object({
  skillId: z.string(),
  challengeType: z.enum([
    "MOCK_INTERVIEW",
    "SCENARIO_DRILL",
    "SOCRATIC_COACHING",
  ]),
});

export async function POST(req: NextRequest) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = CreateSessionSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }

  const { skillId, challengeType } = body.data;

  try {
    // Verify skill exists and check rate limit in parallel
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [skill, recentCount] = await Promise.all([
      prisma.skill.findUnique({ where: { id: skillId } }),
      prisma.challengeSession.count({
        where: { userId: user.id, createdAt: { gte: oneHourAgo } },
      }),
    ]);

    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    if (recentCount >= AI_CHALLENGE_RATE_LIMIT) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later.", retryAfter: 3600 },
        { status: 429 }
      );
    }

    const session = await prisma.challengeSession.create({
      data: {
        userId: user.id,
        skillId,
        challengeType,
        messages: [],
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    const correlationId = crypto.randomUUID();
    console.error(`[${correlationId}] Session creation error:`, error);
    return NextResponse.json(
      { error: "Failed to create session", correlationId },
      { status: 500 }
    );
  }
}
