import type { DimensionKey, DimensionScores } from "@/lib/scoring/dimensions";

// Re-export scoring types
export type { DimensionKey, DimensionScores };

// Interaction option shape
export interface InteractionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

// Sprint response from user (raw, before enrichment)
export interface SprintResponse {
  interactionId: string;
  answer: string;
  timeSpent: number; // seconds
}

// Enriched response (after evaluation, stored in SprintAttempt.responses)
export interface EnrichedResponse {
  interactionId: string;
  answer: string;
  timeSpent: number;
  isCorrect: boolean;
  score: number; // 0-100 for this interaction
  correctAnswer: string;
  prompt: string; // snapshot for deletion-resistant replay
  options: InteractionOption[]; // snapshot of options
  insightAnswer?: string; // explanation text
  interactionType: string; // SPOT_THE_SIGNAL, FORCED_TRADEOFF, etc.
}

// Evaluation result
export interface EvaluationResult {
  scores: DimensionScores;
  totalScore: number;
  feedback?: string;
  highlights?: string[];
  improvements?: string[];
  enrichedResponses?: EnrichedResponse[];
}

// Duel evaluation
export interface DuelEvaluation {
  winnerId: string;
  player1Scores: DimensionScores;
  player2Scores: DimensionScores;
  dimensionWinners: Record<DimensionKey, string>; // userId of winner per dimension
  analysis: string;
  eloChange: number;
}
