"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Swords, Loader2, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface CompeteLobbyProps {
  skills: Skill[];
  userId: string;
}

const STATUS_COLORS: Record<string, string> = {
  WAITING: "bg-yellow-500/10 text-yellow-500",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500",
  EVALUATING: "bg-purple-500/10 text-purple-500",
  COMPLETED: "bg-green-500/10 text-green-500",
  CANCELLED: "bg-muted text-muted-foreground",
  FORFEIT: "bg-red-500/10 text-red-500",
};

export default function CompeteLobby({ skills, userId }: CompeteLobbyProps) {
  const router = useRouter();
  const [creatingSkill, setCreatingSkill] = useState<string | null>(null);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [loadingDuels, setLoadingDuels] = useState(true);

  // Fetch user's duels
  useEffect(() => {
    let cancelled = false;

    fetch("/api/duels")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setDuels(data.duels ?? []);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch duels:", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingDuels(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const createDuel = async (skillSlug: string) => {
    setCreatingSkill(skillSlug);
    try {
      const res = await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillSlug }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.duel?.id) {
          router.push(`/compete/${data.duel.id}`);
          return;
        }
      }

      const errData = await res.json().catch(() => ({}));
      console.error("Failed to create duel:", errData);
    } catch (error) {
      console.error("Failed to create duel:", error);
    } finally {
      setCreatingSkill(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compete</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Challenge other professionals in head-to-head duels
        </p>
      </div>

      {/* Create Duel */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Create a Duel
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {skills.map((skill, index) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: CARD_SPRING.stiffness,
                damping: CARD_SPRING.damping,
                delay: index * 0.05,
              }}
            >
              <Button
                variant="outline"
                disabled={creatingSkill !== null}
                onClick={() => createDuel(skill.slug)}
                className="flex h-auto w-full flex-col items-center gap-2 p-4 min-h-[80px]"
              >
                {creatingSkill === skill.slug ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <SkillIcon slug={skill.slug} size="sm" />
                    <span className="text-xs font-medium">{skill.name}</span>
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Active / Recent Duels */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your Duels
        </h2>
        {loadingDuels ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : duels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Swords className="size-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No duels yet. Create one above to get started!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {duels.map((duel, index) => (
              <motion.button
                key={duel.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => router.push(`/compete/${duel.id}`)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 min-h-[56px]"
              >
                <SkillIcon slug={duel.skill.slug} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {duel.skill.name} Duel
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(duel.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase tracking-wider",
                    STATUS_COLORS[duel.status] ?? ""
                  )}
                >
                  {duel.status.replace("_", " ")}
                </Badge>
                {duel.winnerId === userId && (
                  <Trophy className="size-4 text-yellow-500" />
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
