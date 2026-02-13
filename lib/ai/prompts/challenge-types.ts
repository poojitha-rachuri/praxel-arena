// Per-type challenge descriptions for the UI cards
export const CHALLENGE_TYPE_CONFIG = {
  MOCK_INTERVIEW: {
    title: "Mock Interview",
    description: "Face a senior interviewer who tests your reasoning under pressure.",
    icon: "Briefcase" as const,
    estimatedMinutes: 2,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  SCENARIO_DRILL: {
    title: "Scenario Drill",
    description: "Navigate a high-stakes business crisis with escalating plot twists.",
    icon: "Flame" as const,
    estimatedMinutes: 2,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  SOCRATIC_COACHING: {
    title: "Socratic Coaching",
    description: "A thoughtful mentor uses probing questions to deepen your understanding.",
    icon: "Lightbulb" as const,
    estimatedMinutes: 2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
} as const;

export type AIChallengeTypeName = keyof typeof CHALLENGE_TYPE_CONFIG;
