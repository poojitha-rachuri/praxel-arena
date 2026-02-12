import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import { LEAGUE_TIERS } from "@/lib/gamification/constants";

export async function GET(request: NextRequest) {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const leagueInstanceId = searchParams.get("leagueInstanceId");

  if (!leagueInstanceId) {
    return NextResponse.json(
      { error: "leagueInstanceId is required" },
      { status: 400 }
    );
  }

  const league = await prisma.leagueInstance.findUnique({
    where: { id: leagueInstanceId },
    include: {
      memberships: {
        orderBy: [{ weeklyXp: "desc" }],
        include: {
          user: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              xp: true,
              level: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!league) {
    return NextResponse.json(
      { error: "League not found" },
      { status: 404 }
    );
  }

  const tierConfig = LEAGUE_TIERS[league.tier];
  const totalMembers = league.memberships.length;

  // Sort with tiebreaker (weeklyXp DESC, then totalXp DESC)
  const sorted = [...league.memberships].sort((a, b) => {
    if (b.weeklyXp !== a.weeklyXp) return b.weeklyXp - a.weeklyXp;
    return b.user.xp - a.user.xp;
  });

  return NextResponse.json({
    league: {
      id: league.id,
      tier: league.tier,
      tierName: tierConfig.name,
      weekStart: league.weekStart,
      weekEnd: league.weekEnd,
      isActive: league.isActive,
    },
    standings: sorted.map((m, i) => {
      const rank = i + 1;
      let zone: "promote" | "safe" | "demote" = "safe";
      if (rank <= tierConfig.promoteTop) zone = "promote";
      else if (rank > totalMembers - tierConfig.demoteBottom) zone = "demote";

      return {
        rank,
        userId: m.user.id,
        name: m.user.name,
        imageUrl: m.user.imageUrl,
        weeklyXp: m.weeklyXp,
        totalXp: m.user.xp,
        level: m.user.level,
        title: m.user.title,
        zone,
        promoted: m.promoted,
        demoted: m.demoted,
        isCurrentUser: m.userId === user.id,
      };
    }),
  });
}
