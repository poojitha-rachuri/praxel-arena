"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { CARD_SPRING } from "@/lib/utils/constants";

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
              "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors min-h-[100px]",
              isSelected
                ? "border-primary bg-primary/10 ring-1 ring-primary"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <span className="text-2xl">{skill.icon ?? "🎯"}</span>
            <div>
              <p className="text-sm font-semibold leading-tight">
                {skill.name}
              </p>
              {skill.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
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
