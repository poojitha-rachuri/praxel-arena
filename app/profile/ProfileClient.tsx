"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import RadarChart from "@/components/skill-graph/RadarChart";
import SkillCard from "@/components/skill-graph/SkillCard";
import CareerMatchBar from "@/components/skill-graph/CareerMatchBar";
import AttemptHistory from "@/components/profile/AttemptHistory";
import { XpBar } from "@/components/gamification/XpBar";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { CredentialBadge } from "@/components/gamification/CredentialBadge";
import dynamic from "next/dynamic";

const ProgressCharts = dynamic(
  () => import("@/components/profile/ProgressCharts"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Loading progress...
      </div>
    ),
    ssr: false,
  }
);
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Crown, Flame, Share2, Swords, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import ShareSheet from "@/components/profile/ShareSheet";
import { SkillIcon } from "@/components/ui/SkillIcon";
import Link from "next/link";

interface AttemptSummary {
  id: string;
  sprintTitle: string;
  skillName: string;
  skillSlug: string;
  skillIcon: string | null;
  mode: string;
  totalScore: number;
  completedAt: string | null;
}

interface DuelSummary {
  id: string;
  skillName: string;
  skillSlug: string;
  skillIcon: string | null;
  completedAt: string | null;
  eloChange: number | null;
  isWinner: boolean;
  isDraw: boolean;
}

interface GamificationData {
  xp: number;
  level: number;
  title: string;
  xpProgress: number;
  xpNeeded: number;
  progressPercent: number;
  currentStreak: number;
  longestStreak: number;
  leagueTier: number;
  leagueTierName: string;
  weeklyXp: number;
  credentials: {
    id: string;
    type: string;
    skillName: string;
    skillSlug: string;
    skillIcon: string | null;
    eloAtGrant: number;
    grantedAt: string;
    verificationCode: string;
  }[];
}

