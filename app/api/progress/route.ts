import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import type { Prisma } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const skill = request.nextUrl.searchParams.get("skill");

  // Build where clause with Prisma generated types
  const where: Prisma.SprintAttemptWhereInput = {
    userId: user.id,
    completedAt: { not: null },
  };

  if (skill) {
    where.sprint = { skill: { slug: skill } };
  }

  try {
    // Fetch newest 50 attempts, then reverse for chronological chart order
    const attempts = await prisma.sprintAttempt.findMany({
      where,
      orderBy: { completedAt: "desc" },
      take: 50,
      select: {
        id: true,
        totalScore: true,
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
        },
      });
    }

    // Reverse to oldest-first for chart x-axis
    attempts.reverse();

    const dataPoints = attempts.map((a) => ({
      attemptId: a.id,
      completedAt: a.completedAt?.toISOString() ?? null,
      totalScore: Math.round(a.totalScore ?? 0),
      sprintTitle: a.sprint.title,
      skillName: a.sprint.skill.name,
    }));

    // Calculate summary stats
    const scores = dataPoints.map((d) => d.totalScore);
    const totalAttempts = scores.length;
    const averageScore = Math.round(
      scores.reduce((s, v) => s + v, 0) / totalAttempts
    );
    const bestScore = Math.max(...scores);
    const firstScore = scores[0];
    const latestScore = scores[scores.length - 1];
    const improvementPercent =
      firstScore > 0
        ? Math.round(((latestScore - firstScore) / firstScore) * 100)
        : 0;

    return NextResponse.json({
      skill: skill ?? "all",
      dataPoints,
      summary: {
        totalAttempts,
        averageScore,
        bestScore,
        improvementPercent,
      },
    });
  } catch (error) {
    console.error("Failed to fetch progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
