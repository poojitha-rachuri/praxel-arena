const MOBILE_WPM = 200;
const MIN_DISPLAY_MS = 2000;
const MAX_DISPLAY_MS = 8000;
const BUFFER_FACTOR = 1.3;
const LEARN_CORRECT_MS = 1500;

/**
 * Calculate how long feedback should display before auto-advancing.
 *
 * - LEARN + correct:   1.5s green flash then auto-advance
 * - LEARN + incorrect: returns null → manual "Continue" (read insight)
 * - LEARN + null:      returns null → manual "Continue" (tradeoff-type)
 * - PRACTICE:          reading-speed-based duration (2-8s depending on text length)
 * - COMPETE:           fast 1.2s flash
 */
export function calculateFeedbackDuration(
  insightText: string | null,
  mode: "LEARN" | "PRACTICE" | "COMPETE",
  isCorrect?: boolean | null
): number | null {
  if (mode === "COMPETE") return 1200;

  if (mode === "LEARN") {
    // Correct → brief celebration then auto-advance
    if (isCorrect === true) return LEARN_CORRECT_MS;
    // Incorrect or null (tradeoff) → manual Continue so user reads insight
    return null;
  }

  // PRACTICE: reading-speed-based
  if (!insightText) return MIN_DISPLAY_MS;
  const words = insightText.trim().split(/\s+/).length;
  const readingTimeMs = (words / MOBILE_WPM) * 60 * 1000 * BUFFER_FACTOR;
  return Math.min(MAX_DISPLAY_MS, Math.max(MIN_DISPLAY_MS, readingTimeMs));
}
