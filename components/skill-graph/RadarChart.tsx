"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";
import { SCORING_DIMENSIONS } from "@/lib/scoring/dimensions";
import { CARD_SPRING } from "@/lib/utils/constants";

interface RadarChartProps {
  scores: Record<string, number>;
  comparisonScores?: Record<string, number>;
  size?: number;
  animated?: boolean;
  label?: string;
  comparisonLabel?: string;
}

const SHORT_LABELS: Record<string, string> = {
  analyticalThinking: "Analytical",
  strategicReasoning: "Strategic",
  quantitativeReasoning: "Quantitative",
  communicationClarity: "Communication",
  decisionQuality: "Decision",
  creativeProblemSolving: "Creative",
};

export default function RadarChart({
  scores,
  comparisonScores,
  size = 300,
  animated = true,
  label = "You",
  comparisonLabel = "Opponent",
}: RadarChartProps) {
  const data = SCORING_DIMENSIONS.map((dim) => ({
    dimension: SHORT_LABELS[dim.key] ?? dim.label,
    [label]: scores[dim.key] ?? 0,
    ...(comparisonScores
      ? { [comparisonLabel]: comparisonScores[dim.key] ?? 0 }
      : {}),
  }));

  const chart = (
    <ResponsiveContainer width="100%" height={size}>
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid
          stroke="var(--border)"
          strokeOpacity={0.8}
          gridType="polygon"
        />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{
            fill: "var(--foreground)",
            fontSize: 11,
            fontWeight: 500,
          }}
          tickLine={false}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
          axisLine={false}
          tickCount={5}
        />
        <Radar
          name={label}
          dataKey={label}
          stroke="var(--primary)"
          strokeWidth={2}
          fill="var(--primary)"
          fillOpacity={0.15}
          dot={{
            r: 3,
            fill: "var(--primary)",
            stroke: "var(--primary)",
            strokeWidth: 1,
          }}
          animationDuration={animated ? 1200 : 0}
          animationEasing="ease-out"
        />
        {comparisonScores && (
          <Radar
            name={comparisonLabel}
            dataKey={comparisonLabel}
            stroke="var(--mode-compete)"
            strokeWidth={2}
            fill="var(--mode-compete)"
            fillOpacity={0.1}
            dot={{
              r: 3,
              fill: "var(--mode-compete)",
              stroke: "var(--mode-compete)",
              strokeWidth: 1,
            }}
            animationDuration={animated ? 1200 : 0}
            animationEasing="ease-out"
          />
        )}
      </RechartsRadarChart>
    </ResponsiveContainer>
  );

  if (!animated) {
    return <div style={{ width: "100%", maxWidth: size }}>{chart}</div>;
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: CARD_SPRING.stiffness,
        damping: CARD_SPRING.damping,
        delay: 0.1,
      }}
      style={{ width: "100%", maxWidth: size }}
    >
      {chart}
    </motion.div>
  );
}
