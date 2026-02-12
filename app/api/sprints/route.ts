import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import type { SprintMode, Prisma } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const skillSlug = searchParams.get("skillSlug");
  const mode = searchParams.get("mode") as SprintMode | null;

  if (!skillSlug) {
    return NextResponse.json(
      { error: "skillSlug is required" },
      { status: 400 }
    );
  }

  if (!mode || !["LEARN", "PRACTICE", "COMPETE"].includes(mode)) {
    return NextResponse.json(
      { error: "mode must be LEARN, PRACTICE, or COMPETE" },
      { status: 400 }
    );
  }

  try {

    // Look up skill
    const skill = await prisma.skill.findUnique({
      where: { slug: skillSlug },
    });
    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Build query filter
    const where: Prisma.SprintWhereInput = {
      skillId: skill.id,
      mode,
      ...(mode === "LEARN" ? { isGenerated: false } : {}),
    };

    const sprints = await prisma.sprint.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        level: true,
        levelLabel: true,
        order: true,
        _count: { select: { interactions: true } },
      },
      orderBy: [{ level: "asc" }, { order: "asc" }, { createdAt: "asc" }],
    });

    // Group by level for structured response
    const levels: { level: number; label: string; sprints: typeof sprints }[] = [];
    const levelMap = new Map<number, (typeof levels)[number]>();

    for (const sprint of sprints) {
      if (!levelMap.has(sprint.level)) {
        const entry = {
          level: sprint.level,
          label: sprint.levelLabel ?? `Level ${sprint.level}`,
          sprints: [] as typeof sprints,
        };
        levelMap.set(sprint.level, entry);
        levels.push(entry);
      }
      levelMap.get(sprint.level)!.sprints.push(sprint);
    }

    return NextResponse.json({ levels });
  } catch (error) {
    console.error("Failed to fetch sprints:", error);
    return NextResponse.json(
      { error: "Failed to fetch sprints" },
      { status: 500 }
    );
  }
}
