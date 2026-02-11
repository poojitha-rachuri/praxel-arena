---
title: "Build Review Omnibus - Critical Fixes from Phases 01-07"
date: 2026-02-12
phase: "Phase 07 - Compete Mode + Polish"
status: implemented
severity: [critical, high, medium, low]
tags:
  - leaderboard-data-source
  - duel-winner-perspective
  - ai-fallback-resilience
  - api-contract-mismatch
  - xss-security
  - docker-prisma-client
  - animation-polish
  - input-validation
  - race-condition
  - n-plus-one
categories:
  - logic-errors
  - security-issues
  - integration-issues
  - build-errors
  - runtime-errors
  - ui-bugs
agents-affected:
  - "Agent 2: AI-ENGINE"
  - "Agent 3: DATA-BACKEND"
  - "Agent 4: SKILLGRAPH-PROFILE"
  - "Agent 5: PAGES-FLOWS"
---

# Build Review Omnibus - Critical Fixes

All fixes discovered during rapid iteration + 6-agent code review of the Praxel Arena hackathon build (Feb 11-12, 2026).

## Summary

| # | Fix | Severity | Commit | Category |
|---|-----|----------|--------|----------|
| 1 | Leaderboard reads from wrong table | CRITICAL | bc965d7 | logic-error |
| 2 | Duel stuck in EVALUATING when AI fails | CRITICAL | 370cc2c | runtime-error |
| 3 | XSS via dangerouslySetInnerHTML | CRITICAL | a040495 | security |
| 4 | Dockerfile missing Prisma client | CRITICAL | 4bcdc08 | build-error |
| 5 | Winner display inverted for player2 | HIGH | 040b3ce | logic-error |
| 6 | Duel evaluation data shape mismatch | HIGH | bfd5486 | integration |
| 7 | Input validation missing in evaluate | HIGH | a040495 | security |
| 8 | N+1 query in matchmaking | MEDIUM | a040495 | performance |
| 9 | Non-atomic duel join (race condition) | MEDIUM | a040495 | architecture |
| 10 | Animation polish (Elo + feedback) | LOW | 1e4bd7e | ux-polish |

---

## Fix 1: Leaderboard Reads from Wrong Table

**Symptom:** Leaderboard page shows "No rankings yet" despite users having completed duels.

**Root Cause:** The leaderboard API read from `LeaderboardEntry` table, which was never populated. The evaluate API's duel completion transaction updates `UserEloRating`, not `LeaderboardEntry`.

**Before:**
```typescript
const entries = await prisma.leaderboardEntry.findMany({
  where: { skillId: skill.id },
  orderBy: { eloRating: "desc" },
  // ...
});
```

**After:**
```typescript
const eloEntries = await prisma.userEloRating.findMany({
  where: { skillId: skill.id },
  orderBy: { rating: "desc" },
  take: 50,
  include: {
    user: { select: { id: true, name: true, imageUrl: true } },
  },
});
```

**File:** `app/api/leaderboard/route.ts`

**Lesson:** When multiple tables contain similar data, document which is the source of truth. The write path (evaluate API) and read path (leaderboard API) must agree on the same table.

---

## Fix 2: Duel Stuck in EVALUATING When AI Fails

**Symptom:** After both players complete a duel, the "AI Evaluating..." spinner hangs indefinitely.

**Root Cause:** `evaluateDuel()` called the Claude API directly with no try/catch. If the API times out, returns malformed JSON, or hits rate limits, the error propagates but the duel stays in `EVALUATING` status forever.

**Before:**
```typescript
export async function evaluateDuel(...): Promise<DuelEvaluation> {
  // Direct Claude API call -- no error handling
  const response = await anthropic.messages.create({ ... });
  return parseResult(response);
}
```

