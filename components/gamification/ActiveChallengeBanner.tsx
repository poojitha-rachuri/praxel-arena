"use client";

import useSWR from "swr";
import Link from "next/link";
import { motion } from "motion/react";
import { Trophy, Timer, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ActiveChallengeBanner() {
  const { data, error } = useSWR("/api/challenges", fetcher, {
    refreshInterval: 60000,
  });

  if (error) return null;

  const activeCount = data?.challenges?.length ?? 0;

  if (activeCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Link
        href="/challenges"
        className={cn(
          "flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3",
          "transition-colors hover:bg-primary/10"
        )}
      >
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-primary" />
          <span className="text-sm font-medium">
            {activeCount} active challenge{activeCount !== 1 ? "s" : ""}
          </span>
          <Timer className="size-3 text-muted-foreground" />
        </div>
        <ArrowRight className="size-4 text-primary" />
      </Link>
    </motion.div>
  );
}
