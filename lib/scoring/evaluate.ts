import { evaluateJSON } from "@/lib/ai/client";
import { buildEvaluateAttemptPrompt } from "@/lib/ai/prompts/evaluate-attempt";
import { buildEvaluateDuelPrompt } from "@/lib/ai/prompts/evaluate-duel";
import {
  DIMENSION_KEYS,
  SCORING_DIMENSIONS,
  type DimensionKey,
  type DimensionScores,
} from "@/lib/scoring/dimensions";
import { calculateElo } from "@/lib/scoring/elo";
import type {
  EvaluationResult,
  DuelEvaluation,
  SprintResponse,
  EnrichedResponse,
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
 * Default mapping: interaction types to the dimensions they primarily test.
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

/**
 * Per-skill dimension overrides: certain skills emphasize different dimensions
 * for the same interaction type. This makes scoring contextually accurate.
 */
const SKILL_DIMENSION_OVERRIDES: Record<
  string,
  Partial<Record<string, { primary: DimensionKey; secondary: DimensionKey }>>
> = {
  "stakeholder-communication": {
    SPOT_THE_SIGNAL: { primary: "communicationClarity", secondary: "analyticalThinking" },
    FILL_THE_GAP: { primary: "communicationClarity", secondary: "strategicReasoning" },
    TEACH_AND_TEST: { primary: "communicationClarity", secondary: "decisionQuality" },
    RANK_AND_PRIORITIZE: { primary: "communicationClarity", secondary: "strategicReasoning" },
  },
  "data-interpretation": {
    FORCED_TRADEOFF: { primary: "quantitativeReasoning", secondary: "analyticalThinking" },
    FILL_THE_GAP: { primary: "quantitativeReasoning", secondary: "analyticalThinking" },
    TEACH_AND_TEST: { primary: "quantitativeReasoning", secondary: "analyticalThinking" },
    CURVEBALL: { primary: "quantitativeReasoning", secondary: "creativeProblemSolving" },
  },
  "financial-statement-analysis": {
    FORCED_TRADEOFF: { primary: "quantitativeReasoning", secondary: "analyticalThinking" },
    SPOT_THE_SIGNAL: { primary: "quantitativeReasoning", secondary: "analyticalThinking" },
    FILL_THE_GAP: { primary: "quantitativeReasoning", secondary: "communicationClarity" },
    CURVEBALL: { primary: "analyticalThinking", secondary: "quantitativeReasoning" },
  },
  "valuation": {
    SPOT_THE_SIGNAL: { primary: "quantitativeReasoning", secondary: "analyticalThinking" },
    FORCED_TRADEOFF: { primary: "quantitativeReasoning", secondary: "strategicReasoning" },
    FILL_THE_GAP: { primary: "quantitativeReasoning", secondary: "analyticalThinking" },
    TEACH_AND_TEST: { primary: "quantitativeReasoning", secondary: "analyticalThinking" },
  },
  "gtm-strategy": {
    SPOT_THE_SIGNAL: { primary: "strategicReasoning", secondary: "analyticalThinking" },
    FILL_THE_GAP: { primary: "strategicReasoning", secondary: "communicationClarity" },
    TEACH_AND_TEST: { primary: "strategicReasoning", secondary: "decisionQuality" },
  },
  "pricing-monetization": {
    SPOT_THE_SIGNAL: { primary: "quantitativeReasoning", secondary: "strategicReasoning" },
    FORCED_TRADEOFF: { primary: "strategicReasoning", secondary: "quantitativeReasoning" },
    FILL_THE_GAP: { primary: "quantitativeReasoning", secondary: "strategicReasoning" },
  },
  "prioritization": {
    SPOT_THE_SIGNAL: { primary: "decisionQuality", secondary: "strategicReasoning" },
    FILL_THE_GAP: { primary: "strategicReasoning", secondary: "decisionQuality" },
    TEACH_AND_TEST: { primary: "decisionQuality", secondary: "strategicReasoning" },
    CURVEBALL: { primary: "decisionQuality", secondary: "creativeProblemSolving" },
  },
  "guesstimation": {
    SPOT_THE_SIGNAL: { primary: "quantitativeReasoning", secondary: "creativeProblemSolving" },
    FORCED_TRADEOFF: { primary: "quantitativeReasoning", secondary: "strategicReasoning" },
    FILL_THE_GAP: { primary: "quantitativeReasoning", secondary: "analyticalThinking" },
    TEACH_AND_TEST: { primary: "quantitativeReasoning", secondary: "analyticalThinking" },
    CURVEBALL: { primary: "creativeProblemSolving", secondary: "quantitativeReasoning" },
  },
};

/** Resolve dimension mapping for an interaction, considering skill context */
function getDimensionMapping(
  interactionType: string,
  skillSlug?: string
): { primary: DimensionKey; secondary: DimensionKey } {
  // Check skill-specific overrides first
  if (skillSlug) {
    const override = SKILL_DIMENSION_OVERRIDES[skillSlug]?.[interactionType];
    if (override) return override;
  }
  // Fall back to default type-based mapping
  return (
    INTERACTION_DIMENSION_MAP[interactionType] ??
    INTERACTION_DIMENSION_MAP["SPOT_THE_SIGNAL"]
  );
}

// ─── Deterministic Scoring (LEARN / PRACTICE) ──────────────

/**
 * Score a single interaction deterministically.
 * Returns a score 0-100 for the interaction.
 */
function scoreInteractionDeterministic(
  interaction: SprintInteraction,
  response: SprintResponse | undefined,
  mode?: string
): { score: number; isCorrect: boolean } {
  if (!response) {
    return { score: 0, isCorrect: false };
  }

  const { answer } = response;
  const timeSpent = Number(response.timeSpent) || 0;
  const { correctAnswer, type } = interaction;
  const timeTarget = Number(interaction.timeTarget) || 10;
  const isTimedMode = mode === "COMPETE";

  // For RANK_AND_PRIORITIZE, check partial correctness
  if (type === "RANK_AND_PRIORITIZE" && correctAnswer) {
    return scoreRanking(answer, correctAnswer, timeSpent, timeTarget, isTimedMode);
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

  // Time bonus/penalty ONLY in COMPETE mode
  if (isTimedMode) {
    if (timeSpent <= timeTarget) {
      const timeRatio = timeSpent / timeTarget;
      score += Math.round(15 * (1 - timeRatio * 0.5)); // 8-15 bonus points
    } else {
      const overRatio = Math.min((timeSpent - timeTarget) / timeTarget, 1);
      score -= Math.round(10 * overRatio); // Up to -10 penalty
    }
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
  rawTimeSpent: number,
  rawTimeTarget: number,
  isTimedMode: boolean
): { score: number; isCorrect: boolean } {
  const timeSpent = Number(rawTimeSpent) || 0;
  const timeTarget = Number(rawTimeTarget) || 10;
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

  // Perfect order bonus (time bonus only in COMPETE)
  if (isCorrect) {
    score = 80;
    if (isTimedMode && timeSpent <= timeTarget) {
      score += Math.round(15 * (1 - (timeSpent / timeTarget) * 0.5));
    } else if (!isTimedMode) {
      score = 85; // Flat bonus for perfect ranking without time pressure
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
  responses: SprintResponse[],
  mode?: string,
  skillSlug?: string
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
    const { score } = scoreInteractionDeterministic(interaction, response, mode);

    const mapping = getDimensionMapping(interaction.type, skillSlug);

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

  const accuracy = interactions.length > 0
    ? Math.round((correctCount / interactions.length) * 100)
    : 0;
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

// ─── Enriched Responses Builder ────────────────────────────

/**
 * Build enriched responses array with per-interaction scoring data.
 * Stores prompt, options, correctness, and insight for deletion-resistant replay.
 */
function buildEnrichedResponses(
  interactions: SprintInteraction[],
  responses: SprintResponse[]
): EnrichedResponse[] {
  return interactions.map((interaction) => {
    const response = responses.find(
      (r) => r.interactionId === interaction.id
    );
    const { score, isCorrect } = scoreInteractionDeterministic(
      interaction,
      response
    );

    return {
      interactionId: interaction.id,
      answer: response?.answer ?? "",
      timeSpent: response?.timeSpent ?? 0,
      isCorrect,
      score,
      correctAnswer: interaction.correctAnswer ?? "",
      prompt: interaction.prompt,
      options: (interaction.options ?? []) as { id: string; text: string }[],
      insightAnswer: interaction.insightAnswer ?? undefined,
      interactionType: interaction.type,
    };
  });
}

/**
 * Build structured highlights and improvements from deterministic scoring.
 */
function buildDeterministicHighlights(
  interactions: SprintInteraction[],
  responses: SprintResponse[]
): { highlights: string[]; improvements: string[] } {
  const highlights: string[] = [];
  const improvements: string[] = [];

  // Analyze per-dimension performance
  const scores = distributeToDimensions(interactions, responses);
  const sorted = [...DIMENSION_KEYS].sort(
    (a, b) => scores[b] - scores[a]
  );

  const topDims = sorted.slice(0, 2);
  const bottomDims = sorted.slice(-2);

  const dimLabels: Record<string, string> = {};
  for (const d of SCORING_DIMENSIONS) {
    dimLabels[d.key] = d.label;
  }

  for (const key of topDims) {
    if (scores[key] >= 70) {
      highlights.push(`Strong ${dimLabels[key]} (${scores[key]}%)`);
    }
  }

  for (const key of bottomDims) {
    if (scores[key] < 70) {
      improvements.push(`Focus on ${dimLabels[key]} (${scores[key]}%)`);
    }
  }

  // Analyze time management
  let fastCount = 0;
  let slowCount = 0;
  for (const interaction of interactions) {
    const response = responses.find(
      (r) => r.interactionId === interaction.id
    );
    if (!response) continue;
    if (response.timeSpent <= interaction.timeTarget) fastCount++;
    else slowCount++;
  }

  if (fastCount >= interactions.length * 0.75) {
    highlights.push("Excellent time management across interactions");
  }
  if (slowCount >= interactions.length * 0.5) {
    improvements.push("Work on response speed  -  many answers exceeded time targets");
  }

  return { highlights, improvements };
}

// ─── Public API ────────────────────────────────────────────

/**
 * Evaluate a sprint attempt.
 *
 * For LEARN/PRACTICE modes: uses deterministic scoring based on correctAnswer matching.
 * For COMPETE mode: calls Claude AI for nuanced, mentorship-quality evaluation.
 *
 * @returns EvaluationResult with 6-dimension scores, totalScore, feedback, and enriched responses
 */
export async function evaluateAttempt(
  sprint: SprintData,
  responses: SprintResponse[],
  mode: string,
  skillSlug?: string
): Promise<EvaluationResult> {
  // Build enriched responses for all modes (uses deterministic scoring per interaction)
  const enrichedResponses = buildEnrichedResponses(
    sprint.interactions,
    responses
  );

  // ── COMPETE mode: AI evaluation ──
  if (mode === "COMPETE") {
    try {
      const aiResult = await evaluateAttemptWithAI(sprint, responses);
      return {
        ...aiResult,
        enrichedResponses,
      };
    } catch (error) {
      console.error(
        "[evaluateAttempt] AI evaluation failed, falling back to deterministic:",
        error
      );
      // Fall back to deterministic on AI failure
    }
  }

  // ── LEARN / PRACTICE mode (or COMPETE fallback): deterministic scoring ──
  const scores = distributeToDimensions(sprint.interactions, responses, mode, skillSlug);
  const totalScore = Math.round(
    DIMENSION_KEYS.reduce((sum, key) => sum + scores[key], 0) /
      DIMENSION_KEYS.length
  );
  const feedback = buildDeterministicFeedback(sprint.interactions, responses);
  const { highlights, improvements } = buildDeterministicHighlights(
    sprint.interactions,
    responses
  );

  return {
    scores,
    totalScore,
    feedback,
    highlights,
    improvements,
    enrichedResponses,
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

  return {
    scores,
    totalScore,
    feedback: result.feedback || "Evaluation complete.",
    highlights: result.highlights ?? [],
    improvements: result.improvements ?? [],
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
  try {
    return await evaluateDuelWithAI(
      sprint,
      p1Responses,
      p2Responses,
      player1Id,
      player2Id,
      player1Elo,
      player2Elo,
      player1Matches,
      player2Matches
    );
  } catch (error) {
    console.error(
      "[evaluateDuel] AI evaluation failed, using deterministic fallback:",
      error
    );
    return evaluateDuelDeterministic(
      sprint,
      p1Responses,
      p2Responses,
      player1Id,
      player2Id,
      player1Elo,
      player2Elo,
      player1Matches,
      player2Matches
    );
  }
}

/**
 * Deterministic duel evaluation fallback.
 * Uses correctAnswer matching to compare both players.
 */
function evaluateDuelDeterministic(
  sprint: SprintData,
  p1Responses: SprintResponse[],
  p2Responses: SprintResponse[],
  player1Id: string,
  player2Id: string,
  player1Elo: number,
  player2Elo: number,
  player1Matches: number,
  player2Matches: number
): DuelEvaluation {
  const p1Scores = distributeToDimensions(sprint.interactions, p1Responses, "COMPETE");
  const p2Scores = distributeToDimensions(sprint.interactions, p2Responses, "COMPETE");

  const p1Total = DIMENSION_KEYS.reduce((s, k) => s + p1Scores[k], 0);
  const p2Total = DIMENSION_KEYS.reduce((s, k) => s + p2Scores[k], 0);

  const winnerId = p1Total >= p2Total ? player1Id : player2Id;

  const dimensionWinners = {} as Record<DimensionKey, string>;
  for (const key of DIMENSION_KEYS) {
    dimensionWinners[key] =
      p1Scores[key] >= p2Scores[key] ? player1Id : player2Id;
  }

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
    player1Scores: p1Scores,
    player2Scores: p2Scores,
    dimensionWinners,
    analysis:
      "Head-to-head comparison based on accuracy and response quality across all six skill dimensions.",
    eloChange,
  };
}

/**
 * AI-powered duel evaluation using Claude.
 */
async function evaluateDuelWithAI(
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
