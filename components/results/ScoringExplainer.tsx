"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, HelpCircle } from "lucide-react";
import { SCORING_DIMENSIONS } from "@/lib/scoring/dimensions";


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
                    Every question tests multiple dimensions with custom
                    weights. Your total score is the average of all six.
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

                {/* 2. How weights work */}
                <section>
                  <h3 className="text-sm font-medium mb-2">
                    Per-Question Weights
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Each question has its own dimension weight distribution
                    based on what it tests. For example, a data analysis
                    question might weight 60% Quantitative Reasoning, 30%
                    Analytical Thinking, and 10% Decision Quality. Different
                    skills emphasize different dimensions.
                  </p>
                </section>

                {/* 3. Scoring rules */}
                <section>
                  <h3 className="text-sm font-medium mb-2">Scoring Rules</h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex gap-2">
                      <span className="text-success font-medium shrink-0">100</span>
                      <span>Correct answer</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-warning font-medium shrink-0">15</span>
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
                    <div className="flex gap-2">
                      <span className="text-danger font-medium shrink-0">0</span>
                      <span>Incorrect answer</span>
                    </div>
                  </div>
                </section>

                {/* 4. COMPETE mode */}
                <section>
                  <h3 className="text-sm font-medium mb-2">COMPETE Mode</h3>
                  <p className="text-xs text-muted-foreground">
                    In COMPETE mode, Claude AI evaluates your responses
                    holistically across all 6 dimensions, considering reasoning
                    quality and strategic depth beyond simple right/wrong
                    answers.
                  </p>
                </section>

                {/* 5. Total score */}
                <section className="pb-4">
                  <h3 className="text-sm font-medium mb-2">Total Score</h3>
                  <p className="text-xs text-muted-foreground">
                    Your total score is the average of all 6 dimension scores,
                    each ranging from 0 to 100. Accuracy is the only factor.
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
