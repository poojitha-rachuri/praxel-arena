"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, ArrowUp } from "lucide-react";
import confetti from "canvas-confetti";

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldLevel: number;
  newLevel: number;
  oldTitle?: string;
  newTitle?: string;
}

export function LevelUpModal({
  isOpen,
  onClose,
  oldLevel,
  newLevel,
  oldTitle,
  newTitle,
}: LevelUpModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Fire celebration confetti
      const duration = 1500;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.65 },
          colors: ["#8b5cf6", "#a855f7", "#c084fc", "#e9d5ff"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.65 },
          colors: ["#8b5cf6", "#a855f7", "#c084fc", "#e9d5ff"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [isOpen]);

  const titleChanged = oldTitle && newTitle && oldTitle !== newTitle;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mx-4 w-full max-w-sm rounded-2xl border border-primary/20 bg-card p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/20"
            >
              <Zap className="size-8 text-primary" />
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-2 text-xl font-bold text-foreground"
            >
              Level Up!
            </motion.h2>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6 flex items-center justify-center gap-3"
            >
              <span className="text-3xl font-bold font-mono text-muted-foreground">
                {oldLevel}
              </span>
              <ArrowUp className="size-6 text-primary" />
              <span className="text-4xl font-bold font-mono text-primary">
                {newLevel}
              </span>
            </motion.div>

            {titleChanged && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-6 text-sm text-muted-foreground"
              >
                <span className="line-through">{oldTitle}</span>
                {" "}
                <ArrowUp className="inline size-3" />
                {" "}
                <span className="font-semibold text-primary">{newTitle}</span>
              </motion.div>
            )}

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
