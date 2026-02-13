"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Clock, ChevronDown, BookOpen, Target, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";
import { SkillIcon } from "@/components/ui/SkillIcon";

interface AttemptSummary {
  id: string;
  sprintTitle: string;
  skillName: string;
  skillSlug: string;
  skillIcon: string | null;
  mode: string;
  totalScore: number;
  completedAt: string | null;
}

interface AttemptHistoryProps {
  initialAttempts: AttemptSummary[];
  initialCursor: string | null;
}

const MODE_ICON: Record<string, typeof BookOpen> = {
  LEARN: BookOpen,
  PRACTICE: Target,
  COMPETE: Swords,
};

const MODE_COLOR: Record<string, string> = {
  LEARN: "bg-blue-500/10 text-blue-500",
  PRACTICE: "bg-amber-500/10 text-amber-500",
  COMPETE: "bg-purple-500/10 text-purple-500",
};

function formatRelativeDate(isoDate: string): string {
  const now = Date.now();
  const date = new Date(isoDate).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function AttemptCard({ attempt }: { attempt: AttemptSummary }) {
  const router = useRouter();
  const ModeIcon = MODE_ICON[attempt.mode] ?? BookOpen;
  const modeColor = MODE_COLOR[attempt.mode] ?? MODE_COLOR.LEARN;

  const scoreColor =
    attempt.totalScore >= 80
      ? "text-success"
      : attempt.totalScore >= 60
        ? "text-warning"
        : "text-danger";

  const barColor =
    attempt.totalScore >= 80
      ? "bg-success"
      : attempt.totalScore >= 60
        ? "bg-warning"
        : "bg-danger";

  return (
    <button
      onClick={() => router.push(`/results/${attempt.id}`)}
      className="w-full text-left rounded-xl border border-border bg-card p-3 hover:bg-muted/50 transition-colors active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <SkillIcon slug={attempt.skillSlug} size="sm" className="size-7" />
          <span className="text-xs font-medium truncate">
            {attempt.skillName}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              modeColor
            )}
          >
            <ModeIcon className="size-2.5" />
            {attempt.mode}
          </span>
        </div>
        <span className={cn("text-sm font-bold tabular-nums shrink-0", scoreColor)}>
          {attempt.totalScore}%
        </span>
      </div>

      <p className="text-xs text-muted-foreground truncate mb-2">
        {attempt.sprintTitle}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${attempt.totalScore}%` }}
          />
        </div>
        {attempt.completedAt && (
          <span
            className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5"
            title={new Date(attempt.completedAt).toLocaleString()}
          >
            <Clock className="size-2.5" />
            {formatRelativeDate(attempt.completedAt)}
          </span>
        )}
      </div>
    </button>
  );
}

export default function AttemptHistory({
  initialAttempts,
  initialCursor,
}: AttemptHistoryProps) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(initialAttempts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/attempts?limit=20&cursor=${encodeURIComponent(cursor)}`);
      if (!res.ok) return;
      const data = await res.json();
      setAttempts((prev) => [...prev, ...data.attempts]);
      setCursor(data.nextCursor);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [cursor]);

  if (attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          No attempts yet. Complete your first sprint to start tracking your progress.
        </p>
        <Button size="sm" onClick={() => router.push("/learn")}>
          Start Learning
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attempts.map((attempt, i) => (
        <motion.div
          key={attempt.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: CARD_SPRING.stiffness,
            damping: CARD_SPRING.damping,
            delay: Math.min(i * 0.05, 0.3),
          }}
        >
          <AttemptCard attempt={attempt} />
        </motion.div>
      ))}

      {cursor && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loading}
            className="gap-1.5"
          >
            {loading ? "Loading..." : "Show More"}
            {!loading && <ChevronDown className="size-3.5" />}
          </Button>
        </div>
      )}
    </div>
  );
}
