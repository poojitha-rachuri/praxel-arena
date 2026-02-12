"use client";

import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="size-8" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex size-8 items-center justify-center rounded-lg bg-surface-1 hover:bg-surface-2 transition-colors"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {isDark ? (
          <Moon className="size-4 text-foreground" />
        ) : (
          <Sun className="size-4 text-foreground" />
        )}
      </motion.div>
    </button>
  );
}
