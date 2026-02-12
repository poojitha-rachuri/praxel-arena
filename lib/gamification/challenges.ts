import { CHALLENGE_XP_DECAY } from "./constants";

export interface ChallengeTemplate {
  id: string;
  type: "SPEED_ROUND" | "SCORE_ATTACK";
  name: string;
  description: string;
  config: {
    interactionCount?: number;
    timeLimitMs: number;
    accuracyThreshold?: number;
    difficulty?: number;
  };
  rewardXpFirst: number;
  rewardXpTenth: number;
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  // Speed Rounds
  {
    id: "quick-fire",
    type: "SPEED_ROUND",
    name: "Quick Fire",
    description: "Answer 20 interactions in 5 minutes. Speed + accuracy wins.",
    config: {
      interactionCount: 20,
      timeLimitMs: 300_000,
      accuracyThreshold: 0.7,
    },
    rewardXpFirst: 250,
    rewardXpTenth: 50,
  },
  {
    id: "skill-sprint",
    type: "SPEED_ROUND",
    name: "Skill Sprint",
    description: "15 interactions in 4 minutes on a featured skill.",
    config: {
      interactionCount: 15,
      timeLimitMs: 240_000,
      accuracyThreshold: 0.7,
    },
    rewardXpFirst: 200,
    rewardXpTenth: 50,
  },
  {
    id: "accuracy-blitz",
    type: "SPEED_ROUND",
    name: "Accuracy Blitz",
    description: "10 interactions in 3 minutes. 90% accuracy required.",
    config: {
      interactionCount: 10,
      timeLimitMs: 180_000,
      accuracyThreshold: 0.9,
    },
    rewardXpFirst: 250,
    rewardXpTenth: 75,
  },
  {
    id: "marathon",
    type: "SPEED_ROUND",
    name: "Marathon",
    description: "40 interactions in 10 minutes. Endurance test across skills.",
    config: {
      interactionCount: 40,
      timeLimitMs: 600_000,
      accuracyThreshold: 0.7,
    },
    rewardXpFirst: 250,
    rewardXpTenth: 50,
  },
  {
    id: "lightning",
    type: "SPEED_ROUND",
    name: "Lightning Round",
    description: "8 advanced interactions in 2 minutes. No margin for error.",
    config: {
      interactionCount: 8,
      timeLimitMs: 120_000,
      accuracyThreshold: 0.7,
      difficulty: 3,
    },
    rewardXpFirst: 200,
    rewardXpTenth: 50,
  },
  // Score Attacks
  {
    id: "daily-spotlight",
    type: "SCORE_ATTACK",
    name: "Daily Spotlight",
    description: "Beat the high score on today's featured sprint.",
    config: { timeLimitMs: 300_000 },
    rewardXpFirst: 300,
    rewardXpTenth: 75,
  },
  {
    id: "weekly-master",
    type: "SCORE_ATTACK",
    name: "Weekly Master",
    description: "Advanced difficulty, highest score wins. Resets weekly.",
    config: { timeLimitMs: 300_000, difficulty: 3 },
    rewardXpFirst: 300,
    rewardXpTenth: 75,
  },
  {
    id: "perfect-run",
    type: "SCORE_ATTACK",
    name: "Perfect Run",
    description: "Aim for 100% accuracy. Bonus XP for perfection.",
    config: { timeLimitMs: 300_000 },
    rewardXpFirst: 250,
    rewardXpTenth: 50,
  },
  {
    id: "dimension-focus",
    type: "SCORE_ATTACK",
    name: "Dimension Focus",
    description: "Score highest on the featured dimension this week.",
    config: { timeLimitMs: 300_000 },
    rewardXpFirst: 250,
    rewardXpTenth: 50,
  },
];

/** Calculate XP reward for a given rank (1-indexed). Exponential decay. */
export function challengeXpForRank(
  rank: number,
  maxXp: number,
  minXp: number
): number {
  if (rank <= 0) return 0;
  if (rank > 10) return minXp;
  return Math.max(
    minXp,
    Math.floor(maxXp * Math.pow(CHALLENGE_XP_DECAY, rank - 1))
  );
}
