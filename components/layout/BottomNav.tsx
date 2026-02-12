"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { BookOpen, Target, Swords, Brain, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const tabs = [
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Target },
  { href: "/compete", label: "Compete", icon: Swords },
  { href: "/challenge", label: "Challenge", icon: Brain },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-[60px] items-center justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (!isActive) {
                  trackEvent("mode_selected", { mode: label });
                }
              }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-2 py-1 min-w-[56px] min-h-[44px] transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-medium leading-none">
                {label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
