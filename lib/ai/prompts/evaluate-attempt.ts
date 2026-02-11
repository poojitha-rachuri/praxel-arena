import { SCORING_DIMENSIONS } from "@/lib/scoring/dimensions";

export interface EvaluateAttemptInput {
  sprint: {
    title: string;
    mode: string;
    difficulty: number;
    interactions: Array<{
      id: string;
      type: string;
      order: number;
      prompt: string;
      options: Array<{ id: string; text: string }>;
      correctAnswer: string | null;
      insightAnswer: string | null;
      timeTarget: number;
    }>;
  };
  responses: Array<{
    interactionId: string;
    answer: string;
    timeSpent: number;
  }>;
}

export function buildEvaluateAttemptPrompt(
  sprint: EvaluateAttemptInput["sprint"],
  responses: EvaluateAttemptInput["responses"]
): { system: string; user: string } {
  const dimensionList = SCORING_DIMENSIONS.map(
    (d) => `- ${d.key}: ${d.label} -- ${d.description}`
  ).join("\n");

  const system = `You are Praxel Evaluator, a mentorship-quality assessment engine. You evaluate business professional performance across 6 skill dimensions with the rigor of a McKinsey case interviewer and the empathy of a great coach.

EVALUATION PRINCIPLES:
- Score each dimension 0-100 independently
- Consider: correctness of answer, quality of reasoning implied by choice, time management, consistency across the sprint
- A correct answer at the right speed = strong score for that dimension
- Choosing the "insight" answer (when available) signals deeper understanding = bonus
- Wrong answers to easy questions penalize more than wrong answers to hard questions
- Time significantly over target suggests indecision; significantly under may suggest carelessness
- Look for PATTERNS: consistent strength in one dimension, consistent weakness in another
- totalScore is the weighted average of all 6 dimensions (equal weights)

SCORING DIMENSIONS:
${dimensionList}

DIMENSION MAPPING BY INTERACTION TYPE:
- SPOT_THE_SIGNAL: primarily analyticalThinking + quantitativeReasoning
- FORCED_TRADEOFF: primarily strategicReasoning + decisionQuality
- FILL_THE_GAP: primarily communicationClarity + analyticalThinking
- RANK_AND_PRIORITIZE: primarily strategicReasoning + decisionQuality
- CURVEBALL: primarily creativeProblemSolving + decisionQuality
- TEACH_AND_TEST: primarily the dimension targeted by the teaching content

SCORING RUBRIC:
- 90-100: Exceptional. Correct answer (or insight answer) with efficient time. Demonstrates expert-level understanding.
- 75-89: Strong. Mostly correct answers with reasonable time. Shows solid professional competence.
- 60-74: Developing. Mix of correct and incorrect. Shows foundational understanding with gaps.
- 40-59: Emerging. More wrong than right, or very slow. Conceptual gaps evident.
- 0-39: Needs attention. Fundamental misunderstanding of the domain concepts.

FEEDBACK STYLE:
- Be specific, not generic. Reference actual choices the player made.
- Highlights: 2-3 specific moments where the player showed strength
- Improvements: 2-3 actionable areas with concrete advice
- Overall feedback: 2-3 sentences of mentorship-quality coaching

OUTPUT FORMAT:
Return a single JSON object. No markdown, no commentary, just valid JSON.`;

  // Build the detailed interaction + response pairs for evaluation
  const interactionDetails = sprint.interactions
    .sort((a, b) => a.order - b.order)
    .map((interaction) => {
      const response = responses.find(
        (r) => r.interactionId === interaction.id
      );
      const selectedOption = interaction.options.find(
        (o: { id: string; text: string }) => o.id === response?.answer
      );
      const correctOption = interaction.options.find(
        (o: { id: string; text: string }) => o.id === interaction.correctAnswer
      );

      return {
        order: interaction.order,
        type: interaction.type,
        prompt: interaction.prompt,
        correctAnswer: interaction.correctAnswer,
        correctOptionText: correctOption?.text ?? "N/A",
        insightAnswer: interaction.insightAnswer,
        playerAnswer: response?.answer ?? "NO_RESPONSE",
        playerAnswerText: selectedOption?.text ?? "No response",
        isCorrect: response?.answer === interaction.correctAnswer,
        timeSpent: response?.timeSpent ?? 0,
        timeTarget: interaction.timeTarget,
      };
    });

  const user = `Evaluate this sprint attempt:

SPRINT: "${sprint.title}" (Mode: ${sprint.mode}, Difficulty: ${sprint.difficulty}/5)

INTERACTION-BY-INTERACTION BREAKDOWN:
${JSON.stringify(interactionDetails, null, 2)}

Return JSON in this exact format:
{
  "scores": {
    "analyticalThinking": 0,
    "strategicReasoning": 0,
    "quantitativeReasoning": 0,
    "communicationClarity": 0,
    "decisionQuality": 0,
    "creativeProblemSolving": 0
  },
  "totalScore": 0,
  "feedback": "2-3 sentences of mentorship-quality overall feedback referencing specific choices",
  "highlights": [
    "Specific strength moment 1",
    "Specific strength moment 2"
  ],
  "improvements": [
    "Actionable improvement area 1",
    "Actionable improvement area 2"
  ]
}

REQUIREMENTS:
- Each dimension score is 0-100
- totalScore is the average of all 6 dimension scores (rounded to nearest integer)
- feedback must reference at least one specific interaction the player answered
- highlights must reference specific moments/choices (not generic praise)
- improvements must be actionable and specific (not generic advice)
- Consider both correctness AND time management in scoring`;

  return { system, user };
}
