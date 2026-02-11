"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";

interface SkillCardProps {
  skill: {
    name: string;
    slug: string;
    icon?: string | null;
    score?: number;
    eloRating?: number;
    rank?: number;
  };
  onClick?: () => void;
}

export default function SkillCard({ skill, onClick }: SkillCardProps) {
  const score = skill.score ?? 0;
  const clampedScore = Math.min(100, Math.max(0, score));

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:bg-accent/50",
        onClick && "active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 py-3">
        {/* Icon + Name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-2xl shrink-0" role="img" aria-label={skill.name}>
            {skill.icon ?? "📊"}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{skill.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {skill.eloRating != null && (
                <Badge variant="secondary" className="text-xs">
                  Elo {skill.eloRating}
                </Badge>
              )}
              {skill.rank != null && (
                <Badge variant="outline" className="text-xs">
                  #{skill.rank}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Score Bar */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${clampedScore}%` }}
              transition={{
                type: "spring",
                stiffness: CARD_SPRING.stiffness,
                damping: CARD_SPRING.damping,
                delay: 0.2,
              }}
            />
          </div>
          <span className="text-sm font-mono font-medium w-8 text-right tabular-nums">
            {Math.round(score)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
