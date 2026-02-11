"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Loader2, Award, Flame, Target, TrendingUp } from "lucide-react";
import RadarChart from "@/components/skill-graph/RadarChart";
import { Badge } from "@/components/ui/badge";
import { CARD_SPRING } from "@/lib/utils/constants";
import { SCORING_DIMENSIONS } from "@/lib/scoring/dimensions";
import { cn } from "@/lib/utils";

interface SkillScore {
  skillName: string;
  skillIcon: string | null;
  overallScore: number;
  sprintCount: number;
  scores: Record<string, number>;
}

interface EloRating {
  skillName: string;
  skillIcon: string | null;
  rating: number;
  matchCount: number;
}

interface CareerGoal {
  name: string;
  icon: string | null;
}

interface ProfileData {
  name: string | null;
  imageUrl: string | null;
  careerGoals: CareerGoal[];
  skillScores: SkillScore[];
  eloRatings: EloRating[];
  totalSprints: number;
}

interface ProfileViewProps {
  userId: string;
  isOwnProfile: boolean;
}

export default function ProfileView({
  userId,
  isOwnProfile,
}: ProfileViewProps) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  useEffect(() => {
    const endpoint = isOwnProfile
      ? "/api/profile"
      : `/api/profile/${userId}`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        if (data.skillScores?.length > 0) {
          setSelectedSkill(data.skillScores[0].skillName);
        }
      })
      .catch((err) => console.error("Failed to load profile:", err))
      .finally(() => setLoading(false));
  }, [userId, isOwnProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const selectedScores = data.skillScores.find(
    (s) => s.skillName === selectedSkill
  );

  // Aggregate scores across all skills for overall radar
  const aggregateScores: Record<string, number> = {};
  if (data.skillScores.length > 0) {
    for (const dim of SCORING_DIMENSIONS) {
      const total = data.skillScores.reduce(
        (sum, s) => sum + (s.scores[dim.key] ?? 0),
        0
      );
      aggregateScores[dim.key] = Math.round(
        total / data.skillScores.length
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg p-4 flex flex-col gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        {data.imageUrl ? (
          <img
            src={data.imageUrl}
            alt={data.name ?? "User"}
            className="size-14 rounded-full border-2 border-border"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {(data.name ?? "?")[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold">
            {data.name ?? "Anonymous"}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="size-3" />
              {data.totalSprints} sprints
            </span>
            <span className="flex items-center gap-1">
              <Target className="size-3" />
              {data.skillScores.length} skills
            </span>
          </div>
        </div>
      </motion.div>

      {/* Career Goals */}
      {data.careerGoals.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          {data.careerGoals.map((goal) => (
            <Badge key={goal.name} variant="secondary" className="gap-1">
              {goal.icon} {goal.name}
            </Badge>
          ))}
        </motion.div>
      )}

      {/* Overall Radar Chart */}
      {data.skillScores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: CARD_SPRING.stiffness,
            damping: CARD_SPRING.damping,
            delay: 0.15,
          }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h3 className="text-sm font-semibold mb-2 text-center">
            {selectedSkill
              ? `${selectedSkill} Skills`
              : "Overall Skill Profile"}
          </h3>
          <div className="flex justify-center">
            <RadarChart
              scores={selectedScores?.scores ?? aggregateScores}
              size={260}
              animated
            />
          </div>
          {/* Skill tabs */}
          {data.skillScores.length > 1 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {data.skillScores.map((s) => (
                <button
                  key={s.skillName}
                  onClick={() => setSelectedSkill(s.skillName)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs transition-colors",
                    selectedSkill === s.skillName
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s.skillIcon} {s.skillName}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Elo Ratings */}
      {data.eloRatings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h3 className="flex items-center gap-1.5 text-sm font-semibold mb-3">
            <Award className="size-4 text-primary" />
            Compete Ratings
          </h3>
          <div className="flex flex-col gap-2">
            {data.eloRatings.map((elo) => (
              <div
                key={elo.skillName}
                className="flex items-center justify-between"
              >
                <span className="text-sm">
                  {elo.skillIcon} {elo.skillName}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums">
                    {elo.rating}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {elo.matchCount} matches
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {data.skillScores.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <TrendingUp className="size-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-semibold">No scores yet</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Complete your first sprint to see your skill profile
          </p>
        </motion.div>
      )}
    </div>
  );
}
