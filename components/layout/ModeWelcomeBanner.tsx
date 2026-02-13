"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const BANNER_COPY = {
  LEARN:
    "Pick any skill below and tap a sprint to begin. Each sprint has 8 interactive cards \u2014 read, think, answer. ~2 minutes per sprint.",
  PRACTICE:
    "Same skills, harder pace. Cards auto-advance on a timer. After each sprint, AI analyzes your weak spots.",
  COMPETE:
    "Challenge another player to the same sprint. AI compares your responses and picks a winner.",
  CHALLENGE:
    "AI-powered conversations and timed challenges. Pick a skill and challenge type above to start.",
} as const;

type BannerMode = keyof typeof BANNER_COPY;

interface ModeWelcomeBannerProps {
  mode: BannerMode;
  hasCompletions: boolean;
}

export default function ModeWelcomeBanner({
  mode,
  hasCompletions,
}: ModeWelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (hasCompletions || dismissed) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
        {BANNER_COPY[mode]}
      </p>
      <button
        onClick={() => {
          setDismissed(true);
          trackEvent("mode_banner_dismissed", { mode });
        }}
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
