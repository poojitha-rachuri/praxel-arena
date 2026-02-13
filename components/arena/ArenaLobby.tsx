"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Swords,
  Loader2,
  Clock,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CARD_SPRING } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";
import { SkillIcon } from "@/components/ui/SkillIcon";

interface Skill {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface Duel {
  id: string;
  status: string;
  skill: { name: string; slug: string; icon: string | null };
  createdAt: string;
  completedAt: string | null;
  winnerId: string | null;
}

interface ArenaLobbyProps {
  skills: Skill[];
  userId: string;
}

const STATUS_COLORS: Record<string, string> = {
  WAITING: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  IN_PROGRESS: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  EVALUATING: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-muted text-muted-foreground",
  FORFEIT: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function ArenaLobby({ skills, userId }: ArenaLobbyProps) {
  const router = useRouter();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [loadingDuels, setLoadingDuels] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/duels")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        if (!cancelled) setDuels(data.duels ?? []);
      })
      .catch((err) => console.error("Failed to fetch duels:", err))
      .finally(() => {
        if (!cancelled) setLoadingDuels(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleFindOpponent = useCallback(async () => {
    if (!selectedSkill || isCreating) return;
    setIsCreating(true);
    try {
      const skill = skills.find((s) => s.id === selectedSkill);
      if (!skill) return;
      const res = await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillSlug: skill.slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.duel?.id) {
        router.push(`/compete/${data.duel.id}`);
        return;
      }
      console.error("Failed to create duel:", data);
    } catch (error) {
      console.error("Failed to create duel:", error);
    } finally {
      setIsCreating(false);
    }
  }, [selectedSkill, isCreating, skills, router]);

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Arena header with gradient text */}
      <div>
        <h1 className="bg-gradient-to-r from-violet-400 to-primary bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
          Compete
        </h1>
        <p className="text-xs text-muted-foreground">
          Head-to-head skill duels with Elo ratings
        </p>
      </div>

      {/* Skill pill selector */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Choose your arena
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {skills.map((skill, i) => (
            <motion.button
              key={skill.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, type: "spring", ...CARD_SPRING }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSkill(skill.id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all min-h-[36px]",
                selectedSkill === skill.id
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <SkillIcon slug={skill.slug} size="sm" className="size-6" />
              <span>{skill.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Hero CTA */}
      <motion.button
        onClick={handleFindOpponent}
        disabled={!selectedSkill || isCreating}
        animate={{
          opacity: selectedSkill ? 1 : 0.4,
          scale: selectedSkill ? 1 : 0.98,
        }}
        whileTap={selectedSkill ? { scale: 0.97 } : undefined}
        transition={{ type: "spring", ...CARD_SPRING }}
        className={cn(
          "flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition-colors min-h-[56px]",
          selectedSkill && !isCreating
            ? "bg-gradient-to-r from-violet-600 to-primary text-white shadow-lg shadow-primary/20 cursor-pointer"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {isCreating ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <>
            <Swords className="size-5" />
            Find Opponent
          </>
        )}
      </motion.button>

      {/* Your Duels — horizontal scroll */}
      <div>
        <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Your Duels
        </h2>

        {loadingDuels ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : duels.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-8 text-center">
            <Swords className="mb-2 size-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              No duels yet. Pick a skill and find an opponent!
            </p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {duels.map((duel, i) => (
              <motion.button
                key={duel.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, type: "spring", ...CARD_SPRING }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/compete/${duel.id}`)}
                className="flex min-w-[200px] snap-start flex-col gap-2 rounded-xl border border-border/50 bg-card/80 p-3 backdrop-blur-sm transition-colors hover:border-primary/30"
              >
                <div className="flex items-center gap-2">
                  <SkillIcon slug={duel.skill.slug} size="sm" />
                  <span className="flex-1 truncate text-xs font-semibold">
                    {duel.skill.name}
                  </span>
                  {duel.winnerId === userId && (
                    <Trophy className="size-3.5 text-amber-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] uppercase tracking-wider border",
                      STATUS_COLORS[duel.status] ?? ""
                    )}
                  >
                    {duel.status.replace("_", " ")}
                  </Badge>
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Clock className="size-2.5" />
                    {new Date(duel.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-end">
                  <ChevronRight className="size-3 text-muted-foreground" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