interface ProfileClientProps {
  user: {
    name: string | null;
    imageUrl: string | null;
    id?: string;
  };
  aggregateScores: Record<string, number>;
  skills: {
    name: string;
    slug: string;
    icon: string | null;
    score: number;
    eloRating?: number;
  }[];
  careerMatches: {
    name: string;
    slug: string;
    icon: string | null;
    matchPercentage: number;
  }[];
  attemptHistory?: AttemptSummary[];
  attemptCursor?: string | null;
  gamification?: GamificationData;
  isOwnProfile?: boolean;
  referralCode?: string | null;
  duelHistory?: DuelSummary[];
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfileClient({
  user,
  aggregateScores,
  skills,
  careerMatches,
  attemptHistory = [],
  attemptCursor = null,
  gamification,
  isOwnProfile = false,
  referralCode,
  duelHistory = [],
}: ProfileClientProps) {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");

  useEffect(() => {
    setProfileUrl(
      user.id
        ? `${window.location.origin}/profile/${user.id}`
        : window.location.href
    );
  }, [user.id]);

  const hasScores = Object.values(aggregateScores).some((v) => v > 0);

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Avatar size="lg" className="size-16">
          {user.imageUrl ? (
            <AvatarImage src={user.imageUrl} alt={user.name ?? "User"} />
          ) : null}
          <AvatarFallback className="text-lg">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">{user.name ?? "Unknown User"}</h1>
        {isOwnProfile && (
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
            <Share2 className="size-4 mr-1.5" />
            Share Profile
          </Button>
        )}
      </motion.div>

      {/* Gamification Stats */}
      {gamification && isOwnProfile && (
        <>
          <Separator className="my-6" />
          <section className="w-full space-y-4">
            <XpBar
              level={gamification.level}
              xp={gamification.xp}
              xpProgress={gamification.xpProgress}
              xpNeeded={gamification.xpNeeded}
              progressPercent={gamification.progressPercent}
              title={gamification.title}
            />

            <div className="grid grid-cols-2 gap-3">
              <StreakDisplay streak={gamification.currentStreak} />

              <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5">
                <Crown className="size-5 text-primary" />
                <div>
                  <div className="text-sm font-bold">
                    {gamification.leagueTierName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {gamification.weeklyXp.toLocaleString()} XP this week
                  </div>
                </div>
              </div>
            </div>

            {gamification.longestStreak > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Flame className="size-3" />
                <span>
                  Longest streak: {gamification.longestStreak} days
                </span>
              </div>
            )}
          </section>
        </>
      )}

      {/* Credentials */}
      {gamification && gamification.credentials.length > 0 && (
        <>
          <Separator className="my-6" />
          <section className="w-full space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Credentials
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {gamification.credentials.map((cred, i) => (
                <motion.div
                  key={cred.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <CredentialBadge
                    type={cred.type as "PRACTITIONER" | "EXPERT" | "MASTER" | "GRANDMASTER"}
                    skillName={cred.skillName}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        </>
      )}

      <Separator className="my-6" />

      {/* Radar Chart */}
      <section className="w-full space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Skill Graph
        </h2>
        {hasScores ? (
          <div className="flex justify-center">
            <RadarChart scores={aggregateScores} size={300} animated />
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            Complete sprints to build your skill graph
          </div>
        )}
      </section>

      <Separator className="my-6" />

      {/* Per-Skill Cards */}
      {skills.length > 0 && (
        <section className="w-full space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Skills
          </h2>
          <div className="space-y-2">
            {skills.map((skill, i) => (
              <motion.div
                key={skill.slug}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
              >
                <SkillCard
                  skill={skill}
                  onClick={() => router.push(`/leaderboard?skill=${skill.slug}`)}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {skills.length === 0 && (
        <section className="w-full space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Skills
          </h2>
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            No skill data yet
          </div>
        </section>
      )}

      {/* Career Match Section */}
      {careerMatches.length > 0 && (
        <>
          <Separator className="my-6" />
          <section className="w-full space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Career Match
            </h2>
            <div className="space-y-4">
              {careerMatches.map((career, i) => (
                <motion.div
                  key={career.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                >
                  <CareerMatchBar career={career} />
                </motion.div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Progress Charts */}
      {isOwnProfile && (
        <>
          <Separator className="my-6" />
          <section className="w-full space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Progress
            </h2>
            <ProgressCharts
              skills={skills.map((s) => ({ name: s.name, slug: s.slug }))}
            />
          </section>
        </>
      )}

      {/* Attempt History */}
      {isOwnProfile && (
        <>
          <Separator className="my-6" />
          <section className="w-full space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Attempts
            </h2>
            <AttemptHistory
              initialAttempts={attemptHistory}
              initialCursor={attemptCursor}
            />
          </section>
        </>
      )}

      {/* Duel History */}
      {isOwnProfile && duelHistory.length > 0 && (
        <>
          <Separator className="my-6" />
          <section className="w-full space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Duel History
            </h2>
            <div className="flex flex-col gap-2">
              {duelHistory.map((duel, i) => (
                <motion.div
                  key={duel.id}
                  initial={{ x: -12, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <Link
                    href={`/compete/${duel.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/80 p-3 transition-colors hover:border-primary/30"
                  >
                    <SkillIcon slug={duel.skillSlug} size="sm" />
                    <div className="flex flex-1 flex-col items-start gap-0.5 min-w-0">
                      <span className="text-sm font-semibold truncate w-full text-left">
                        {duel.skillName}
                      </span>
                      {duel.completedAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(duel.completedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {duel.eloChange != null && (
                        <span className={cn(
                          "flex items-center gap-0.5 text-xs font-bold tabular-nums",
                          duel.eloChange > 0 ? "text-success" : duel.eloChange < 0 ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {duel.eloChange > 0 ? <TrendingUp className="size-3" /> : duel.eloChange < 0 ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
                          {duel.eloChange > 0 ? "+" : ""}{duel.eloChange}
                        </span>
                      )}
                      {duel.isWinner ? (
                        <Trophy className="size-4 text-amber-400" />
                      ) : duel.isDraw ? (
                        <Swords className="size-4 text-muted-foreground" />
                      ) : (
                        <Swords className="size-4 text-destructive/60" />
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-20" />

      {/* Share Sheet */}
      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        profileUrl={profileUrl}
        userName={user.name ?? "User"}
        referralCode={referralCode ?? null}
      />
    </main>
  );
}
