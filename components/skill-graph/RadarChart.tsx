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
        <defs>
          <linearGradient id="radarGradientPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
          </linearGradient>
          <linearGradient id="radarGradientCompare" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <PolarGrid
          stroke="#333"
          strokeOpacity={0.6}
          gridType="polygon"
        />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{
            fill: "#e2e8f0",
            fontSize: 11,
            fontWeight: 500,
          }}
          tickLine={false}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#666", fontSize: 9 }}
          axisLine={false}
          tickCount={5}
        />
        <Radar
          name={label}
          dataKey={label}
          stroke="#8b5cf6"
          strokeWidth={2}
          fill="url(#radarGradientPrimary)"
          fillOpacity={0.4}
          dot={{
            r: 3,
            fill: "#8b5cf6",
            stroke: "#8b5cf6",
            strokeWidth: 1,
          }}
          animationDuration={animated ? 1200 : 0}
          animationEasing="ease-out"
        />
        {comparisonScores && (
          <Radar
            name={comparisonLabel}
            dataKey={comparisonLabel}
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#radarGradientCompare)"
            fillOpacity={0.3}
            dot={{
              r: 3,
              fill: "#f59e0b",
              stroke: "#f59e0b",
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
