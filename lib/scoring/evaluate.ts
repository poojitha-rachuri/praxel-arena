import { evaluateJSON } from "@/lib/ai/client";
import { buildEvaluateAttemptPrompt } from "@/lib/ai/prompts/evaluate-attempt";
import { buildEvaluateDuelPrompt } from "@/lib/ai/prompts/evaluate-duel";
import {
  DIMENSION_KEYS,
  type DimensionKey,
  type DimensionScores,
} from "@/lib/scoring/dimensions";
import { calculateElo } from "@/lib/scoring/elo";
import type {
  EvaluationResult,
  DuelEvaluation,
  SprintResponse,
} from "@/types";

// ─── Types for Sprint data passed in ────────────────────────

interface SprintInteraction {
  id: string;
  type: string;
  order: number;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer: string | null;
  insightAnswer: string | null;
  teachingPreamble?: string | null;
  priorContext?: string | null;
  timeTarget: number;
}

interface SprintData {
  title: string;
  mode: string;
  difficulty: number;
  interactions: SprintInteraction[];
}

// ─── Dimension mapping for deterministic scoring ────────────

/**
 * Maps interaction types to the dimensions they primarily test.
 * Each interaction contributes to 2 dimensions with primary/secondary weights.
 */
const INTERACTION_DIMENSION_MAP: Record<
  string,
  { primary: DimensionKey; secondary: DimensionKey }
> = {
  SPOT_THE_SIGNAL: {
    primary: "analyticalThinking",
    secondary: "quantitativeReasoning",
  },
  FORCED_TRADEOFF: {
    primary: "strategicReasoning",
    secondary: "decisionQuality",
  },
  FILL_THE_GAP: {
    primary: "communicationClarity",
    secondary: "analyticalThinking",
  },
  RANK_AND_PRIORITIZE: {
    primary: "strategicReasoning",
    secondary: "decisionQuality",
  },
  CURVEBALL: {
    primary: "creativeProblemSolving",
    secondary: "decisionQuality",
  },
  TEACH_AND_TEST: {
    primary: "analyticalThinking",
    secondary: "communicationClarity",
  },
};

// ─── Deterministic Scoring (LEARN / PRACTICE) ──────────────

/**
 * Score a single interaction deterministically.
 * Returns a score 0-100 for the interaction.
 */
