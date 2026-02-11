export const SCORING_DIMENSIONS = [
  {
    key: "analyticalThinking",
    label: "Analytical Thinking",
    description: "Breaking down complex problems into components",
  },
  {
    key: "strategicReasoning",
    label: "Strategic Reasoning",
    description: "Evaluating long-term implications and tradeoffs",
  },
  {
    key: "quantitativeReasoning",
    label: "Quantitative Reasoning",
    description: "Working with numbers, estimates, and data",
  },
  {
    key: "communicationClarity",
    label: "Communication Clarity",
    description: "Expressing ideas clearly and persuasively",
  },
  {
    key: "decisionQuality",
    label: "Decision Quality",
    description: "Making sound decisions under uncertainty",
  },
  {
    key: "creativeProblemSolving",
    label: "Creative Problem Solving",
    description: "Finding novel approaches to challenges",
  },
] as const;

export type DimensionKey = (typeof SCORING_DIMENSIONS)[number]["key"];

export type DimensionScores = Record<DimensionKey, number>;

export const DIMENSION_KEYS: DimensionKey[] = SCORING_DIMENSIONS.map(
  (d) => d.key
);
