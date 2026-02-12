import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/auth/ensure-user";
import {
  xpForLevel,
  titleForLevel,
  LEAGUE_TIERS,
  STREAK_MILESTONES,
} from "@/lib/gamification/constants";

/**
 * GET /api/gamification
 * Returns the current user's full gamification state.
 * Used by Navbar, Profile, and other components.
 */
export async function GET() {
  const user = await ensureUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentLevelXp = xpForLevel(user.level);
  const nextLevelXp = xpForLevel(user.level + 1);
  const xpProgress = Math.max(0, user.xp - currentLevelXp);
  const xpNeeded = nextLevelXp - currentLevelXp;

  const tierConfig = LEAGUE_TIERS[user.leagueTier];

  // Get credentials
  const credentials = await prisma.credential.findMany({
    where: { userId: user.id },
    include: { skill: { select: { name: true, slug: true, icon: true } } },
    orderBy: { grantedAt: "desc" },
  });

  // Get recent XP transactions
  const recentXp = await prisma.xpTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Next streak milestone
  const nextMilestone = STREAK_MILESTONES.find(
    (m) => m > user.currentStreak
  );

  return NextResponse.json({
    xp: user.xp,
    level: user.level,
    title: user.title,
    xpProgress,
    xpNeeded,
    progressPercent: xpNeeded > 0 ? Math.round((xpProgress / xpNeeded) * 100) : 100,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastActivityDate: user.lastActivityDate,
    nextStreakMilestone: nextMilestone ?? null,
    leagueTier: user.leagueTier,
    leagueTierName: tierConfig?.name ?? "Rookie",
    weeklyXp: user.weeklyXp,
    credentials: credentials.map((c) => ({
      id: c.id,
      type: c.type,
      skillName: c.skill.name,
      skillSlug: c.skill.slug,
      skillIcon: c.skill.icon,
      eloAtGrant: c.eloAtGrant,
      grantedAt: c.grantedAt,
      verificationCode: c.verificationCode,
    })),
    recentXp: recentXp.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      source: tx.source,
      metadata: tx.metadata,
      createdAt: tx.createdAt,
    })),
  });
}
