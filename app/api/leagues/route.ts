import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import { LEAGUE_TIERS } from "@/lib/gamification/constants";

export async function GET() {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find user's active league membership
  const membership = await prisma.leagueMembership.findFirst({
    where: {
      userId: user.id,
      leagueInstance: { isActive: true },
    },
    include: {
      leagueInstance: {
        include: {
          memberships: {
            orderBy: { weeklyXp: "desc" },
            include: {
              user: {
                select: { id: true, name: true, imageUrl: true, xp: true },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    // Calculate next Monday
    const now = new Date();
    const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7;
    const nextMonday = new Date(now);
    nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
    nextMonday.setUTCHours(0, 0, 0, 0);

    return NextResponse.json({
      status: "unassigned",
      tier: user.leagueTier,
      tierName: LEAGUE_TIERS[user.leagueTier]?.name ?? "Rookie",
      nextAssignment: nextMonday.toISOString(),
    });
  }

  const league = membership.leagueInstance;
  const tierConfig = LEAGUE_TIERS[league.tier];

  // Calculate user's rank
  const userRank =
    league.memberships.findIndex((m) => m.userId === user.id) + 1;

  // Determine zone (promote/safe/demote)
  const totalMembers = league.memberships.length;
  let zone: "promote" | "safe" | "demote" = "safe";
  if (userRank <= tierConfig.promoteTop) zone = "promote";
  else if (userRank > totalMembers - tierConfig.demoteBottom)
    zone = "demote";

  return NextResponse.json({
    status: "active",
    tier: league.tier,
    tierName: tierConfig.name,
    leagueInstanceId: league.id,
    weekStart: league.weekStart,
    weekEnd: league.weekEnd,
    rank: userRank,
    weeklyXp: membership.weeklyXp,
    totalMembers,
    zone,
    standings: league.memberships.map((m, i) => ({
      rank: i + 1,
      userId: m.user.id,
      name: m.user.name,
      imageUrl: m.user.imageUrl,
      weeklyXp: m.weeklyXp,
      totalXp: m.user.xp,
      isCurrentUser: m.userId === user.id,
    })),
  });
}
