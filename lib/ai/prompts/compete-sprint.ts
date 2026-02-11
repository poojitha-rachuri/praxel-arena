import { SPRINT_INTERACTIONS_COUNT } from "@/lib/utils/constants";
import { SCORING_DIMENSIONS } from "@/lib/scoring/dimensions";

const COMPETE_SEQUENCE = [
  "SPOT_THE_SIGNAL",
  "SPOT_THE_SIGNAL",
  "FILL_THE_GAP",
  "FORCED_TRADEOFF",
  "RANK_AND_PRIORITIZE",
  "FILL_THE_GAP",
  "CURVEBALL",
  "FORCED_TRADEOFF",
] as const;

const DIFFICULTY_GUIDANCE: Record<number, string> = {
  1: "Use clear, unambiguous data signals. Correct answers should be identifiable by anyone with basic business literacy. Distractors are plausible but clearly inferior upon reflection.",
  2: "Data signals are mostly clear but include one mild red herring. Correct answers require domain familiarity. Distractors are reasonable but flawed on closer inspection.",
  3: "Present genuinely ambiguous situations where two options are defensible. Require weighing incomplete information. Include realistic noise in data. Best answer requires nuanced reasoning.",
  4: "Data contains contradictory signals that must be reconciled. Multiple options appear equally valid on the surface. Correct answers require synthesizing across interactions. Tradeoffs have no clean resolution.",
  5: "Present contradictory data from credible sources. Every option has significant drawbacks. Correct answers require comfort with uncertainty and the ability to reason through paradox. Expect expert-level pattern recognition.",
};