function scoreInteractionDeterministic(
  interaction: SprintInteraction,
  response: SprintResponse | undefined
): { score: number; isCorrect: boolean } {
  if (!response) {
    return { score: 0, isCorrect: false };
  }

  const { answer, timeSpent } = response;
  const { correctAnswer, timeTarget, type } = interaction;

  // For RANK_AND_PRIORITIZE, check partial correctness
  if (type === "RANK_AND_PRIORITIZE" && correctAnswer) {
    return scoreRanking(answer, correctAnswer, timeSpent, timeTarget);
  }

  const isCorrect = answer === correctAnswer;

  if (!isCorrect) {
    // Partial credit for harder interaction types (the answer required complex reasoning)
    const partialCredit =
      type === "CURVEBALL" || type === "FORCED_TRADEOFF" ? 15 : 0;
    return { score: partialCredit, isCorrect: false };
  }

  // Base score for correct answer
  let score = 75;

  // Time bonus: answering within target gets up to +15 points
  if (timeSpent <= timeTarget) {
    const timeRatio = timeSpent / timeTarget;
    score += Math.round(15 * (1 - timeRatio * 0.5)); // 8-15 bonus points
  } else {
    // Time penalty for going over (but already correct, so mild)
    const overRatio = Math.min((timeSpent - timeTarget) / timeTarget, 1);
    score -= Math.round(10 * overRatio); // Up to -10 penalty
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  return { score, isCorrect: true };
}

/**
 * Score a RANK_AND_PRIORITIZE interaction with partial credit.
 * Counts correctly-placed items for partial scoring.
 */
function scoreRanking(
  answer: string,
  correctAnswer: string,
  timeSpent: number,
  timeTarget: number
): { score: number; isCorrect: boolean } {
  const playerOrder = answer.split(",").map((s) => s.trim());
  const correctOrder = correctAnswer.split(",").map((s) => s.trim());

  if (playerOrder.length !== correctOrder.length) {
    return { score: 0, isCorrect: false };
  }

  // Count correctly placed items
  let correctPositions = 0;
  for (let i = 0; i < correctOrder.length; i++) {
    if (playerOrder[i] === correctOrder[i]) {
      correctPositions++;
    }
  }

  const isCorrect = correctPositions === correctOrder.length;
  const positionRatio = correctPositions / correctOrder.length;

  // Base score from position accuracy
  let score = Math.round(positionRatio * 85);

  // Perfect order bonus with time consideration
  if (isCorrect) {
    score = 80;
    if (timeSpent <= timeTarget) {
      score += Math.round(15 * (1 - (timeSpent / timeTarget) * 0.5));
    }
  }

  score = Math.max(0, Math.min(100, score));

  return { score, isCorrect };
}

/**
 * Distribute interaction scores across the 6 dimensions.
 * Each interaction contributes to its primary (70%) and secondary (30%) dimensions.
 */
function distributeToDimensions(
  interactions: SprintInteraction[],
  responses: SprintResponse[]
): DimensionScores {
  const dimensionTotals: Record<DimensionKey, number> = {} as Record<
    DimensionKey,
    number
  >;
  const dimensionCounts: Record<DimensionKey, number> = {} as Record<
    DimensionKey,
    number
  >;

  for (const key of DIMENSION_KEYS) {
    dimensionTotals[key] = 0;
    dimensionCounts[key] = 0;
  }

  for (const interaction of interactions) {
    const response = responses.find(
      (r) => r.interactionId === interaction.id
    );
    const { score } = scoreInteractionDeterministic(interaction, response);

    const mapping =
      INTERACTION_DIMENSION_MAP[interaction.type] ??
      INTERACTION_DIMENSION_MAP["SPOT_THE_SIGNAL"];

    // Primary dimension gets 70% weight
    dimensionTotals[mapping.primary] += score * 0.7;
    dimensionCounts[mapping.primary] += 0.7;

    // Secondary dimension gets 30% weight
    dimensionTotals[mapping.secondary] += score * 0.3;
    dimensionCounts[mapping.secondary] += 0.3;
  }

  // Calculate weighted averages
  const scores = {} as DimensionScores;
  for (const key of DIMENSION_KEYS) {
    if (dimensionCounts[key] > 0) {
      scores[key] = Math.round(dimensionTotals[key] / dimensionCounts[key]);
    } else {
      scores[key] = 0;
    }
  }

  return scores;
}

/**
 * Build human-readable feedback based on deterministic scoring.
 */
function buildDeterministicFeedback(
  interactions: SprintInteraction[],
  responses: SprintResponse[]
): string {
  let correctCount = 0;
  let totalTime = 0;
  let totalTimeTarget = 0;

  for (const interaction of interactions) {
    const response = responses.find(
      (r) => r.interactionId === interaction.id
    );
    const { isCorrect } = scoreInteractionDeterministic(interaction, response);
    if (isCorrect) correctCount++;
    totalTime += response?.timeSpent ?? 0;
    totalTimeTarget += interaction.timeTarget;
  }

  const accuracy = Math.round((correctCount / interactions.length) * 100);
  const timeEfficiency =
    totalTime <= totalTimeTarget
      ? "ahead of pace"
      : totalTime <= totalTimeTarget * 1.5
        ? "close to target"
        : "over time";

  if (accuracy >= 90) {
    return `Excellent performance with ${accuracy}% accuracy and ${timeEfficiency} timing. You demonstrated strong command of the material across most interactions.`;
  } else if (accuracy >= 70) {
    return `Solid showing with ${accuracy}% accuracy and ${timeEfficiency} timing. A few areas could use reinforcement, but your foundational understanding is clear.`;
  } else if (accuracy >= 50) {
    return `You scored ${accuracy}% accuracy with ${timeEfficiency} timing. Consider revisiting the concepts in LEARN mode to strengthen your foundation before practicing further.`;
  } else {
    return `This sprint was challenging with ${accuracy}% accuracy. We recommend starting with LEARN mode on this skill to build core understanding before returning to practice.`;
  }
}

// ─── Public API ────────────────────────────────────────────

/**
 * Evaluate a sprint attempt.
 *
 * For LEARN/PRACTICE modes: uses deterministic scoring based on correctAnswer matching.
 * For COMPETE mode: calls Claude AI for nuanced, mentorship-quality evaluation.
 *
 * @returns EvaluationResult with 6-dimension scores, totalScore, and feedback
 */
export async function evaluateAttempt(
  sprint: SprintData,
  responses: SprintResponse[],
  mode: string
): Promise<EvaluationResult> {
  // ── COMPETE mode: AI evaluation ──
  if (mode === "COMPETE") {
    try {
      return await evaluateAttemptWithAI(sprint, responses);
    } catch (error) {
      console.error(
        "[evaluateAttempt] AI evaluation failed, falling back to deterministic:",
        error
      );
      // Fall back to deterministic on AI failure
    }
  }

  // ── LEARN / PRACTICE mode (or COMPETE fallback): deterministic scoring ──
  const scores = distributeToDimensions(sprint.interactions, responses);
  const totalScore = Math.round(
    DIMENSION_KEYS.reduce((sum, key) => sum + scores[key], 0) /
      DIMENSION_KEYS.length
  );
  const feedback = buildDeterministicFeedback(sprint.interactions, responses);

  return {
    scores,
    totalScore,
    feedback,
  };
}

/**
 * AI-powered evaluation for COMPETE mode sprints.
 * Uses Claude Sonnet for fast, nuanced evaluation with mentorship-quality feedback.
 */
async function evaluateAttemptWithAI(
  sprint: SprintData,
  responses: SprintResponse[]
): Promise<EvaluationResult> {
  const { system, user } = buildEvaluateAttemptPrompt(
    {
      title: sprint.title,
      mode: sprint.mode,
      difficulty: sprint.difficulty,
      interactions: sprint.interactions,
    },
    responses
  );

  const result = await evaluateJSON<{
    scores: DimensionScores;
    totalScore: number;
    feedback: string;
    highlights: string[];
    improvements: string[];
  }>(system, user);

  // Validate and clamp scores to 0-100
  const scores = {} as DimensionScores;
  for (const key of DIMENSION_KEYS) {
    const raw = result.scores?.[key] ?? 0;
    scores[key] = Math.max(0, Math.min(100, Math.round(raw)));
  }

  // Recalculate totalScore as average of all 6 dimensions
  const totalScore = Math.round(
    DIMENSION_KEYS.reduce((sum, key) => sum + scores[key], 0) /
      DIMENSION_KEYS.length
  );

  // Compose feedback: main feedback + highlights and improvements
  const feedbackParts: string[] = [result.feedback || "Evaluation complete."];

  if (result.highlights && result.highlights.length > 0) {
    feedbackParts.push(
      `Strengths: ${result.highlights.join(". ")}.`
    );
  }

  if (result.improvements && result.improvements.length > 0) {
    feedbackParts.push(
      `Areas to improve: ${result.improvements.join(". ")}.`
    );
  }

  return {
    scores,
    totalScore,
    feedback: feedbackParts.join(" "),
  };
}

/**
 * Evaluate a head-to-head duel between two players.
 * Always uses AI evaluation for competitive fairness and narrative quality.
 *
 * @param sprint - The sprint both players completed
 * @param p1Responses - Player 1's responses
 * @param p2Responses - Player 2's responses
 * @param player1Id - Actual user ID for player 1
 * @param player2Id - Actual user ID for player 2
 * @param player1Elo - Player 1's current Elo rating
 * @param player2Elo - Player 2's current Elo rating
 * @param player1Matches - Player 1's total match count (for K-factor)
 * @param player2Matches - Player 2's total match count (for K-factor)
 */
export async function evaluateDuel(
  sprint: SprintData,
  p1Responses: SprintResponse[],
  p2Responses: SprintResponse[],
  player1Id: string,
  player2Id: string,
  player1Elo: number,
  player2Elo: number,
  player1Matches: number,
  player2Matches: number
): Promise<DuelEvaluation> {
  const { system, user } = buildEvaluateDuelPrompt(
    {
      title: sprint.title,
      difficulty: sprint.difficulty,
      interactions: sprint.interactions,
    },
    p1Responses,
    p2Responses
  );

  const result = await evaluateJSON<{
    winnerId: string; // "player1" or "player2"
    player1Scores: DimensionScores;
    player2Scores: DimensionScores;
    dimensionWinners: Record<DimensionKey, string>; // "player1" or "player2"
    analysis: string;
  }>(system, user);

  // Map "player1"/"player2" identifiers to actual user IDs
  const idMap: Record<string, string> = {
    player1: player1Id,
    player2: player2Id,
  };

  const winnerId = idMap[result.winnerId] ?? player1Id;

  // Clamp all scores to 0-100
  const player1Scores = {} as DimensionScores;
  const player2Scores = {} as DimensionScores;
  for (const key of DIMENSION_KEYS) {
    player1Scores[key] = Math.max(
      0,
      Math.min(100, Math.round(result.player1Scores?.[key] ?? 0))
    );
    player2Scores[key] = Math.max(
      0,
      Math.min(100, Math.round(result.player2Scores?.[key] ?? 0))
    );
  }

  // Map dimension winners to actual user IDs
  const dimensionWinners = {} as Record<DimensionKey, string>;
  for (const key of DIMENSION_KEYS) {
    const rawWinner = result.dimensionWinners?.[key] ?? result.winnerId;
    dimensionWinners[key] = idMap[rawWinner] ?? player1Id;
  }

  // Calculate Elo change using the Elo calculator
  const winnerElo = winnerId === player1Id ? player1Elo : player2Elo;
  const loserElo = winnerId === player1Id ? player2Elo : player1Elo;
  const winnerMatches =
    winnerId === player1Id ? player1Matches : player2Matches;
  const loserMatches =
    winnerId === player1Id ? player2Matches : player1Matches;

  const { change: eloChange } = calculateElo(
    winnerElo,
    loserElo,
    winnerMatches,
    loserMatches
  );

  return {
    winnerId,
    player1Scores,
    player2Scores,
    dimensionWinners,
    analysis: result.analysis || "Duel evaluation complete.",
    eloChange,
  };
}
