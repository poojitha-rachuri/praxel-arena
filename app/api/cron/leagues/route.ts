import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  LEAGUE_TIERS,
  LEAGUE_GROUP_SIZE,
  LEAGUE_MIN_GROUP_SIZE,
  LEAGUE_COMPLETION_XP,
} from "@/lib/gamification/constants";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // ── Step 1: Finalize last week's leagues ──

  const activeLeagues = await prisma.leagueInstance.findMany({
    where: { isActive: true },
    include: {
      memberships: {
        orderBy: { weeklyXp: "desc" },
        include: {
          user: { select: { id: true, xp: true, leagueTier: true } },
        },
      },
    },
  });

  let promotedCount = 0;
  let demotedCount = 0;

  for (const league of activeLeagues) {
    const tierConfig = LEAGUE_TIERS[league.tier];
    if (!tierConfig) continue;

    // Sort with tiebreaker
    const sorted = [...league.memberships].sort((a, b) => {
      if (b.weeklyXp !== a.weeklyXp) return b.weeklyXp - a.weeklyXp;
      return b.user.xp - a.user.xp;
    });

    const total = sorted.length;

    // Calculate ranks and promotion/demotion in-memory, then batch write
    const completionXp = LEAGUE_COMPLETION_XP[league.tier] ?? 100;
    const memberUpdates: { id: string; finalRank: number; promoted: boolean; demoted: boolean }[] = [];
    const userUpdates: { userId: string; newTier: number }[] = [];

    for (let i = 0; i < total; i++) {
      const member = sorted[i];
      const rank = i + 1;
      let promoted = false;
      let demoted = false;

      if (league.tier === 0) {
        if (member.weeklyXp > 0) {
          promoted = true;
          promotedCount++;
        }
      } else {
        if (rank <= tierConfig.promoteTop && tierConfig.promoteTop > 0) {
          promoted = true;
          promotedCount++;
        } else if (
          rank > total - tierConfig.demoteBottom &&
          tierConfig.demoteBottom > 0
        ) {
          demoted = true;
          demotedCount++;
        }
      }

      const newTier = promoted
        ? Math.min(member.user.leagueTier + 1, 7)
        : demoted
          ? Math.max(member.user.leagueTier - 1, 1)
          : member.user.leagueTier;

      memberUpdates.push({ id: member.id, finalRank: rank, promoted, demoted });
      userUpdates.push({ userId: member.userId, newTier });
    }

    // Batch: update memberships, users, and create XP transactions
    await prisma.$transaction([
      ...memberUpdates.map((m) =>
        prisma.leagueMembership.update({
          where: { id: m.id },
          data: { finalRank: m.finalRank, promoted: m.promoted, demoted: m.demoted },
        })
      ),
      ...userUpdates.map((u) =>
        prisma.user.update({
          where: { id: u.userId },
          data: { leagueTier: u.newTier, xp: { increment: completionXp } },
        })
      ),
      prisma.xpTransaction.createMany({
        data: userUpdates.map((u, i) => ({
          userId: u.userId,
          amount: completionXp,
          source: "LEAGUE_REWARD" as const,
          metadata: {
            leagueInstanceId: league.id,
            tier: league.tier,
            rank: memberUpdates[i].finalRank,
            promoted: memberUpdates[i].promoted,
            demoted: memberUpdates[i].demoted,
          },
        })),
      }),
    ]);

    // Deactivate league
    await prisma.leagueInstance.update({
      where: { id: league.id },
      data: { isActive: false },
    });
  }

  // ── Step 2: Create new league instances ──

  // Reset all users' weeklyXp
  await prisma.user.updateMany({
    data: { weeklyXp: 0 },
  });

  // Group users by tier
  const allUsers = await prisma.user.findMany({
    where: { onboardingComplete: true },
    select: { id: true, leagueTier: true },
    orderBy: { leagueTier: "asc" },
  });

  const tierGroups = new Map<number, string[]>();
  for (const user of allUsers) {
    const tier = user.leagueTier;
    if (!tierGroups.has(tier)) tierGroups.set(tier, []);
    tierGroups.get(tier)!.push(user.id);
  }

  // Monday-to-Sunday for the new week
  const weekStart = new Date(now);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  let leaguesCreated = 0;

  for (const [tier, userIds] of tierGroups) {
    // Fisher-Yates shuffle for uniform randomness
    const shuffled = [...userIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Split into groups
    const groups: string[][] = [];
    for (let i = 0; i < shuffled.length; i += LEAGUE_GROUP_SIZE) {
      groups.push(shuffled.slice(i, i + LEAGUE_GROUP_SIZE));
    }

    // Merge small remainder with previous group
    if (
      groups.length > 1 &&
      groups[groups.length - 1].length < LEAGUE_MIN_GROUP_SIZE
    ) {
      const remainder = groups.pop()!;
      groups[groups.length - 1].push(...remainder);
    }

    // Create league instances and memberships
    for (const group of groups) {
      const league = await prisma.leagueInstance.create({
        data: {
          tier,
          weekStart,
          weekEnd,
          isActive: true,
        },
      });

      await prisma.leagueMembership.createMany({
        data: group.map((userId) => ({
          userId,
          leagueInstanceId: league.id,
        })),
      });

      leaguesCreated++;
    }
  }

  return NextResponse.json({
    finalized: activeLeagues.length,
    promoted: promotedCount,
    demoted: demotedCount,
    leaguesCreated,
    usersAssigned: allUsers.length,
  });
}
