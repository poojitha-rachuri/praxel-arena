"use client";

import { useCallback } from "react";
import {
  fireCorrectBurst,
  fireStreakConfetti,
  celebrateSprint,
  celebrateDuelVictory,
} from "@/lib/utils/celebrations";

export function useCelebration() {
  const onCorrect = useCallback((streak: number) => {
    fireCorrectBurst();
    if (streak >= 3) fireStreakConfetti(streak);
    // Haptic feedback (Android only, no-op on iOS/desktop)
    navigator?.vibrate?.(10);
  }, []);

  const onSprintComplete = useCallback((score: number) => {
    celebrateSprint(score);
    navigator?.vibrate?.([10, 50, 10]);
  }, []);

  const onDuelVictory = useCallback(() => {
    celebrateDuelVictory();
    navigator?.vibrate?.([10, 30, 10, 30, 10]);
  }, []);

  return { onCorrect, onSprintComplete, onDuelVictory };
}
