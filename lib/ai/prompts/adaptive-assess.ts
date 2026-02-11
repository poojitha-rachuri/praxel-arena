import { SCORING_DIMENSIONS, type DimensionScores } from "@/lib/scoring/dimensions";

export function buildAdaptiveAssessPrompt(
  skillName: string,
  currentScores: Partial<DimensionScores> | null
): { system: string; user: string } {
  const dimensionList = SCORING_DIMENSIONS.map(
    (d) => `- ${d.key}: ${d.label} -- ${d.description}`
  ).join("\n");

  const hasExistingScores = currentScores !== null && Object.values(currentScores).some((v) => v > 0);

  const calibrationContext = hasExistingScores
    ? `The player has existing scores. Use these to calibrate difficulty -- probe weaknesses harder and confirm strengths:
${SCORING_DIMENSIONS.map((d) => `  ${d.label}: ${currentScores?.[d.key] ?? 0}/100`).join("\n")}
Start at the difficulty level implied by their average score:
  - Average 0-30: Start at difficulty 1
  - Average 31-50: Start at difficulty 2
  - Average 51-70: Start at difficulty 3
  - Average 71-85: Start at difficulty 4
  - Average 86-100: Start at difficulty 5`
    : "This is a new player with no prior data. Start at medium difficulty (level 3) and use the 5 questions to quickly bracket their skill level.";

  const system = `You are Praxel Assessor, a skill calibration engine. You generate a short adaptive assessment to quickly gauge a professional's competency across 6 dimensions. This assessment determines their starting difficulty and initial skill profile.

ASSESSMENT PRINCIPLES:
- Generate exactly 5 interactions that efficiently probe different dimensions
- Each interaction should primarily test a different dimension (cover as many as possible)
- Use a mix of interaction types for variety: SPOT_THE_SIGNAL, FORCED_TRADEOFF, FILL_THE_GAP
- Questions should escalate in difficulty: Q1 = easy warmup, Q3 = medium, Q5 = challenging
- Use realistic business scenarios relevant to the skill being assessed
- Each question must be answerable in 15-20 seconds

SCORING DIMENSIONS:
${dimensionList}

ADAPTIVE CALIBRATION:
${calibrationContext}

INTERACTION TYPE RULES:
1. SPOT_THE_SIGNAL: Data/metric interpretation. 4 options. Time: 10s.
2. FORCED_TRADEOFF: Strategic decision. 4 options. Time: 15s.
3. FILL_THE_GAP: Sentence completion with ___. 4 options. Time: 10s.

OUTPUT FORMAT:
Return a single JSON object. No markdown, no commentary, just valid JSON.`;

  const user = `Generate a 5-question adaptive assessment for the skill "${skillName}".

${hasExistingScores ? "Player has existing scores -- adapt accordingly (see system prompt)." : "New player -- start at medium difficulty and bracket quickly."}

Return JSON in this exact format:
{
  "title": "Assessment: ${skillName}",
  "interactions": [
    {
      "type": "SPOT_THE_SIGNAL or FORCED_TRADEOFF or FILL_THE_GAP",
      "order": 1,
      "prompt": "Scenario text (max 2 sentences)",
      "options": [
        { "id": "a", "text": "Option A" },
        { "id": "b", "text": "Option B" },
        { "id": "c", "text": "Option C" },
        { "id": "d", "text": "Option D" }
      ],
      "correctAnswer": "a",
      "insightAnswer": "Why this reveals understanding (1 sentence)",
      "timeTarget": 15,
      "targetDimension": "analyticalThinking"
    },
    {
      "type": "...",
      "order": 2,
      "prompt": "...",
      "options": [...],
      "correctAnswer": "...",
      "insightAnswer": "...",
      "timeTarget": 15,
      "targetDimension": "strategicReasoning"
    },
    {
      "type": "...",
      "order": 3,
      "prompt": "...",
      "options": [...],
      "correctAnswer": "...",
      "insightAnswer": "...",
      "timeTarget": 15,
      "targetDimension": "quantitativeReasoning"
    },
    {
      "type": "...",
      "order": 4,
      "prompt": [...],
      "correctAnswer": "...",
      "insightAnswer": "...",
      "timeTarget": 15,
      "targetDimension": "decisionQuality"
    },
    {
      "type": "...",
      "order": 5,
      "prompt": "...",
      "options": [...],
      "correctAnswer": "...",
      "insightAnswer": "...",
      "timeTarget": 15,
      "targetDimension": "creativeProblemSolving"
    }
  ]
}

CRITICAL REQUIREMENTS:
- Exactly 5 interactions (not 8 -- this is a quick assessment)
- Each primarily tests a different dimension (via targetDimension field)
- Progressive difficulty: Q1 easy, Q3 medium, Q5 hard
- Use ONLY these types: SPOT_THE_SIGNAL, FORCED_TRADEOFF, FILL_THE_GAP
- correctAnswer is one of "a", "b", "c", "d"
- Each prompt max 2 sentences
- Each option max 15 words
- Scenarios must be relevant to "${skillName}"`;

  return { system, user };
}
