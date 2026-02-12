import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import type { Prisma } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 50);

  // Build where clause with Prisma generated types
  const where: Prisma.SprintAttemptWhereInput = {
    userId: user.id,
    completedAt: { not: null },
  };

  // Cursor pagination: cursor format is "completedAt_id"
  if (cursor) {
    const separatorIndex = cursor.lastIndexOf("_");
    if (separatorIndex > 0) {
      const cursorDateStr = cursor.substring(0, separatorIndex);
      const cursorId = cursor.substring(separatorIndex + 1);
      const cursorDate = new Date(cursorDateStr);

      if (isNaN(cursorDate.getTime())) {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }

      // Compound cursor: use both completedAt and id for tiebreaking
      where.OR = [
        { completedAt: { lt: cursorDate } },
        { completedAt: cursorDate, id: { lt: cursorId } },
      ];
    }
  }

  try {
    const attempts = await prisma.sprintAttempt.findMany({
      where,
      orderBy: [{ completedAt: "desc" }, { id: "desc" }],
      take: limit + 1, // +1 to detect hasMore
      select: {
        id: true,
        mode: true,
        totalScore: true,
        completedAt: true,
        sprint: {
          select: {
            title: true,
            skill: { select: { name: true, slug: true, icon: true } },
          },
        },
      },
    });

    const hasMore = attempts.length > limit;
    const results = hasMore ? attempts.slice(0, limit) : attempts;

    // Build next cursor from last item
    let nextCursor: string | null = null;
    if (hasMore && results.length > 0) {
      const last = results[results.length - 1];
      if (last.completedAt) {
        nextCursor = `${last.completedAt.toISOString()}_${last.id}`;
      }
    }

    return NextResponse.json({
      attempts: results.map((a) => ({
        id: a.id,
        sprintTitle: a.sprint.title,
        skillName: a.sprint.skill.name,
        skillSlug: a.sprint.skill.slug,
        skillIcon: a.sprint.skill.icon,
        mode: a.mode,
        totalScore: Math.round(a.totalScore ?? 0),
        completedAt: a.completedAt?.toISOString() ?? null,
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("Failed to fetch attempts:", error);
    return NextResponse.json(
      { error: "Failed to fetch attempts" },
      { status: 500 }
    );
  }
}
