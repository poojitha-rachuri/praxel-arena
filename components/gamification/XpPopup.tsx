"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap } from "lucide-react";

interface XpNotification {
  id: string;
  amount: number;
  source: string;
}

export function useXpPopup() {
  const [notifications, setNotifications] = useState<XpNotification[]>([]);

  const showXp = useCallback((amount: number, source: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { id, amount, source }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 2000);
  }, []);

  return { notifications, showXp };
}

interface XpPopupProps {
  notifications: XpNotification[];
}

export function XpPopup({ notifications }: XpPopupProps) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: i * 0.1,
            }}
            className="flex items-center gap-2 rounded-full bg-primary/90 px-4 py-2 text-primary-foreground shadow-lg backdrop-blur-sm"
          >
            <Zap className="size-4" />
            <span className="text-sm font-bold tabular-nums">
              +{n.amount} XP
            </span>
            <span className="text-xs opacity-75">{n.source}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
