"use client";

import { motion } from "motion/react";
import { Clock, Zap } from "lucide-react";
import Link from "next/link";
import { CARD_SPRING } from "@/lib/utils/constants";

export interface SprintListItem {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  interactionCount: number;
}

interface SprintListProps {
  sprints: SprintListItem[];
  basePath: string; // e.g. "/learn/guesstimation"
  emptyMessage?: string;
}

export default function SprintList({
  sprints,
  basePath,
  emptyMessage = "No sprints available yet",
}: SprintListProps) {
  if (sprints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sprints.map((sprint, index) => (
        <motion.div
          key={sprint.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: CARD_SPRING.stiffness,
            damping: CARD_SPRING.damping,
            delay: index * 0.06,
          }}
        >
          <Link
            href={`${basePath}/${sprint.id}`}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 active:bg-primary/5 min-h-[72px]"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">
                {sprint.title}
              </p>
              {sprint.description && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                  {sprint.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {sprint.interactionCount * 15}s
              </span>
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`size-1.5 rounded-full ${
                      i < sprint.difficulty
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
