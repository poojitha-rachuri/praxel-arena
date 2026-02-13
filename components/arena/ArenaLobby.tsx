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
  Link2,
  Share2,
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
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

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

  const handleChallengeAFriend = useCallback(async () => {
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
        const link = `${window.location.origin}/compete/invite/${data.duel.id}`;
        setInviteLink(link);
        // Try to share via Web Share API
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Praxel Arena Duel`,
              text: `I challenged you to a ${skill.name} duel on Praxel Arena!`,
              url: link,
            });
          } catch {
            // User cancelled or not supported — link is still visible
          }
        }
        // Refresh duels
        setDuels((prev) => [
          {
            id: data.duel.id,
            status: "WAITING",
            skill: { name: skill.name, slug: skill.slug, icon: skill.icon },
            createdAt: new Date().toISOString(),
            completedAt: null,
            winnerId: null,
          },
          ...prev,
        ]);
        return;
      }
      console.error("Failed to create challenge:", data);
    } catch (error) {
      console.error("Failed to create challenge:", error);
    } finally {
      setIsCreating(false);
    }
  }, [selectedSkill, isCreating, skills]);

  const handleCopyInvite = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
  }, [inviteLink]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 p-4">
      {/* Arena header */}
      <div>
        <h1 className="bg-gradient-to-r from-violet-400 to-primary bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
          Arena
        </h1>
        <p className="text-xs text-muted-foreground">
          Head-to-head skill duels with Elo ratings
        </p>
      </div>

      {/* Skill selector — 2-column grid */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Choose your arena
        </p>
        <div className="grid grid-cols-2 gap-2">
          {skills.map((skill, i) => (
            <motion.button
              key={skill.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: "spring", ...CARD_SPRING }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setSelectedSkill(skill.id);
                setInviteLink(null);
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all min-h-[44px]",
                selectedSkill === skill.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30"
              )}
            >
              <SkillIcon slug={skill.slug} size="sm" className="size-7" />
              <span className="text-xs font-medium truncate">{skill.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex gap-3">
        <motion.button
          onClick={handleFindOpponent}
          disabled={!selectedSkill || isCreating}
          animate={{ opacity: selectedSkill ? 1 : 0.4 }}
          whileTap={selectedSkill ? { scale: 0.97 } : undefined}
          transition={{ type: "spring", ...CARD_SPRING }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors min-h-[48px]",
            selectedSkill && !isCreating
              ? "bg-gradient-to-r from-violet-600 to-primary text-white shadow-lg shadow-primary/20 cursor-pointer"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isCreating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Swords className="size-4" />
              Find Opponent
            </>
          )}
        </motion.button>

        <motion.button
          onClick={handleChallengeAFriend}
          disabled={!selectedSkill || isCreating}
          animate={{ opacity: selectedSkill ? 1 : 0.4 }}
          whileTap={selectedSkill ? { scale: 0.97 } : undefined}
          transition={{ type: "spring", ...CARD_SPRING }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-colors min-h-[48px]",
            selectedSkill && !isCreating
              ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer"
              : "border-border bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Share2 className="size-4" />
          Challenge Friend
        </motion.button>
      </div>

      {/* Invite link banner */}
      {inviteLink && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3"
        >
          <Link2 className="size-4 shrink-0 text-primary" />
          <p className="flex-1 truncate text-xs text-muted-foreground">
            {inviteLink}
          </p>
          <button
            onClick={handleCopyInvite}
            className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            {inviteCopied ? "Copied!" : "Copy"}
          </button>
        </motion.div>
      )}

      {/* Your Duels — vertical list */}
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
          <div className="flex flex-col gap-2">
            {duels.map((duel, i) => (
              <motion.button
                key={duel.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, type: "spring", ...CARD_SPRING }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/compete/${duel.id}`)}
                className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card/80 p-3 backdrop-blur-sm transition-colors hover:border-primary/30"
              >
                <SkillIcon slug={duel.skill.slug} size="sm" />
                <div className="flex flex-1 flex-col items-start gap-0.5 min-w-0">
                  <span className="text-sm font-semibold truncate w-full text-left">
                    {duel.skill.name}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="size-2.5" />
                    {new Date(duel.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {duel.winnerId === userId && (
                    <Trophy className="size-3.5 text-amber-400" />
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] uppercase tracking-wider border",
                      STATUS_COLORS[duel.status] ?? ""
                    )}
                  >
                    {duel.status.replace("_", " ")}
                  </Badge>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
