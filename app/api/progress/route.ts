import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import type { DimensionScores } from "@/types";

export async function GET(request: NextRequest) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const skill = request.nextUrl.searchParams.get("skill");

  // Build where clause
  const where: Record<string, unknown> = {
    userId: user.id,
    completedAt: { not: null },
  };

  if (skill) {
    where.sprint = { skill: { slug: skill } };
  }

  // Fetch up to 50 most recent attempts (enough for meaningful charts)
  const attempts = await prisma.sprintAttempt.findMany({
    where,
    orderBy: { completedAt: "asc" }, // oldest first for chart timeline
    take: 50,
    select: {
      id: true,
      totalScore: true,
      scores: true,
      completedAt: true,
      sprint: {
        select: {
          title: true,
          skill: { select: { name: true, slug: true } },
        },
      },
    },
  });

  if (attempts.length === 0) {
    return NextResponse.json({
      skill: skill ?? "all",
      dataPoints: [],
      summary: {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        improvementPercent: 0,
        firstAttemptScore: 0,
        latestAttemptScore: 0,
      },
    });
  }

  const dataPoints = attempts.map((a) => ({
    attemptId: a.id,
    completedAt: a.completedAt?.toISOString() ?? null,
    totalScore: Math.round(a.totalScore ?? 0),
    scores: (a.scores ?? {}) as DimensionScores,
    sprintTitle: a.sprint.title,
    skillName: a.sprint.skill.name,
  }));

  // Calculate summary stats
  const scores = dataPoints.map((d) => d.totalScore);
  const totalAttempts = scores.length;
  const averageScore = Math.round(scores.reduce((s, v) => s + v, 0) / totalAttempts);
  const bestScore = Math.max(...scores);
  const firstAttemptScore = scores[0];
  const latestAttemptScore = scores[scores.length - 1];
  const improvementPercent =
    firstAttemptScore > 0
      ? Math.round(((latestAttemptScore - firstAttemptScore) / firstAttemptScore) * 100)
      : 0;

  return NextResponse.json({
    skill: skill ?? "all",
    dataPoints,
    summary: {
      totalAttempts,
      averageScore,
      bestScore,
      improvementPercent,
      firstAttemptScore,
      latestAttemptScore,
    },
  });
}
