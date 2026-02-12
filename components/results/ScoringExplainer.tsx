"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, HelpCircle } from "lucide-react";
import { SCORING_DIMENSIONS } from "@/lib/scoring/dimensions";

/** Static mapping of how interaction types contribute to dimensions */
const INTERACTION_MAPPING = [
  {
    type: "Spot the Signal",
    primary: "Analytical Thinking",
    secondary: "Quantitative Reasoning",
  },
  {
    type: "Forced Tradeoff",
    primary: "Strategic Reasoning",
    secondary: "Decision Quality",
  },
  {
    type: "Fill the Gap",
    primary: "Communication Clarity",
    secondary: "Analytical Thinking",
  },
  {
    type: "Rank & Prioritize",
    primary: "Strategic Reasoning",
    secondary: "Decision Quality",
  },
  {
    type: "Curveball",
    primary: "Creative Problem Solving",
    secondary: "Decision Quality",
  },
  {
    type: "Teach & Test",
    primary: "Analytical Thinking",
    secondary: "Communication Clarity",
  },
];

export default function ScoringExplainer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <HelpCircle className="size-3" />
        How is this calculated?
      </button>

      {/* Drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/50"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card border-t border-border"
            >
              {/* Handle + close */}
              <div className="sticky top-0 bg-card z-10 px-4 pt-3 pb-2 flex items-center justify-between border-b border-border">
                <div className="mx-auto h-1 w-10 rounded-full bg-muted-foreground/30" />
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute right-3 top-3 p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="px-4 py-4 space-y-5">
                <h2 className="text-base font-semibold">
                  How Your Score is Calculated
                </h2>

                {/* 1. Dimensions */}
                <section>
                  <h3 className="text-sm font-medium mb-2">
                    6 Skill Dimensions
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Every interaction tests one or two of these dimensions.
                    Your total score is the average of all six.
                  </p>
                  <div className="grid gap-2">
                    {SCORING_DIMENSIONS.map((dim) => (
                      <div
                        key={dim.key}
                        className="rounded-lg bg-muted/50 px-3 py-2"
                      >
                        <p className="text-xs font-medium">{dim.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {dim.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 2. Interaction mapping */}
                <section>
                  <h3 className="text-sm font-medium mb-2">
                    Question Type Mapping
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Each question type contributes to a primary dimension (70%
                    weight) and a secondary dimension (30% weight).
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-1.5 pr-2 font-medium">
                            Question Type
                          </th>
                          <th className="text-left py-1.5 pr-2 font-medium">
                            Primary (70%)
                          </th>
                          <th className="text-left py-1.5 font-medium">
                            Secondary (30%)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {INTERACTION_MAPPING.map((row) => (
                          <tr
                            key={row.type}
                            className="border-b border-border/50"
                          >
                            <td className="py-1.5 pr-2 font-medium">
                              {row.type}
                            </td>
                            <td className="py-1.5 pr-2 text-muted-foreground">
                              {row.primary}
                            </td>
                            <td className="py-1.5 text-muted-foreground">
                              {row.secondary}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 3. Scoring rules */}
                <section>
                  <h3 className="text-sm font-medium mb-2">Scoring Rules</h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex gap-2">
                      <span className="text-success font-medium shrink-0">+75</span>
                      <span>Base score for a correct answer</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-success font-medium shrink-0">+8-15</span>
                      <span>
                        Time bonus for answering within the target time
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-danger font-medium shrink-0">-10</span>
                      <span>
                        Maximum time penalty for going over target (correct answers only)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-warning font-medium shrink-0">+15</span>
                      <span>
                        Partial credit on Curveball and Forced Tradeoff
                        questions (even when incorrect)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-primary font-medium shrink-0">~</span>
                      <span>
                        Ranking questions give proportional credit for
                        correctly-placed items
                      </span>
                    </div>
                  </div>
                </section>

                {/* 4. COMPETE mode */}
                <section>
                  <h3 className="text-sm font-medium mb-2">COMPETE Mode</h3>
                  <p className="text-xs text-muted-foreground">
                    In COMPETE mode, Claude AI evaluates your responses
                    holistically across all 6 dimensions, providing nuanced
                    scoring that considers reasoning quality and strategic
                    depth beyond simple right/wrong answers.
                  </p>
                </section>

                {/* 5. Total score */}
                <section className="pb-4">
                  <h3 className="text-sm font-medium mb-2">Total Score</h3>
                  <p className="text-xs text-muted-foreground">
                    Your total score is the average of all 6 dimension scores,
                    each ranging from 0 to 100.
                  </p>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
