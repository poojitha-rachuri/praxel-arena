"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CARD_SPRING } from "@/lib/utils/constants";

export interface Career {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
}

interface CareerSelectorProps {
  careers: Career[];
  onComplete: (selectedIds: string[]) => void;
  loading?: boolean;
}

export default function CareerSelector({
  careers,
  onComplete,
  loading = false,
}: CareerSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold tracking-tight"
        >
          Choose Your Path
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-2 text-sm text-muted-foreground"
        >
          Select 1-3 career goals to personalize your journey
        </motion.p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {careers.map((career, index) => {
          const isSelected = selected.has(career.id);
          return (
            <motion.button
              key={career.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: CARD_SPRING.stiffness,
                damping: CARD_SPRING.damping,
                delay: index * 0.06,
              }}
              whileTap={{ scale: 0.96 }}
              onClick={() => toggle(career.id)}
              className={cn(
                "relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all min-h-[80px]",
                isSelected
                  ? "border-primary bg-primary/10 ring-2 ring-primary shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/40 hover:bg-card/80"
              )}
            >
              <span className="text-2xl shrink-0 mt-0.5">
                {career.icon ?? "🎯"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">
                  {career.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {career.description}
                </p>
              </div>
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 20,
                    }}
                    className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Check className="size-3.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button
          size="lg"
          disabled={selected.size === 0 || loading}
          onClick={() => onComplete(Array.from(selected))}
          className="w-full max-w-xs"
        >
          {loading ? "Setting up..." : "Continue"}
        </Button>
        <p className="text-xs text-muted-foreground">
          {selected.size}/3 selected
        </p>
      </div>
    </div>
  );
}
