import { SCORING_DIMENSIONS } from "@/lib/scoring/dimensions";

export interface DuelEvaluationInput {
  sprint: {
    title: string;
    difficulty: number;
    interactions: Array<{
      id: string;
      type: string;
      order: number;
      prompt: string;
      options: Array<{ id: string; text: string }>;
      correctAnswer: string | null;
      insightAnswer: string | null;
      timeTarget: number;
    }>;
  };
  player1Responses: Array<{
    interactionId: string;
    answer: string;
    timeSpent: number;
  }>;
  player2Responses: Array<{
    interactionId: string;
    answer: string;
    timeSpent: number;
  }>;
}

export function buildEvaluateDuelPrompt(
  sprint: DuelEvaluationInput["sprint"],
  player1Responses: DuelEvaluationInput["player1Responses"],
  player2Responses: DuelEvaluationInput["player2Responses"]
): { system: string; user: string } {
  const dimensionList = SCORING_DIMENSIONS.map(
    (d) => `- ${d.key}: ${d.label} -- ${d.description}`
  ).join("\n");

  const system = `You are Praxel Duel Judge, a head-to-head competition evaluator for business professionals. You compare two players' performances on the SAME sprint and determine a winner across 6 skill dimensions.

JUDGING PRINCIPLES:
- Evaluate each player independently first, then compare
- Score each player on each dimension 0-100
- For each dimension, declare a winner (the player with the higher score)
- The overall winner is the player who wins MORE dimensions (if tied, use totalScore)
- Be forensically fair: identical answers should get identical scores
- Time efficiency matters: faster correct answers show greater mastery
- Wrong answers on harder interaction types (CURVEBALL, FORCED_TRADEOFF) penalize less than wrong answers on easier types
- The "insight" answer (insightAnswer) indicates deeper understanding -- choosing it shows an edge

SCORING DIMENSIONS:
${dimensionList}

DIMENSION MAPPING BY INTERACTION TYPE:
- SPOT_THE_SIGNAL: primarily analyticalThinking + quantitativeReasoning
- FORCED_TRADEOFF: primarily strategicReasoning + decisionQuality
- FILL_THE_GAP: primarily communicationClarity + analyticalThinking
- RANK_AND_PRIORITIZE: primarily strategicReasoning + decisionQuality
- CURVEBALL: primarily creativeProblemSolving + decisionQuality

ANALYSIS REQUIREMENTS:
- Your analysis must be a compelling 2-3 sentence narrative comparing the two players
- Reference specific moments where one player outperformed the other
- If the match is close, acknowledge it -- do not manufacture artificial separation
- Use "player1" and "player2" as identifiers (actual names mapped externally)

OUTPUT FORMAT:
Return a single JSON object. No markdown, no commentary, just valid JSON.`;

  // Build side-by-side comparison for each interaction
  const comparisonDetails = sprint.interactions
    .sort((a, b) => a.order - b.order)
    .map((interaction) => {
      const p1Response = player1Responses.find(
        (r) => r.interactionId === interaction.id
      );
      const p2Response = player2Responses.find(
        (r) => r.interactionId === interaction.id
      );
      const p1Option = interaction.options.find(
        (o: { id: string; text: string }) => o.id === p1Response?.answer
      );
      const p2Option = interaction.options.find(
        (o: { id: string; text: string }) => o.id === p2Response?.answer
      );

      return {
        order: interaction.order,
        type: interaction.type,
        prompt: interaction.prompt,
        correctAnswer: interaction.correctAnswer,
        insightAnswer: interaction.insightAnswer,
        timeTarget: interaction.timeTarget,
        player1: {
          answer: p1Response?.answer ?? "NO_RESPONSE",
          answerText: p1Option?.text ?? "No response",
          isCorrect: p1Response?.answer === interaction.correctAnswer,
          timeSpent: p1Response?.timeSpent ?? 0,
        },
        player2: {
          answer: p2Response?.answer ?? "NO_RESPONSE",
          answerText: p2Option?.text ?? "No response",
          isCorrect: p2Response?.answer === interaction.correctAnswer,
          timeSpent: p2Response?.timeSpent ?? 0,
        },
      };
    });

  const user = `Evaluate this head-to-head duel:

SPRINT: "${sprint.title}" (Difficulty: ${sprint.difficulty}/5)

SIDE-BY-SIDE COMPARISON:
${JSON.stringify(comparisonDetails, null, 2)}

Return JSON in this exact format:
{
  "winnerId": "player1 or player2",
  "player1Scores": {
    "analyticalThinking": 0,
    "strategicReasoning": 0,
    "quantitativeReasoning": 0,
    "communicationClarity": 0,
    "decisionQuality": 0,
    "creativeProblemSolving": 0
  },
  "player2Scores": {
    "analyticalThinking": 0,
    "strategicReasoning": 0,
    "quantitativeReasoning": 0,
    "communicationClarity": 0,
    "decisionQuality": 0,
    "creativeProblemSolving": 0
  },
  "dimensionWinners": {
    "analyticalThinking": "player1 or player2",
    "strategicReasoning": "player1 or player2",
    "quantitativeReasoning": "player1 or player2",
    "communicationClarity": "player1 or player2",
    "decisionQuality": "player1 or player2",
    "creativeProblemSolving": "player1 or player2"
  },
  "analysis": "2-3 sentence narrative comparing the players, referencing specific interaction moments"
}

CRITICAL REQUIREMENTS:
- All scores 0-100 per dimension
- winnerId must be "player1" or "player2" (the one who wins more dimensions; tiebreak by total score)
- dimensionWinners: for each dimension, the player with the higher score
- analysis must reference at least one specific interaction where players diverged
- Be fair: same answer + same time = same score for that interaction`;

  return { system, user };
}
