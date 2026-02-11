"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import SkillPicker, { type SkillPickerSkill } from "./SkillPicker";
import SprintList, { type SprintListItem } from "./SprintList";
import ModeSelector from "./ModeSelector";
import { CARD_SPRING } from "@/lib/utils/constants";

interface SkillSprintBrowserProps {
  skills: SkillPickerSkill[];
  mode: "LEARN" | "PRACTICE";
  basePath: string; // "/learn" or "/practice"
  title: string;
  subtitle: string;
}

export default function SkillSprintBrowser({
  skills,
  mode,
  basePath,
  title,
  subtitle,
}: SkillSprintBrowserProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>();
  const [sprints, setSprints] = useState<SprintListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedSlug) return;

    let cancelled = false;
    setLoading(true);

    fetch(`/api/sprints?skillSlug=${selectedSlug}&mode=${mode}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const formatted: SprintListItem[] = (data.sprints ?? []).map(
          (s: { id: string; title: string; description: string | null; difficulty: number; interactions: unknown[] }) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            difficulty: s.difficulty,
            interactionCount: (s.interactions ?? []).length,
          })
        );
        setSprints(formatted);
      })
      .catch((err) => {
        console.error("Failed to fetch sprints:", err);
        if (!cancelled) setSprints([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSlug, mode]);

  return (
    <div className="flex flex-col gap-6 p-4">
      <ModeSelector />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <SkillPicker
        skills={skills}
        selectedSlug={selectedSlug}
        onSelect={setSelectedSlug}
      />

      <AnimatePresence mode="wait">
        {selectedSlug && (
          <motion.div
            key={selectedSlug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              type: "spring",
              stiffness: CARD_SPRING.stiffness,
              damping: CARD_SPRING.damping,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold">Available Sprints</h2>
              {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </div>
            {!loading && (
              <SprintList
                sprints={sprints}
                basePath={`${basePath}/${selectedSlug}`}
                emptyMessage={`No ${mode.toLowerCase()} sprints available for this skill yet. Check back soon!`}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
