import confetti from "canvas-confetti";

/** Burst of green confetti for a correct answer */
export function fireCorrectBurst() {
  confetti({
    particleCount: 40,
    spread: 55,
    origin: { y: 0.7 },
    colors: ["#22c55e", "#a3e635", "#4ade80"],
    disableForReducedMotion: true,
  });
}

/** Streak fire confetti (3+ correct in a row) */
export function fireStreakConfetti(streak: number) {
  if (streak < 3) return;
  confetti({
    particleCount: Math.min(30 + streak * 10, 100),
    spread: 70,
    origin: { y: 0.5 },
    colors: ["#f59e0b", "#ef4444", "#f97316"],
    disableForReducedMotion: true,
  });
}

/** Big celebration for sprint completion */
export function celebrateSprint(score: number) {
  if (score < 70) return;
  const intensity = score >= 90 ? 150 : score >= 80 ? 100 : 60;
  confetti({
    particleCount: Math.min(intensity, 150),
    spread: 100,
    origin: { y: 0.6 },
    disableForReducedMotion: true,
  });
}

/** Duel victory celebration */
export function celebrateDuelVictory() {
  // Left cannon
  confetti({
    particleCount: 60,
    angle: 60,
    spread: 50,
    origin: { x: 0, y: 0.7 },
    colors: ["#8b5cf6", "#a855f7", "#c084fc"],
    disableForReducedMotion: true,
  });
  // Right cannon
  confetti({
    particleCount: 60,
    angle: 120,
    spread: 50,
    origin: { x: 1, y: 0.7 },
    colors: ["#8b5cf6", "#a855f7", "#c084fc"],
    disableForReducedMotion: true,
  });
}