**After:**
```typescript
export async function evaluateDuel(...): Promise<DuelEvaluation> {
  try {
    return await evaluateDuelWithAI(...);
  } catch (error) {
    console.error("[evaluateDuel] AI failed, using deterministic fallback:", error);
    return evaluateDuelDeterministic(...);
  }
}

function evaluateDuelDeterministic(...): DuelEvaluation {
  const p1Scores = distributeToDimensions(sprint.interactions, p1Responses);
  const p2Scores = distributeToDimensions(sprint.interactions, p2Responses);
  const p1Total = DIMENSION_KEYS.reduce((s, k) => s + p1Scores[k], 0);
  const p2Total = DIMENSION_KEYS.reduce((s, k) => s + p2Scores[k], 0);
  const winnerId = p1Total >= p2Total ? player1Id : player2Id;
  // ... Elo calculation, dimension winners
  return { winnerId, player1Scores, player2Scores, dimensionWinners, eloChange, analysis };
}
```

**File:** `lib/scoring/evaluate.ts`

**Lesson:** Always wrap external API calls in try/catch with a deterministic fallback. Duels must always reach a terminal state (COMPLETED or CANCELLED), never hang in EVALUATING.

---

## Fix 3: XSS via dangerouslySetInnerHTML

**Symptom:** Not user-visible, discovered in code review. Components rendered bold markdown using `dangerouslySetInnerHTML`.

**Root Cause:** Interaction prompts use `**bold**` syntax. Components converted this to HTML via regex, then injected with `dangerouslySetInnerHTML`. If a prompt contained `<script>` tags, they would execute.

**Before:**
```tsx
<p dangerouslySetInnerHTML={{
  __html: prompt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}} />
```

**After:**
```tsx
// lib/utils/safe-html.tsx
export function renderBoldPrompt(text: string): ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-primary font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// In components:
<p>{renderBoldPrompt(prompt)}</p>
```

**Files:** `components/interactions/SpotTheSignal.tsx`, `ForcedTradeoff.tsx`, `Curveball.tsx`, `lib/utils/safe-html.tsx` (new)

**Lesson:** Never use `dangerouslySetInnerHTML` for text formatting. Use React element construction instead -- React auto-escapes content.

---

## Fix 4: Dockerfile Missing Prisma Generated Client

**Symptom:** Production container crashes on startup: "Cannot find module '@/app/generated/prisma/client'".

**Root Cause:** The multi-stage Dockerfile copied `prisma/` and `.next/standalone` to the runner stage, but not the generated Prisma client at `app/generated/`. Next.js standalone mode doesn't include all generated files.

**Fix:** Added one line to Dockerfile:
```dockerfile
COPY --from=builder /app/app/generated ./app/generated
```

**File:** `Dockerfile`

**Lesson:** When using Next.js `output: "standalone"` with Prisma, explicitly copy the generated client directory to the runner stage. Don't assume standalone includes everything.

---

## Fix 5: Winner Display Inverted for Player2

**Symptom:** When you win a duel as player2, the UI shows your opponent as the winner.

**Root Cause:** The evaluate API already maps `winnerId` to "player1"/"player2" labels before storing in the duel record. But `DuelPageClient` had unnecessary perspective-swap logic that inverted the winner when `duel.isPlayer1 === false`.

**Before:**
```typescript
isWinner: duel.isPlayer1
  ? evalData.winnerId === "player1"
  : evalData.winnerId === "player2"  // WRONG: inverts for player2
```

**After:**
```typescript
isWinner: evalData.winnerId === "player1"  // Direct: labels are canonical
```

**File:** `components/arena/DuelPageClient.tsx`

**Lesson:** Don't transform data that's already normalized. If the API returns canonical labels ("player1"/"player2"), use them directly. Document which layer is responsible for perspective normalization.

---

## Fix 6: Duel Evaluation Data Shape Mismatch

**Symptom:** Duel results page shows UUID strings instead of player names, or crashes trying to compare UUIDs to labels.

**Root Cause:** `evaluateDuel()` returns `winnerId` as a user ID (UUID) and `dimensionWinners` as user IDs. But `DuelPageClient` expects `winnerId` as "player1"/"player2" and `dimensionWinners` as player names.

