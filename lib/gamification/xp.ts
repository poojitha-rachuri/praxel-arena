import { prisma } from "@/lib/db";
import {
  XP_SPRINT_BASE,
  XP_SPRINT_MAX,
  XP_DUEL_WIN_BONUS,
  XP_DAILY_FIRST_BONUS,
  XP_STREAK_MULTIPLIER,
  XP_STREAK_MULTIPLIER_THRESHOLD,
  levelFromXp,
  titleForLevel,
  STREAK_MILESTONES,
} from "./constants";
import type { SprintMode } from "@/app/generated/prisma/client";

export interface GamificationResult {
  xpAwarded: number;
  xpBreakdown: { source: string; amount: number }[];
  newLevel: number;
  leveledUp: boolean;
  newTitle: string;
  titleChanged: boolean;
  streakCount: number;
  streakMilestone: number | null;
}

/**
 * Process all gamification effects after a sprint/duel completion.
 * Called AFTER SprintAttempt + UserSkillScore are written.
 * Runs in its own transaction for atomicity.
 */
export async function processGamification(opts: {
  userId: string;
  mode: SprintMode;
  totalScore: number;
  isDuelWin?: boolean;
  skillId: string;
  sprintId: string;
  duelId?: string;
}): Promise<GamificationResult> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: opts.userId },
    });

    const xpBreakdown: { source: string; amount: number }[] = [];
    let totalXpEarned = 0;

    // 1. Base sprint XP (scaled by score 0-100)
    const baseMin = XP_SPRINT_BASE[opts.mode];
    const baseMax = XP_SPRINT_MAX[opts.mode];
    const scoreRatio = Math.max(0, Math.min(1, opts.totalScore / 100));
    const baseXp = Math.round(baseMin + (baseMax - baseMin) * scoreRatio);
    xpBreakdown.push({ source: "Sprint completion", amount: baseXp });
    totalXpEarned += baseXp;

    // 2. Duel win bonus
    if (opts.isDuelWin) {
      xpBreakdown.push({ source: "Duel victory", amount: XP_DUEL_WIN_BONUS });
      totalXpEarned += XP_DUEL_WIN_BONUS;
    }

    // 3. Daily first sprint bonus
    // Count uses === 1 because the current attempt is already written before processGamification runs
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayAttempts = await tx.sprintAttempt.count({
      where: {
        userId: opts.userId,
        completedAt: { gte: todayStart },
      },
    });
    if (todayAttempts === 1) {
      xpBreakdown.push({
        source: "Daily bonus",
        amount: XP_DAILY_FIRST_BONUS,
      });
      totalXpEarned += XP_DAILY_FIRST_BONUS;
    }

    // 4. Streak update
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const lastDate = user.lastActivityDate
      ? new Date(user.lastActivityDate)
      : null;
    let lastDay: Date | null = null;
    if (lastDate) {
      lastDay = new Date(lastDate);
      lastDay.setUTCHours(0, 0, 0, 0);
    }

    let newStreak = user.currentStreak;
    let streakMilestone: number | null = null;

    if (lastDay && lastDay.getTime() === today.getTime()) {
      // Same day  -  preserve current streak, no update needed
    } else if (!lastDay) {
      // First ever activity
      newStreak = 1;
    } else {
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);

      if (lastDay.getTime() === yesterday.getTime()) {
        newStreak = user.currentStreak + 1;
      } else {
        newStreak = 1; // streak broken
      }
    }

    if (STREAK_MILESTONES.includes(newStreak)) {
      streakMilestone = newStreak;
    }

    const newLongest = Math.max(user.longestStreak, newStreak);

    // 5. Streak multiplier (applied to base only)
    if (newStreak >= XP_STREAK_MULTIPLIER_THRESHOLD) {
      const streakBonus = Math.round(baseXp * (XP_STREAK_MULTIPLIER - 1));
      xpBreakdown.push({
        source: `${newStreak}-day streak bonus`,
        amount: streakBonus,
      });
      totalXpEarned += streakBonus;
    }

    // 6. Level check
    const newTotalXp = user.xp + totalXpEarned;
    const newLevel = levelFromXp(newTotalXp);
    const leveledUp = newLevel > user.level;
    const newTitle = titleForLevel(newLevel);
    const titleChanged = newTitle !== user.title;

    // 7. Atomic user update
    await tx.user.update({
      where: { id: opts.userId },
      data: {
        xp: { increment: totalXpEarned },
        weeklyXp: { increment: totalXpEarned },
        level: newLevel,
        title: newTitle,
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivityDate: new Date(),
      },
    });

    // 8. XP transaction log
    await tx.xpTransaction.create({
      data: {
        userId: opts.userId,
        amount: totalXpEarned,
        source: opts.isDuelWin ? "DUEL_WIN" : "SPRINT",
        metadata: {
          sprintId: opts.sprintId,
          duelId: opts.duelId,
          mode: opts.mode,
          score: opts.totalScore,
          breakdown: xpBreakdown,
        },
      },
    });

    // 9. League weekly XP (update if active membership exists)
    const activeMembership = await tx.leagueMembership.findFirst({
      where: {
        userId: opts.userId,
        leagueInstance: { isActive: true },
      },
    });
    if (activeMembership) {
      await tx.leagueMembership.update({
        where: { id: activeMembership.id },
        data: { weeklyXp: { increment: totalXpEarned } },
      });
    }

    return {
      xpAwarded: totalXpEarned,
      xpBreakdown,
      newLevel,
      leveledUp,
      newTitle,
      titleChanged,
      streakCount: newStreak,
      streakMilestone,
    };
  });
}
