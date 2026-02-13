import type { EnrichedResponse } from "@/types";

/**
 * Find the weakest interactions from a sprint attempt.
 * Used to focus post-sprint AI debrief on areas where the user struggled most.
 *
 * Sort: primary by score ascending (weakest first), tie-break by time descending (slower = more struggle).
 * Special case: if all answers are correct, pick the slowest (most uncertain).
 */
export function findWeakestInteractions(
  responses: EnrichedResponse[],
  count: number = 2
): EnrichedResponse[] {
  if (responses.length === 0) return [];
  if (responses.length <= count) return responses;

  const allCorrect = responses.every((r) => r.isCorrect);
  if (allCorrect) {
    // All correct  -  pick most time-consuming (most uncertain)
    return [...responses]
      .sort((a, b) => b.timeSpent - a.timeSpent)
      .slice(0, count);
  }

  return [...responses]
    .sort((a, b) => {
      // Primary: score ascending (weakest first)
      if (a.score !== b.score) return a.score - b.score;
      // Tie-break: time descending (slower = more struggle)
      return b.timeSpent - a.timeSpent;
    })
    .slice(0, count);
}
