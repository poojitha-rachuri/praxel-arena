import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const { challengeId } = await params;

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const config = challenge.config as { accuracyThreshold?: number };

  // Build where clause for speed rounds (accuracy threshold)
  const where =
    challenge.type === "SPEED_ROUND" && config.accuracyThreshold
      ? { challengeId, accuracy: { gte: config.accuracyThreshold } }
      : { challengeId };

  const orderBy =
    challenge.type === "SPEED_ROUND"
      ? { timeSpentMs: "asc" as const }
      : [{ score: "desc" as const }, { timeSpentMs: "asc" as const }];

  const entries = await prisma.challengeAttempt.findMany({
    where,
    orderBy,
    take: 50,
    include: {
      user: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  // Deduplicate by user (keep best attempt per user)
  const seen = new Set<string>();
  const deduped = entries.filter((e) => {
    if (seen.has(e.userId)) return false;
    seen.add(e.userId);
    return true;
  });

  // Get current user's rank
  const user = await ensureUser();
  let userRank: number | null = null;
  if (user) {
    const idx = deduped.findIndex((e) => e.userId === user.id);
    userRank = idx >= 0 ? idx + 1 : null;
  }

  return NextResponse.json({
    challenge: {
      id: challenge.id,
      type: challenge.type,
      name: challenge.name,
    },
    entries: deduped.map((e, i) => ({
      rank: i + 1,
      userId: e.user.id,
      name: e.user.name,
      imageUrl: e.user.imageUrl,
      score: e.score,
      timeSpentMs: e.timeSpentMs,
      accuracy: e.accuracy,
      xpEarned: e.xpEarned,
    })),
    userRank,
  });
}
