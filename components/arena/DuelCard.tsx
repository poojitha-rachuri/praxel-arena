"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DuelCardProps {
  duel: {
    id: string;
    skillName: string;
    status: "WAITING" | "IN_PROGRESS" | "EVALUATING" | "COMPLETED" | "CANCELLED" | "FORFEIT";
    player1Name: string;
    player2Name?: string | null;
    createdAt: string;
  };
  onJoin?: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  WAITING: {
    label: "Waiting",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  EVALUATING: {
    label: "Evaluating",
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground",
  },
  FORFEIT: {
    label: "Forfeit",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export default function DuelCard({ duel, onJoin }: DuelCardProps) {
  const statusCfg = STATUS_CONFIG[duel.status] ?? STATUS_CONFIG.WAITING;
  const isWaiting = duel.status === "WAITING";

  return (
    <Card className="hover:bg-accent/30 transition-colors">
      <CardContent className="flex items-center gap-4 py-3">
        {/* Duel info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {duel.skillName}
            </span>
            <Badge className={cn("text-xs shrink-0", statusCfg.className)}>
              {statusCfg.label}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="truncate">{duel.player1Name}</span>
            <span className="text-muted-foreground/60">vs</span>
            <span className="truncate">
              {duel.player2Name ?? (
                <span className="italic">waiting...</span>
              )}
            </span>
            <span className="ml-auto shrink-0">
              {formatTimeAgo(duel.createdAt)}
            </span>
          </div>
        </div>

        {/* Join button */}
        {isWaiting && onJoin && (
          <Button size="sm" onClick={onJoin} className="shrink-0">
            Join Duel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
