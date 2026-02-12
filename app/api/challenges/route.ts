import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET() {
  const user = await ensureUser();

  const now = new Date();

  const challenges = await prisma.challenge.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    include: {
      skill: { select: { id: true, name: true, slug: true, icon: true } },
      _count: { select: { attempts: true } },
    },
    orderBy: { endsAt: "asc" },
  });

  // If user is logged in, get their best attempts per challenge
  let userAttempts: Record<
    string,
    { score: number; timeSpentMs: number; xpEarned: number }
  > = {};
  if (user) {
    const attempts = await prisma.challengeAttempt.findMany({
      where: {
        userId: user.id,
        challengeId: { in: challenges.map((c) => c.id) },
      },
      orderBy: { score: "desc" },
    });

    for (const attempt of attempts) {
      if (!userAttempts[attempt.challengeId]) {
        userAttempts[attempt.challengeId] = {
          score: attempt.score,
          timeSpentMs: attempt.timeSpentMs,
          xpEarned: attempt.xpEarned,
        };
      }
    }
  }

  return NextResponse.json({
    challenges: challenges.map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      description: c.description,
      skill: c.skill,
      config: c.config,
      startsAt: c.startsAt,
      endsAt: c.endsAt,
      rewardXpFirst: c.rewardXpFirst,
      rewardXpTenth: c.rewardXpTenth,
      attemptCount: c._count.attempts,
      userBestAttempt: userAttempts[c.id] ?? null,
    })),
  });
}
