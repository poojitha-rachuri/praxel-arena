import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const skillSlug = searchParams.get("skillSlug");

  if (!skillSlug) {
    return NextResponse.json(
      { error: "skillSlug is required" },
      { status: 400 }
    );
  }

  try {
    const skill = await prisma.skill.findUnique({
      where: { slug: skillSlug },
    });

    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Read directly from UserEloRating (the source of truth for Elo)
    const eloEntries = await prisma.userEloRating.findMany({
      where: { skillId: skill.id },
      orderBy: { rating: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    const ranked = eloEntries.map((entry, index) => ({
      rank: index + 1,
      eloRating: entry.rating,
      userId: entry.user.id,
      name: entry.user.name,
      imageUrl: entry.user.imageUrl,
      matchCount: entry.matchCount,
    }));

    return NextResponse.json({
      skill: {
        id: skill.id,
        name: skill.name,
        slug: skill.slug,
        icon: skill.icon,
      },
      entries: ranked,
    });
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
