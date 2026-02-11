import type { DimensionKey, DimensionScores } from "@/lib/scoring/dimensions";

// Re-export scoring types
export type { DimensionKey, DimensionScores };

// Interaction option shape
export interface InteractionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

// Sprint response from user
export interface SprintResponse {
  interactionId: string;
  answer: string;
  timeSpent: number; // seconds
}

// Evaluation result
export interface EvaluationResult {
  scores: DimensionScores;
  totalScore: number;
  feedback?: string;
  dimensionFeedback?: Partial<Record<DimensionKey, string>>;
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
