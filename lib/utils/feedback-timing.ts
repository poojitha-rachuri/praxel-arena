const MOBILE_WPM = 200;
const MIN_DISPLAY_MS = 2000;
const MAX_DISPLAY_MS = 8000;
const BUFFER_FACTOR = 1.3;

/**
 * Calculate how long feedback should display before auto-advancing.
 *
 * - LEARN:    returns null → manual "Continue" (no auto-advance)
 * - PRACTICE: reading-speed-based duration (2–8s depending on text length)
 * - COMPETE:  fast 1.2s flash
 */
export function calculateFeedbackDuration(
  insightText: string | null,
  mode: "LEARN" | "PRACTICE" | "COMPETE"
): number | null {
  if (mode === "LEARN") return null;
  if (mode === "COMPETE") return 1200;

  // PRACTICE: reading-speed-based
  if (!insightText) return MIN_DISPLAY_MS;
  const words = insightText.trim().split(/\s+/).length;
  const readingTimeMs = (words / MOBILE_WPM) * 60 * 1000 * BUFFER_FACTOR;
  return Math.min(MAX_DISPLAY_MS, Math.max(MIN_DISPLAY_MS, readingTimeMs));
}
