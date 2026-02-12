"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Crown, TrendingUp, TrendingDown, Minus, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeagueCardProps {
  tier: number;
  tierName: string;
  rank: number;
  weeklyXp: number;
  totalMembers: number;
  zone: "promote" | "safe" | "demote";
  weekEnd: string;
}

const ZONE_STYLES = {
  promote: "border-emerald-400/30 bg-emerald-400/5",
  safe: "border-border",
  demote: "border-red-400/30 bg-red-400/5",
};

const ZONE_LABELS = {
  promote: { text: "Promotion Zone", icon: TrendingUp, color: "text-emerald-400" },
  safe: { text: "Safe Zone", icon: Minus, color: "text-muted-foreground" },
  demote: { text: "Demotion Zone", icon: TrendingDown, color: "text-red-400" },
};

function useWeekCountdown(weekEnd: string) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(weekEnd).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Week ended");
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      setRemaining(days > 0 ? `${days}d ${hours}h` : `${hours}h`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [weekEnd]);

  return remaining;
}

export function LeagueCard({
  tierName,
  rank,
  weeklyXp,
  totalMembers,
  zone,
  weekEnd,
}: LeagueCardProps) {
  const countdown = useWeekCountdown(weekEnd);
  const zoneInfo = ZONE_LABELS[zone];
  const ZoneIcon = zoneInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn("rounded-xl border p-4", ZONE_STYLES[zone])}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="size-4 text-primary" />
          <span className="text-sm font-bold">{tierName} League</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="size-3" />
          <span>{countdown}</span>
        </div>
      </div>

      <div className="mb-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold font-mono tabular-nums text-foreground">
          #{rank}
        </span>
        <span className="text-sm text-muted-foreground">/ {totalMembers}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <span className="font-mono tabular-nums font-medium text-foreground">
            {weeklyXp.toLocaleString()}
          </span>{" "}
          XP this week
        </div>
        <div className={cn("flex items-center gap-1 text-xs font-medium", zoneInfo.color)}>
          <ZoneIcon className="size-3" />
          <span>{zoneInfo.text}</span>
        </div>
      </div>
    </motion.div>
  );
}
