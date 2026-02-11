import {
  ELO_K_PROVISIONAL,
  ELO_K_ESTABLISHED,
  ELO_PROVISIONAL_THRESHOLD,
  ELO_RATING_FLOOR,
} from "@/lib/utils/constants";

export function calculateElo(
  winnerRating: number,
  loserRating: number,
  winnerMatches: number,
  loserMatches: number
): { winnerNew: number; loserNew: number; change: number } {
  const kWinner =
    winnerMatches < ELO_PROVISIONAL_THRESHOLD
      ? ELO_K_PROVISIONAL
      : ELO_K_ESTABLISHED;
  const kLoser =
    loserMatches < ELO_PROVISIONAL_THRESHOLD
      ? ELO_K_PROVISIONAL
      : ELO_K_ESTABLISHED;

  const expectedWinner =
    1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 - expectedWinner;

  const change = Math.round(kWinner * (1 - expectedWinner));

  return {
    winnerNew: winnerRating + change,
    loserNew: Math.max(
      loserRating - Math.round(kLoser * expectedLoser),
      ELO_RATING_FLOOR
    ),
    change,
  };
}
