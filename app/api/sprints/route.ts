import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import type { SprintMode } from "@/app/generated/prisma/client";

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
    const where: Record<string, unknown> = {
      skillId: skill.id,
      mode,
    };

    // For LEARN mode, only return static (non-generated) sprints
    if (mode === "LEARN") {
      where.isGenerated = false;
    }

    const sprints = await prisma.sprint.findMany({
      where,
      include: {
        interactions: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ sprints });
  } catch (error) {
    console.error("Failed to fetch sprints:", error);
    return NextResponse.json(
      { error: "Failed to fetch sprints" },
      { status: 500 }
    );
  }
}
