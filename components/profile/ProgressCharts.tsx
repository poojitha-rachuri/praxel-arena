"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Trophy, BarChart3, Zap } from "lucide-react";
import { CARD_SPRING } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";

interface DataPoint {
  attemptId: string;
  completedAt: string | null;
  totalScore: number;
  sprintTitle: string;
  skillName: string;
}

interface Summary {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  improvementPercent: number;
}

interface ProgressData {
  dataPoints: DataPoint[];
  summary: Summary;
}

interface ProgressChartsProps {
  skills: { name: string; slug: string }[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <Icon className={cn("size-4 mx-auto mb-1", color)} />
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DataPoint; value: number }[];
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card p-2 shadow-lg text-xs">
      <p className="font-medium">{data.sprintTitle}</p>
      <p className="text-muted-foreground">{data.skillName}</p>
      <p className="font-bold mt-1">Score: {data.totalScore}</p>
      {data.completedAt && (
        <p className="text-muted-foreground">
          {new Date(data.completedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
}

export default function ProgressCharts({ skills }: ProgressChartsProps) {
  const [selectedSkill, setSelectedSkill] = useState<string>("all");
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const url =
      selectedSkill === "all"
        ? "/api/progress"
        : `/api/progress?skill=${encodeURIComponent(selectedSkill)}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Progress fetch failed: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSkill]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Loading progress...
      </div>
    );
  }

  if (!data || data.dataPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Complete sprints to see your progress over time
      </div>
    );
  }

  const chartData = data.dataPoints.map((dp, i) => ({
    ...dp,
    index: i + 1,
    label:
      dp.completedAt
        ? new Date(dp.completedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : `#${i + 1}`,
  }));

  return (
    <div className="space-y-4">
      {/* Skill filter */}
      {skills.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedSkill("all")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              selectedSkill === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            All Skills
          </button>
          {skills.map((s) => (
            <button
              key={s.slug}
              onClick={() => setSelectedSkill(s.slug)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                selectedSkill === s.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Summary stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: CARD_SPRING.stiffness,
          damping: CARD_SPRING.damping,
        }}
        className="grid grid-cols-4 gap-2"
      >
        <StatCard
          icon={BarChart3}
          label="Attempts"
          value={data.summary.totalAttempts}
          color="text-primary"
        />
        <StatCard
          icon={TrendingUp}
          label="Average"
          value={`${data.summary.averageScore}%`}
          color="text-blue-500"
        />
        <StatCard
          icon={Trophy}
          label="Best"
          value={`${data.summary.bestScore}%`}
          color="text-yellow-500"
        />
        <StatCard
          icon={Zap}
          label="Growth"
          value={`${data.summary.improvementPercent > 0 ? "+" : ""}${data.summary.improvementPercent}%`}
          color={data.summary.improvementPercent >= 0 ? "text-success" : "text-danger"}
        />
      </motion.div>

      {/* Score trend line chart */}
      {chartData.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: CARD_SPRING.stiffness,
            damping: CARD_SPRING.damping,
            delay: 0.1,
          }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h3 className="text-xs font-semibold text-muted-foreground mb-3">
            Score Trend
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="totalScore"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--primary)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
