import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureUser } from "@/lib/auth/ensure-user";
import { prisma } from "@/lib/db";

const CreateSessionSchema = z.object({
  skillId: z.string(),
  challengeType: z.enum([
    "MOCK_INTERVIEW",
    "SCENARIO_DRILL",
    "SOCRATIC_COACHING",
  ]),
});

export async function POST(req: Request) {
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
      { error: "Invalid request", details: body.error.flatten() },
      { status: 400 }
    );
  }

  const { skillId, challengeType } = body.data;

  // Verify skill exists
  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  // Rate limit: 10 AI sessions per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.challengeSession.count({
    where: { userId: user.id, createdAt: { gte: oneHourAgo } },
  });
  if (recentCount >= 10) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
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
}
