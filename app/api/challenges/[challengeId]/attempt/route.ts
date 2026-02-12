import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import { challengeXpForRank } from "@/lib/gamification/challenges";
import { processGamification } from "@/lib/gamification/xp";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { challengeId } = await params;

  let body: {
    score?: number;
    timeSpentMs?: number;
    accuracy?: number;
    sprintId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { score, timeSpentMs, accuracy } = body;

  if (
    typeof score !== "number" || !Number.isFinite(score) || score < 0 ||
    typeof timeSpentMs !== "number" || !Number.isFinite(timeSpentMs) || timeSpentMs < 0 ||
    typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 1
  ) {
    return NextResponse.json(
      { error: "score, timeSpentMs, and accuracy must be valid non-negative numbers (accuracy 0-1)" },
      { status: 400 }
    );
  }

  // Fetch challenge
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  // Validate challenge is still active
  const now = new Date();
  if (!challenge.isActive || challenge.endsAt < now) {
    return NextResponse.json(
      { error: "This challenge has ended" },
      { status: 400 }
    );
  }

  // Speed Round: check accuracy threshold
  const config = challenge.config as { accuracyThreshold?: number };
  if (
    challenge.type === "SPEED_ROUND" &&
    config.accuracyThreshold &&
    accuracy < config.accuracyThreshold
  ) {
    return NextResponse.json({
      success: false,
      message: `Accuracy too low (${Math.round(accuracy * 100)}%). Need ${Math.round(config.accuracyThreshold * 100)}% to qualify.`,
      xpEarned: 0,
    });
  }

  // Atomically check first attempt + create + award XP in one transaction
  const { attempt, isFirstAttempt, xpEarned, rank } = await prisma.$transaction(async (tx) => {
    const existingAttempt = await tx.challengeAttempt.findFirst({
      where: { userId: user.id, challengeId },
    });
    const isFirst = !existingAttempt;

    const newAttempt = await tx.challengeAttempt.create({
      data: {
        userId: user.id,
        challengeId,
        score,
        timeSpentMs,
        accuracy,
      },
    });

    // Calculate rank
    let computedRank: number;
    if (challenge.type === "SPEED_ROUND") {
      computedRank = await tx.challengeAttempt.count({
        where: {
          challengeId,
          timeSpentMs: { lt: timeSpentMs },
          accuracy: { gte: config.accuracyThreshold ?? 0.7 },
        },
      });
    } else {
      computedRank = await tx.challengeAttempt.count({
        where: {
          challengeId,
          OR: [
            { score: { gt: score } },
            { score, timeSpentMs: { lt: timeSpentMs } },
          ],
        },
      });
    }
    computedRank += 1; // 1-indexed

    let earned = 0;
    if (isFirst) {
      earned = challengeXpForRank(
        computedRank,
        challenge.rewardXpFirst,
        challenge.rewardXpTenth
      );

      await tx.challengeAttempt.update({
        where: { id: newAttempt.id },
        data: { xpEarned: earned },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          xp: { increment: earned },
          weeklyXp: { increment: earned },
        },
      });

      await tx.xpTransaction.create({
        data: {
          userId: user.id,
          amount: earned,
          source: "CHALLENGE",
          metadata: {
            challengeId,
            challengeName: challenge.name,
            rank: computedRank,
            score,
            timeSpentMs,
          },
        },
      });
    }

    return { attempt: newAttempt, isFirstAttempt: isFirst, xpEarned: earned, rank: computedRank };
  });

  // Get top 10 for response
  const orderBy =
    challenge.type === "SPEED_ROUND"
      ? { timeSpentMs: "asc" as const }
      : [{ score: "desc" as const }, { timeSpentMs: "asc" as const }];

  const top10 = await prisma.challengeAttempt.findMany({
    where: { challengeId },
    orderBy,
    take: 10,
    include: {
      user: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  return NextResponse.json({
    success: true,
    rank,
    xpEarned,
    isFirstAttempt,
    leaderboard: top10.map((a, i) => ({
      rank: i + 1,
      userId: a.user.id,
      name: a.user.name,
      imageUrl: a.user.imageUrl,
      score: a.score,
      timeSpentMs: a.timeSpentMs,
      accuracy: a.accuracy,
    })),
  });
}
