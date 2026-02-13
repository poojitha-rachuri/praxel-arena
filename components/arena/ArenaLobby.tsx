"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Swords,
  Loader2,
  Link2,
  Share2,
  Info,
} from "lucide-react";
import { CARD_SPRING } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";
import { SkillIcon } from "@/components/ui/SkillIcon";

interface Skill {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface ArenaLobbyProps {
  skills: Skill[];
  userId: string;
}

export default function ArenaLobby({ skills, userId }: ArenaLobbyProps) {
  const router = useRouter();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  /** Shared duel creation  -  returns the new duel data or null on failure */
  const createDuel = useCallback(async (skillSlug: string): Promise<{ id: string } | null> => {
    const res = await fetch("/api/duels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillSlug }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.duel?.id) return body.duel;
    console.error("Failed to create duel:", body);
    return null;
  }, []);

  const handleFindOpponent = useCallback(async () => {
    if (!selectedSkill || isCreating) return;
    const skill = skills.find((s) => s.id === selectedSkill);
    if (!skill) return;
    setIsCreating(true);
    try {
      const duel = await createDuel(skill.slug);
      if (duel) router.push(`/compete/${duel.id}`);
    } catch (error) {
      console.error("Failed to create duel:", error);
    } finally {
      setIsCreating(false);
    }
  }, [selectedSkill, isCreating, skills, router, createDuel]);

  const handleChallengeAFriend = useCallback(async () => {
    if (!selectedSkill || isCreating) return;
    const skill = skills.find((s) => s.id === selectedSkill);
    if (!skill) return;
    setIsCreating(true);
    try {
      const duel = await createDuel(skill.slug);
      if (duel) {
        const link = `${window.location.origin}/compete/invite/${duel.id}`;
        setInviteLink(link);
        if (typeof navigator !== "undefined" && navigator.share) {
          try {
            await navigator.share({
              title: `Praxel Arena Duel`,
              text: `I challenged you to a ${skill.name} duel on Praxel Arena!`,
              url: link,
            });
          } catch {
            // User cancelled  -  link is still visible
          }
        }
      }
    } catch (error) {
      console.error("Failed to create challenge:", error);
    } finally {
      setIsCreating(false);
    }
  }, [selectedSkill, isCreating, skills, createDuel]);

  const handleCopyInvite = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      // Clipboard API not available in this context
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

      {/* How it works */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5">
        <Info className="size-4 shrink-0 text-primary mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Pick a skill, then find a random opponent or challenge a friend. You both answer the same sprint  -  highest score wins Elo points.
        </p>
      </div>

      {/* Skill selector  -  2-column grid */}
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
    </div>
  );
}