**Fix:** Map user IDs to labels before storing evaluation JSON:
```typescript
const winnerLabel = duelResult.winnerId === duel.player1Id ? "player1" : "player2";
const dimensionWinnersAsNames: Record<string, string> = {};
for (const [key, userId] of Object.entries(duelResult.dimensionWinners)) {
  dimensionWinnersAsNames[key] = userId === duel.player1Id ? p1Name : p2Name;
}
```

**File:** `app/api/evaluate/route.ts`

**Lesson:** Define shared TypeScript types for API response shapes. The server should transform data to the shape the client expects before storing it.

---

## Fix 7: Missing Input Validation in Evaluate Route

**Symptom:** Not user-visible, discovered in code review.

**Root Cause:** The `/api/evaluate` route accepted `interactionId` values without checking they belong to the claimed sprint. A malicious client could submit responses referencing interactions from a different sprint.

**Fix:**
```typescript
const validIds = new Set(sprint.interactions.map((i) => i.id));
for (const r of responses) {
  if (!validIds.has(r.interactionId)) {
    return NextResponse.json({ error: "Invalid interaction ID" }, { status: 400 });
  }
}
```

**File:** `app/api/evaluate/route.ts`

**Lesson:** Validate that referenced entity IDs belong to the parent entity. Don't trust client-provided IDs at API boundaries.

---

## Fix 8: N+1 Query in Matchmaking

**Symptom:** Slow matchmaking response times with many waiting duels.

**Root Cause:** Matchmaking loop fetched waiting duels, then for each duel made a separate query for the opponent's Elo rating.

**Fix:** Use `include` to eager-load Elo ratings in the initial query:
```typescript
const waitingDuels = await prisma.duel.findMany({
  where: { status: "WAITING", skillId },
  include: {
    player1: {
      select: { eloRatings: { where: { skillId }, select: { rating: true } } }
    }
  }
});
```

**File:** `app/api/duels/route.ts`

---

## Fix 9: Non-Atomic Duel Join (Race Condition)

**Symptom:** Rare: two users could join the same duel simultaneously.

**Root Cause:** Check-then-update pattern: fetch duel, verify WAITING status, then update. A race window exists between the check and the update.

**Fix:** Use atomic update with WHERE clause:
```typescript
const updatedDuel = await prisma.duel.update({
  where: { id, status: "WAITING", player1Id: { not: currentUserId } },
  data: { player2Id: currentUserId, status: "IN_PROGRESS" }
});
```

**File:** `app/api/duels/route.ts`

---

## Fix 10: Animation Polish

**Symptom:** Elo changes and answer feedback felt flat.

**Fix:** Replaced linear springs with keyframe arrays for bounce-scale effects:

```typescript
// EloDisplay: overshoot-bounce on rating change
animate={{ scale: [0.8, 1.08, 0.97, 1] }}
transition={{ duration: 0.6, ease: "easeOut", times: [0, 0.4, 0.7, 1] }}

// InteractionCard: check/X icon pop
animate={{ scale: [0, 1.15, 0.95, 1.05, 1] }}
transition={{ duration: 0.5, ease: "easeOut", times: [0, 0.35, 0.55, 0.75, 1] }}
```

**Files:** `components/arena/EloDisplay.tsx`, `components/interactions/InteractionCard.tsx`

---

## Prevention Patterns

### 1. Single Source of Truth
For each piece of data, document which table is canonical. If `UserEloRating` is the source of truth for rankings, don't also read from `LeaderboardEntry`.

### 2. AI Resilience
Always wrap external AI calls in try/catch with deterministic fallback. Status must always reach a terminal state.

### 3. No dangerouslySetInnerHTML
Use React element construction for text formatting. Add ESLint rule `react/no-danger: error`.

### 4. API Contract Types
Define shared TypeScript types for API responses. The server transforms data to the client-expected shape before storing.

### 5. Atomic Updates
Use Prisma WHERE clause filtering in updates to avoid check-then-update race conditions.

### 6. Eager Loading
Use `include` to batch-fetch relations. Never query in a loop.

### 7. Docker Artifacts
Explicitly copy all generated directories (Prisma client, etc.) to the Docker runner stage.

### 8. Input Validation at Boundaries
Validate that referenced entity IDs belong to the expected parent entity.
