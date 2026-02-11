import { SPRINT_INTERACTIONS_COUNT } from "@/lib/utils/constants";
import { SCORING_DIMENSIONS } from "@/lib/scoring/dimensions";

const PRACTICE_SEQUENCE = [
  "SPOT_THE_SIGNAL",
  "FILL_THE_GAP",
  "FORCED_TRADEOFF",
  "SPOT_THE_SIGNAL",
  "RANK_AND_PRIORITIZE",
  "FORCED_TRADEOFF",
  "CURVEBALL",
  "FILL_THE_GAP",
] as const;

const DIFFICULTY_GUIDANCE: Record<number, string> = {
  1: "Straightforward scenarios with clear best answers. Good for building confidence after learning. Distractors are obviously weaker upon basic analysis.",
  2: "Scenarios require applying learned concepts. One distractor per question is particularly tempting. Data signals are clear but context matters.",
  3: "Realistic ambiguity. Two options are defensible in most questions. Requires integrating multiple concepts. Data has some noise.",
  4: "Complex scenarios with incomplete information. Best answers require synthesizing across the sprint narrative. Tradeoffs are genuinely difficult.",
  5: "Expert-level scenarios. Contradictory signals, high-stakes tradeoffs, and time pressure combine. Optimal answers require deep domain expertise and comfort with uncertainty.",
};

export function buildPracticeSprintPrompt(
  skillName: string,
  skillDescription: string,
  difficulty: number
): { system: string; user: string } {
  const clampedDifficulty = Math.max(1, Math.min(5, Math.round(difficulty)));
  const dimensionList = SCORING_DIMENSIONS.map(
    (d) => `- ${d.label}: ${d.description}`
  ).join("\n");

  const system = `You are Praxel, a business scenario engine that creates practice assessments. Practice sprints are harder than learning modules but lower stakes than competitive duels. They help professionals sharpen skills through realistic application.

CORE PRINCIPLES:
- Use a mix of interaction types (NO TEACH_AND_TEST -- this is practice, not learning)
- Every scenario must feel like a real business moment
- Use realistic company names, metrics, market dynamics
- Wrong answers must be plausible to someone still developing this skill
- The 8 interactions should form a coherent business narrative
- Each interaction prompt: max 3 sentences, completable in 10-25 seconds
- Options: max 15 words each

SCORING DIMENSIONS:
${dimensionList}

INTERACTION TYPE RULES:
1. SPOT_THE_SIGNAL: Present data/metrics. 4 options. One correct interpretation, one insight answer. Time: 10s.
2. FILL_THE_GAP: Sentence with ___ blank. 4 options. Tests vocabulary/concepts. Time: 10s.
3. FORCED_TRADEOFF: Strategic decision, no perfect answer. 4 options with tradeoffs. Time: 15-20s.
4. RANK_AND_PRIORITIZE: 4 items to order by criteria. correctAnswer is comma-separated IDs in order. Time: 15-25s.
5. CURVEBALL: Like FORCED_TRADEOFF but with new information changing the calculus. Must reference interaction 3 or 5. Requires priorContext field. Time: 15-20s.

DIFFICULTY CALIBRATION (level ${clampedDifficulty}/5):
${DIFFICULTY_GUIDANCE[clampedDifficulty]}

OUTPUT FORMAT:
Return a single JSON object. No markdown, no commentary, just valid JSON.`;

  const user = `Generate a PRACTICE mode sprint for the skill "${skillName}" (${skillDescription}).

Difficulty: ${clampedDifficulty}/5

The sprint must contain exactly ${SPRINT_INTERACTIONS_COUNT} interactions following this type sequence:
${PRACTICE_SEQUENCE.map((type, i) => `  ${i + 1}. ${type}`).join("\n")}

Return JSON in this exact format:
{
  "title": "A compelling 3-6 word practice title",
  "interactions": [
    {
      "type": "${PRACTICE_SEQUENCE[0]}",
      "order": 1,
      "prompt": "Scenario text (max 3 sentences)",
      "options": [
        { "id": "a", "text": "Option A" },
        { "id": "b", "text": "Option B" },
        { "id": "c", "text": "Option C" },
        { "id": "d", "text": "Option D" }
      ],
      "correctAnswer": "a",
      "insightAnswer": "Deeper reasoning explanation (1-2 sentences)",
      "timeTarget": 10
    },
    {
      "type": "FILL_THE_GAP",
      "order": 2,
      "prompt": "Sentence with ___ blank",
      "options": [...],
      "correctAnswer": "c",
      "insightAnswer": "...",
      "timeTarget": 10
    },
    {
      "type": "FORCED_TRADEOFF",
      "order": 3,
      "prompt": "Strategic decision scenario",
      "options": [...],
      "correctAnswer": "b",
      "insightAnswer": "...",
      "timeTarget": 20
    },
    {
      "type": "SPOT_THE_SIGNAL",
      "order": 4,
      "prompt": "...",
      "options": [...],
      "correctAnswer": "d",
      "insightAnswer": "...",
      "timeTarget": 10
    },
    {
      "type": "RANK_AND_PRIORITIZE",
      "order": 5,
      "prompt": "Rank these items by [criteria]",
      "options": [...],
      "correctAnswer": "c,a,d,b",
      "insightAnswer": "Prioritization reasoning",
      "timeTarget": 25
    },
    {
      "type": "FORCED_TRADEOFF",
      "order": 6,
      "prompt": "...",
      "options": [...],
      "correctAnswer": "a",
      "insightAnswer": "...",
      "timeTarget": 20
    },
    {
      "type": "CURVEBALL",
      "order": 7,
      "prompt": "New information changes the situation from interaction 3 or 5...",
      "options": [...],
      "correctAnswer": "b",
      "insightAnswer": "How the new info shifts strategy",
      "priorContext": "Reference to interaction 3 or 5 context",
      "timeTarget": 20
    },
    {
      "type": "FILL_THE_GAP",
      "order": 8,
      "prompt": "Sentence with ___ blank",
      "options": [...],
      "correctAnswer": "d",
      "insightAnswer": "...",
      "timeTarget": 10
    }
  ]
}

CRITICAL REQUIREMENTS:
- All 8 interactions form a coherent business narrative (same company/scenario)
- NO TEACH_AND_TEST interactions (this is practice, not learning)
- Each prompt max 3 sentences, each option max 15 words
- correctAnswer is an option ID ("a"/"b"/"c"/"d") or comma-separated IDs for RANK_AND_PRIORITIZE
- CURVEBALL (interaction 7) must include priorContext referencing interaction 3 or 5
- Difficulty: ${clampedDifficulty}/5
- All wrong answers must be genuinely plausible`;

  return { system, user };
}
