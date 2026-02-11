"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import RadarChart from "@/components/skill-graph/RadarChart";
import EloDisplay from "@/components/arena/EloDisplay";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SCORING_DIMENSIONS } from "@/lib/scoring/dimensions";
import { useCelebration } from "@/lib/hooks/use-celebration";
import { cn } from "@/lib/utils";

interface MatchResultProps {
  player1: { name: string; scores: Record<string, number>; isWinner: boolean };
  player2: { name: string; scores: Record<string, number>; isWinner: boolean };
  dimensionWinners: Record<string, string>;
  eloChange: number;
  analysis: string;
}

const SHORT_DIM_LABELS: Record<string, string> = {
  analyticalThinking: "Analytical",
  strategicReasoning: "Strategic",
  quantitativeReasoning: "Quantitative",
  communicationClarity: "Communication",
  decisionQuality: "Decision",
  creativeProblemSolving: "Creative",
};

export default function MatchResult({
  player1,
  player2,
  dimensionWinners,
  eloChange,
  analysis,
}: MatchResultProps) {
  const winner = player1.isWinner ? player1 : player2;
  const { onDuelVictory } = useCelebration();
  const celebratedRef = useRef(false);

  useEffect(() => {
    if (player1.isWinner && !celebratedRef.current) {
      celebratedRef.current = true;
      const timer = setTimeout(() => onDuelVictory(), 600);
      return () => clearTimeout(timer);
    }
  }, [player1.isWinner, onDuelVictory]);

  return (
    <div className="space-y-6">
      {/* Winner Announcement */}
      <motion.div
        className="text-center space-y-2"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <h2 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            {winner.name}
          </span>{" "}
          wins!
        </h2>
        <EloDisplay
          rating={1200 + (player1.isWinner ? eloChange : -eloChange)}
          previousRating={1200}
          showChange
        />
      </motion.div>

      <Separator />

      {/* Overlaid Radar Chart (mobile-first) */}
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <RadarChart
          scores={player1.scores}
          comparisonScores={player2.scores}
          size={320}
          animated
          label={player1.name}
          comparisonLabel={player2.name}
        />
      </motion.div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-violet-500" />
          <span className={cn(player1.isWinner && "font-semibold")}>
            {player1.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className={cn(player2.isWinner && "font-semibold")}>
            {player2.name}
          </span>
        </div>
      </div>

      <Separator />

      {/* Per-Dimension Breakdown */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Dimension Breakdown
        </h3>
        <div className="space-y-1">
          {SCORING_DIMENSIONS.map((dim, i) => {
            const winnerName = dimensionWinners[dim.key];
            const p1Score = player1.scores[dim.key] ?? 0;
            const p2Score = player2.scores[dim.key] ?? 0;
            const p1Wins = winnerName === player1.name;
            const p2Wins = winnerName === player2.name;
            const isTie = !p1Wins && !p2Wins;

            return (
              <motion.div
                key={dim.key}
                className="flex items-center gap-3 rounded-lg px-3 py-2 bg-card"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.3 }}
              >
                {/* Dimension label */}
                <span className="text-sm flex-1 min-w-0 truncate text-muted-foreground">
                  {SHORT_DIM_LABELS[dim.key] ?? dim.label}
                </span>

                {/* Player 1 score */}
                <span
                  className={cn(
                    "text-sm font-mono tabular-nums w-8 text-right",
                    p1Wins && "text-violet-400 font-bold",
                    !p1Wins && "text-muted-foreground"
                  )}
                >
                  {Math.round(p1Score)}
                </span>

                {/* Winner indicator */}
                <div className="w-16 flex justify-center">
                  {isTie ? (
                    <Badge variant="outline" className="text-xs">
                      Tie
                    </Badge>
                  ) : p1Wins ? (
                    <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs">
                      P1
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                      P2
                    </Badge>
                  )}
                </div>

                {/* Player 2 score */}
                <span
                  className={cn(
                    "text-sm font-mono tabular-nums w-8 text-left",
                    p2Wins && "text-amber-400 font-bold",
                    !p2Wins && "text-muted-foreground"
                  )}
                >
                  {Math.round(p2Score)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* AI Analysis */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.4 }}
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          AI Analysis
        </h3>
        <p className="text-sm leading-relaxed text-foreground/80">{analysis}</p>
      </motion.div>
    </div>
  );
}
