// ─── XP Economy (Moderate) ──────────────────────────────

import type { SprintMode } from "@/app/generated/prisma/client";

export const XP_SPRINT_BASE: Record<SprintMode, number> = {
  LEARN: 25,
  PRACTICE: 30,
  COMPETE: 40,
};
export const XP_SPRINT_MAX: Record<SprintMode, number> = {
  LEARN: 50,
  PRACTICE: 60,
  COMPETE: 75,
};
export const XP_DUEL_WIN_BONUS = 100;
export const XP_DAILY_FIRST_BONUS = 25;
export const XP_STREAK_MULTIPLIER = 1.5;
export const XP_STREAK_MULTIPLIER_THRESHOLD = 7; // days

// ─── Level Curve ────────────────────────────────────────

/** XP required to reach level n: floor(100 * n^1.5) */
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/** Calculate level from total XP */
export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

// ─── Titles ─────────────────────────────────────────────

export const LEVEL_TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 1, title: "Intern" },
  { minLevel: 5, title: "Analyst" },
  { minLevel: 10, title: "Associate" },
  { minLevel: 15, title: "Manager" },
  { minLevel: 20, title: "Senior Manager" },
  { minLevel: 25, title: "Director" },
  { minLevel: 30, title: "VP" },
  { minLevel: 40, title: "SVP" },
  { minLevel: 50, title: "C-Suite" },
];

export function titleForLevel(level: number): string {
  for (let i = LEVEL_TITLES.length - 1; i >= 0; i--) {
    if (level >= LEVEL_TITLES[i].minLevel) return LEVEL_TITLES[i].title;
  }
  return "Intern";
}

// ─── Streaks ────────────────────────────────────────────

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

// ─── Leagues ────────────────────────────────────────────

export const LEAGUE_TIERS = [
  { tier: 0, name: "Rookie", promoteTop: 30, demoteBottom: 0 },
  { tier: 1, name: "Analyst", promoteTop: 10, demoteBottom: 0 },
  { tier: 2, name: "Consultant", promoteTop: 10, demoteBottom: 5 },
  { tier: 3, name: "Director", promoteTop: 10, demoteBottom: 5 },
  { tier: 4, name: "VP", promoteTop: 10, demoteBottom: 5 },
  { tier: 5, name: "C-Suite", promoteTop: 5, demoteBottom: 5 },
  { tier: 6, name: "Board", promoteTop: 3, demoteBottom: 5 },
  { tier: 7, name: "Chairman", promoteTop: 0, demoteBottom: 3 },
];

export const LEAGUE_GROUP_SIZE = 30;
export const LEAGUE_MIN_GROUP_SIZE = 10;

export const LEAGUE_COMPLETION_XP = [100, 200, 300, 400, 500, 600, 700, 800];

// ─── Elo Seasons ────────────────────────────────────────

export const SEASON_RESET_FACTOR = 0.75;

// ─── Credentials ────────────────────────────────────────

export const CREDENTIAL_THRESHOLDS = [
  { type: "PRACTITIONER" as const, elo: 1500, label: "Certified Practitioner" },
  { type: "EXPERT" as const, elo: 1800, label: "Expert" },
  { type: "MASTER" as const, elo: 2000, label: "Master" },
  { type: "GRANDMASTER" as const, elo: 2200, label: "Grandmaster" },
];

// ─── Challenges ─────────────────────────────────────────

export const CHALLENGE_XP_DECAY = 0.85;
