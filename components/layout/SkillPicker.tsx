"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";
import { SkillIcon } from "@/components/ui/SkillIcon";

export interface SkillPickerSkill {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

interface SkillPickerProps {
  skills: SkillPickerSkill[];
  onSelect: (slug: string) => void;
  selectedSlug?: string;
}

export default function SkillPicker({
  skills,
  onSelect,
  selectedSlug,
}: SkillPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {skills.map((skill, index) => {
        const isSelected = selectedSlug === skill.slug;
        return (
          <motion.button
            key={skill.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: CARD_SPRING.stiffness,
              damping: CARD_SPRING.damping,
              delay: index * 0.05,
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(skill.slug)}
            className={cn(
              "flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-all min-h-[100px]",
              isSelected
                ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-[0_0_12px_var(--color-primary)/0.15]"
                : "border-border/60 bg-surface-1 hover:bg-surface-2 hover:border-primary/40"
            )}
          >
            <div className="flex items-center gap-2">
              <SkillIcon slug={skill.slug} size="sm" />
              {isSelected && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Selected
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">
                {skill.name}
              </p>
              {skill.description && (
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {skill.description}
                </p>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
