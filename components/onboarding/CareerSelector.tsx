"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CARD_SPRING } from "@/lib/utils/constants";
import { getCareerIcon } from "@/lib/utils/career-icons";

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
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold tracking-tight"
        >
          Choose Your Path
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-1 text-sm text-muted-foreground"
        >
          Select 1–3 career goals
        </motion.p>
      </div>

      {/* Horizontal swipeable cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-hide"
      >
        {careers.map((career, index) => {
          const isSelected = selected.has(career.id);
          const Icon = getCareerIcon(career.slug);
          return (
            <motion.button
              key={career.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: CARD_SPRING.stiffness,
                damping: CARD_SPRING.damping,
                delay: index * 0.04,
              }}
              whileTap={{ scale: 0.96 }}
              onClick={() => toggle(career.id)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center snap-center shrink-0",
                "min-w-[150px] w-[150px] transition-all touch-manipulation",
                isSelected
                  ? "border-primary bg-primary/10 ring-2 ring-primary shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg transition-colors",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>
              <p className="text-xs font-semibold leading-tight">
                {career.name}
              </p>
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
                    className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Check className="size-3" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Counter + Continue */}
      <div className="flex flex-col items-center gap-2">
        <Button
          size="lg"
          disabled={selected.size === 0 || loading}
          onClick={() => onComplete(Array.from(selected))}
          className="w-full max-w-xs"
        >
          {loading ? "Setting up..." : "Continue"}
        </Button>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                i < selected.size ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
          <span className="ml-1 text-xs text-muted-foreground">
            {selected.size}/3
          </span>
        </div>
      </div>
    </div>
  );
}
