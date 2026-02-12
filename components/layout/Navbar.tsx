"use client";

import { UserButton } from "@clerk/nextjs";
import { Zap } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import ThemeToggle from "./ThemeToggle";
import { XpBar } from "@/components/gamification/XpBar";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Navbar() {
  const { data: gam, error } = useSWR("/api/gamification", fetcher, {
    refreshInterval: 60000,
  });

  if (error) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md px-4">
      <Link href="/learn" className="flex items-center gap-2">
        <Zap className="size-5 text-primary" />
        <span className="text-base font-bold tracking-tight">
          Praxel Arena
        </span>
      </Link>
      <div className="flex items-center gap-2">
        {gam && (
          <>
            <XpBar
              level={gam.level}
              xp={gam.xp}
              xpProgress={gam.xpProgress}
              xpNeeded={gam.xpNeeded}
              progressPercent={gam.progressPercent}
              title={gam.title}
              compact
            />
            <StreakDisplay streak={gam.currentStreak} compact />
          </>
        )}
        <ThemeToggle />
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "size-8",
            },
          }}
        />
      </div>
    </header>
  );
}