export function buildCompeteSprintPrompt(
  skillName: string,
  skillDescription: string,
  difficulty: number,
  playerEloAvg: number
): { system: string; user: string } {
  const clampedDifficulty = Math.max(1, Math.min(5, Math.round(difficulty)));
  const dimensionList = SCORING_DIMENSIONS.map(
    (d) => `- ${d.label}: ${d.description}`
  ).join("\n");

  const system = `You are Praxel, a business scenario engine for a competitive assessment platform. Your role is to generate realistic, challenging business micro-scenarios that differentiate skilled professionals from novices.

CORE PRINCIPLES:
- Every scenario must feel like a real business moment a professional would encounter
- Use realistic company names, metrics, market dynamics, and industry terminology
- Wrong answers must be plausible -- a junior professional might genuinely choose them
- The 8 interactions must tell a COHERENT business story (same company/situation evolving)
- Each interaction prompt must be completable in 10-30 seconds (max 3 sentences)
- Options must be concise (max 15 words each)

SCORING DIMENSIONS (the 6 axes being assessed):
${dimensionList}

Each interaction should primarily test 1-2 dimensions but may tangentially touch others.

INTERACTION TYPE RULES:
1. SPOT_THE_SIGNAL: Present a data point, metric, or market signal. 4 options. One correct interpretation, one "insight" answer that shows deeper understanding. Time: 10s.
2. FILL_THE_GAP: A sentence with a blank (marked as ___). 4 options to complete it. Tests domain vocabulary or conceptual understanding. Time: 10s.
3. FORCED_TRADEOFF: A strategic decision with no perfect answer. 4 options, each with explicit tradeoffs. correctAnswer is the best choice; insightAnswer explains the strategic reasoning. Time: 15-20s.
4. RANK_AND_PRIORITIZE: Present 4 items that must be ordered by priority/impact/urgency. correctAnswer is a comma-separated list of option IDs in the right order (e.g., "c,a,d,b"). Time: 15-25s.
5. CURVEBALL: Like FORCED_TRADEOFF but with a twist -- new information that changes the calculus. MUST reference a choice or context from interaction 4 or 5. Include priorContext field referencing that earlier interaction. Time: 15-20s.

DIFFICULTY CALIBRATION (current level: ${clampedDifficulty}/5):
${DIFFICULTY_GUIDANCE[clampedDifficulty]}

Player average Elo: ${playerEloAvg}. ${playerEloAvg >= 1600 ? "This is a strong player -- push harder." : playerEloAvg <= 1000 ? "This player is developing -- keep signals clearer." : "Standard calibration."}

OUTPUT FORMAT:
Return a single JSON object with this exact structure. No markdown, no commentary, just JSON.`;

  const user = `Generate a competitive sprint for the skill "${skillName}" (${skillDescription}).

The sprint must contain exactly ${SPRINT_INTERACTIONS_COUNT} interactions following this exact type sequence:
${COMPETE_SEQUENCE.map((type, i) => `  ${i + 1}. ${type}`).join("\n")}

Return JSON in this exact format:
{
  "title": "A compelling 3-6 word sprint title",
  "interactions": [
    {
      "type": "${COMPETE_SEQUENCE[0]}",
      "order": 1,
      "prompt": "The scenario text (max 3 sentences)",
      "options": [
        { "id": "a", "text": "Option A text" },
        { "id": "b", "text": "Option B text" },
        { "id": "c", "text": "Option C text" },
        { "id": "d", "text": "Option D text" }
      ],
      "correctAnswer": "a",
      "insightAnswer": "Brief explanation of the best reasoning (1-2 sentences)",
      "timeTarget": 10
    },
    {
      "type": "${COMPETE_SEQUENCE[1]}",
      "order": 2,
      "prompt": "...",
      "options": [...],
      "correctAnswer": "b",
      "insightAnswer": "...",
      "timeTarget": 10
    },
    {
      "type": "FILL_THE_GAP",
      "order": 3,
      "prompt": "A sentence with ___ as the blank to fill",
      "options": [...],
      "correctAnswer": "c",
      "insightAnswer": "...",
      "timeTarget": 10
    },
    {
      "type": "FORCED_TRADEOFF",
      "order": 4,
      "prompt": "A strategic decision scenario",
      "options": [...],
      "correctAnswer": "a",
      "insightAnswer": "Why this tradeoff is optimal",
      "timeTarget": 20
    },
    {
      "type": "RANK_AND_PRIORITIZE",
      "order": 5,
      "prompt": "Rank these 4 items by [criteria]",
      "options": [...],
      "correctAnswer": "b,d,a,c",
      "insightAnswer": "The reasoning behind this prioritization",
      "timeTarget": 25
    },
    {
      "type": "FILL_THE_GAP",
      "order": 6,
      "prompt": "Another fill-in sentence with ___",
      "options": [...],
      "correctAnswer": "d",
      "insightAnswer": "...",
      "timeTarget": 10
    },
    {
      "type": "CURVEBALL",
      "order": 7,
      "prompt": "New information emerges that changes the situation from interaction 4 or 5...",
      "options": [...],
      "correctAnswer": "b",
      "insightAnswer": "How this new info changes the optimal strategy",
      "priorContext": "References the choice context from interaction 4 or 5",
      "timeTarget": 20
    },
    {
      "type": "FORCED_TRADEOFF",
      "order": 8,
      "prompt": "Final strategic decision that ties the story together",
      "options": [...],
      "correctAnswer": "c",
      "insightAnswer": "...",
      "timeTarget": 20
    }
  ]
}

CRITICAL REQUIREMENTS:
- All 8 interactions must form a coherent business narrative (same company/scenario)
- Each interaction's prompt must be max 3 sentences
- Each option text must be max 15 words
- correctAnswer must be one of the option IDs ("a", "b", "c", or "d")
- For RANK_AND_PRIORITIZE, correctAnswer is comma-separated option IDs in correct order
- CURVEBALL interaction 7 MUST include priorContext referencing interaction 4 or 5
- insightAnswer explains the deeper reasoning, not just the answer
- Difficulty level: ${clampedDifficulty}/5
- Every option must be plausible to someone unfamiliar with the domain`;

  return { system, user };
}
