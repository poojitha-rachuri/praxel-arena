---
title: "Phase 1b: AI Engine"
type: feat
date: 2026-02-11
depends_on: [00-foundation]
blocks: [06-integration]
owner: AI-ENGINE agent
estimated_time: 4-6 hours
hackathon_priority: CRITICAL (Opus 4.6 Use 25%)
---

# Phase 1b: AI Engine

**This is where you maximize the "Opus 4.6 Use" judging criterion (25%).**

## Overview

Build Claude API integration for:
1. Sprint generation (COMPETE mode - dynamic content)
2. Sprint evaluation (scoring across 6 dimensions)
3. Duel evaluation (head-to-head AI analysis)
4. Adaptive assessment (initial skill calibration)

## Files to Create/Edit

```
lib/ai/
  client.ts              # Anthropic SDK singleton + generateJSON helper
  generate.ts            # Sprint generation orchestrator
  prompts/
    learn-sprint.ts      # Prompt template for LEARN sprints
    practice-sprint.ts   # Prompt template for PRACTICE sprints
    compete-sprint.ts    # Prompt template for COMPETE sprints
    evaluate-attempt.ts  # Prompt for scoring a sprint attempt
    evaluate-duel.ts     # Prompt for head-to-head evaluation
    adaptive-assess.ts   # Prompt for initial skill assessment
lib/scoring/
  dimensions.ts          # 6 scoring dimensions definition
  evaluate.ts            # Evaluation engine
  elo.ts                 # Elo rating calculator
```

## Opus 4.6 Creative Uses (Hackathon Differentiator!)

Beyond basic completion, showcase Opus 4.6 for:

1. **Dynamic Sprint Generation**: Opus generates coherent 8-interaction business scenarios that unfold like a story. Each interaction builds on prior context. This is NOT just "generate a quiz" -- it's narrative scenario design.

2. **Dimensional Scoring**: Opus evaluates answers across 6 nuanced dimensions (Strategic Thinking, Analytical Rigor, etc.) with mentorship-quality feedback. Not just right/wrong.

3. **Head-to-Head Analysis**: For duels, Opus compares TWO sets of answers and provides dimension-by-dimension analysis of who thought more deeply. Like a business school professor grading two essays.

4. **Adaptive Curveballs**: In COMPETE sprints, interaction #7 (CURVEBALL) references the user's earlier choices. Opus generates contextually-aware pivots.

5. **Mentorship Debrief**: After each sprint, Opus provides personalized mentorship feedback: "You spotted the data signals quickly but defaulted to safe choices when forced to trade off. In real PM decisions, the best leaders take calculated risks..."

## Component Specs

### client.ts
```typescript
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic();

export async function generateJSON<T>(prompt: string, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = message.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('');
      // Strip markdown code fences if present
      const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      return JSON.parse(cleaned) as T;
    } catch (e) {
      if (attempt === maxRetries) throw e;
    }
  }
  throw new Error('generateJSON exhausted retries');
}
```

### generate.ts
- `generateSprint(skillSlug, mode, difficulty, playerElo?)` -> Sprint
- LEARN/PRACTICE: load from DB (static pool)
- COMPETE: call `generateJSON` with compete-sprint prompt
- Validate returned JSON has correct number of interactions + all required fields

### evaluate.ts
- `evaluateAttempt(sprint, responses)` -> EvaluationResponse
- For LEARN/PRACTICE: deterministic scoring based on correctAnswer matching
  - Correct = full points for that interaction
  - InsightAnswer = bonus points
  - Wrong = 0, but still allocate to dimensions via scoringRubric
- For COMPETE: call Opus for nuanced evaluation
- Always returns 6-dimension scores + feedback string

### elo.ts
- `calculateElo(winnerRating, loserRating, winnerMatches, loserMatches)`
- K=32 for < 20 matches, K=16 after
- Floor at 100

## Prompt Template Quality (This is YOUR core IP)

Each prompt must:
- Set Opus as a "business school professor" / "scenario engine"
- Specify exact JSON output format
- Include difficulty calibration rules
- Require plausible wrong answers (no obviously wrong options)
- Cap prompt text at 3 sentences per interaction
- Enforce the 30-second interaction rule

## Done When
- [ ] `generateJSON` works with retry logic
- [ ] COMPETE sprint generation returns valid 8-interaction sprint
- [ ] Sprint evaluation returns 6-dimension scores
- [ ] Duel evaluation compares two attempts with per-dimension winner
- [ ] Elo calculator passes basic test cases
- [ ] All prompt templates produce high-quality, realistic business content
