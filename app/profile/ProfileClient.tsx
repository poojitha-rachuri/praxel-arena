"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import RadarChart from "@/components/skill-graph/RadarChart";
import SkillCard from "@/components/skill-graph/SkillCard";
import CareerMatchBar from "@/components/skill-graph/CareerMatchBar";
import AttemptHistory from "@/components/profile/AttemptHistory";
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
import { useState } from "react";

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

interface ProfileClientProps {
  user: {
    name: string | null;
    imageUrl: string | null;
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
    icon: string | null;
    matchPercentage: number;
  }[];
  attemptHistory?: AttemptSummary[];
  attemptCursor?: string | null;
  isOwnProfile?: boolean;
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
  isOwnProfile = false,
}: ProfileClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const hasScores = Object.values(aggregateScores).some((v) => v > 0);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
  }

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
          <Button variant="outline" size="sm" onClick={handleShare}>
            {copied ? "Copied!" : "Share Profile"}
          </Button>
        )}
      </motion.div>

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

      {/* Bottom padding for mobile nav */}
      <div className="h-20" />
    </main>
  );
}
