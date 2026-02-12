"use client";

import { motion } from "motion/react";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface CredentialBadgeProps {
  type: "PRACTITIONER" | "EXPERT" | "MASTER" | "GRANDMASTER";
  skillName: string;
  compact?: boolean;
}

const CREDENTIAL_CONFIG = {
  PRACTITIONER: {
    label: "Practitioner",
    color: "text-zinc-300 bg-zinc-300/15 border-zinc-300/30",
    glow: "shadow-zinc-300/20",
  },
  EXPERT: {
    label: "Expert",
    color: "text-amber-400 bg-amber-400/15 border-amber-400/30",
    glow: "shadow-amber-400/20",
  },
  MASTER: {
    label: "Master",
    color: "text-cyan-400 bg-cyan-400/15 border-cyan-400/30",
    glow: "shadow-cyan-400/20",
  },
  GRANDMASTER: {
    label: "Grandmaster",
    color: "text-violet-300 bg-violet-300/15 border-violet-300/30",
    glow: "shadow-violet-300/20",
  },
};

export function CredentialBadge({
  type,
  skillName,
  compact = false,
}: CredentialBadgeProps) {
  const config = CREDENTIAL_CONFIG[type];

  if (compact) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
          config.color
        )}
      >
        <Shield className="size-3" />
        <span className="text-[10px] font-bold">{config.label}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3",
        config.color,
        config.glow,
        "shadow-lg"
      )}
    >
      <Shield className="size-5 shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-bold">{config.label}</div>
        <div className="truncate text-xs opacity-70">{skillName}</div>
      </div>
    </motion.div>
  );
}
