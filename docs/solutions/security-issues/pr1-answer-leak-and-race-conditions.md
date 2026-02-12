---
title: "PR #1: Answer Leak in COMPETE Mode + Race Conditions & Timer Leaks"
category: security-issues
severity: high
date: 2026-02-12
tags:
  - api-routes
  - authentication
  - race-conditions
  - timer-leaks
  - data-sanitization
  - react-19
  - motion-12
  - semantic-tokens
  - compete-mode
  - sprint-runner
module: interactions, api, arena
symptom: "COMPETE mode API responses included correctAnswer/insightAnswer; SprintRunner had timer leaks, double-tap bugs, and stale closures; ResultsReveal had branching cleanup; design tokens were inconsistent"
root_cause: "Missing server-side answer stripping for competitive play; React 19 useRef/useEffect patterns not followed; legacy color tokens from pre-design-system code"
resolution: "17 fixes across 15 files addressing P1 security, P1 race conditions, P2 performance, P2 architecture, and P3 cleanup"
pr_url: "https://github.com/poojitha-rachuri/praxel-arena/pull/1"
related:
  - docs/solutions/2026-02-12-build-review-omnibus-fixes.md
---

# PR #1: Answer Leak in COMPETE Mode + Race Conditions & Timer Leaks

## Problem Statement

After building the initial Praxel Arena platform (interaction engine, AI engine, data backend, skill graph, and pages/flows), a comprehensive 8-agent code review identified **21 findings** across 6 severity categories. The most critical issues were:

1. **COMPETE mode answer leak**: API routes returned `correctAnswer` and `insightAnswer` fields in duel responses, allowing players to cheat by inspecting network traffic
2. **SprintRunner timer leaks**: `setTimeout` calls were not stored in refs, causing memory leaks on unmount
3. **SprintRunner double-tap vulnerability**: Rapid tapping could submit the same interaction twice
4. **SprintRunner stale streak closure**: `streak` state was captured in a stale closure inside `useCallback`
5. **ResultsReveal branching cleanup**: Timer cleanup used conditional returns, violating React's useEffect contract
6. **Evaluate route cost amplification**: AI evaluation ran before input validation, wasting expensive API calls

## Investigation Steps

### Multi-Agent Review Process

Eight specialized review agents ran in parallel against the PR:

| Agent | Focus | Findings |
|-------|-------|----------|
| Security Sentinel | Vulnerabilities, data exposure | Answer leak (P1), validation ordering (P1) |
| Performance Oracle | Memory, rendering, polling | Timer leaks (P1), SWR polling (P2), AnimatedNumber (P2) |
| Frontend Races Reviewer | Race conditions, timing | Double-tap (P1), stale closure (P1), AnimatePresence mode (P2) |
| Architecture Strategist | Patterns, consistency | Semantic tokens (P2), design system gaps |
| Pattern Recognition | DRY, conventions | Dead imports (P3), type collapse (P3) |
| TypeScript Reviewer | Type safety, correctness | Union type collapse (P3), let vs const (P3) |
| Code Simplicity | Over-engineering | Confirmed minimal approach needed |
| Git History Analyzer | Evolution context | First PR, no historical patterns |

### Synthesis

21 raw findings deduplicated to **6 P1 (critical)**, **8 P2 (important)**, and **7 P3 (nice-to-have)** issues.

## Root Cause Analysis

### 1. Answer Leak (Security)

Both `app/api/duels/route.ts` and `app/api/duels/[duelId]/route.ts` returned full sprint data including `correctAnswer` and `insightAnswer` fields. In COMPETE mode, this allows cheating via DevTools Network tab. The server trusted the client to hide answers rather than stripping them server-side.

### 2. Timer Leaks (React 19 Lifecycle)

`SprintRunner.tsx` called `setTimeout` for feedback delays but never stored the timer ID. On component unmount (e.g., navigating away mid-sprint), the callback would fire after the component was gone, potentially causing state updates on unmounted components and memory leaks.

### 3. Double-Tap Bug (Race Condition)

Between a user tapping an answer and the feedback timer advancing to the next card, there was no guard preventing a second tap. The `handleAnswer` callback would process the same interaction twice, corrupting the responses array.

### 4. Stale Streak Closure (React Hook Pattern)

`streak` was listed in `useCallback` dependencies, but because `setStreak` was called inside the same callback, the closure captured the old value. Each correct answer incremented from the stale base rather than the current count.

### 5. Branching Cleanup (React useEffect Contract)

`ResultsReveal.tsx` had early returns inside `useEffect` before the cleanup function. React requires a **single return path** for cleanup; conditional returns meant some timers were never cleared.

### 6. Validation Ordering (Cost Amplification)

`evaluate/route.ts` called `evaluateAttempt()` (which invokes Claude Sonnet 4.5) before validating that the interaction ID existed. Invalid requests still consumed expensive AI API credits.

## Solution

### P1 Fixes (6 Critical)

#### Fix 1: ResultsReveal Timer Cleanup

Flattened branching cleanup to a single return path:

```typescript
// components/layout/ResultsReveal.tsx
useEffect(() => {
  const chartTimer = setTimeout(() => setShowChart(true), 800);
  const detailsTimer = setTimeout(() => setShowDetails(true), 2000);
  let celebrationTimer: ReturnType<typeof setTimeout> | undefined;
  if (!celebratedRef.current) {
    celebratedRef.current = true;
    celebrationTimer = setTimeout(() => {
      onSprintComplete(totalScore);
    }, 1200);
  }
  return () => {
    clearTimeout(chartTimer);
    clearTimeout(detailsTimer);
    if (celebrationTimer) clearTimeout(celebrationTimer);
  };
}, [onSprintComplete, totalScore]);
```

#### Fix 2: SprintRunner setTimeout Leak

Stored feedback timer in a ref with useEffect cleanup:

```typescript
// components/interactions/SprintRunner.tsx
const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

useEffect(() => {
  return () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  };
}, []);

// In handleAnswer:
feedbackTimerRef.current = setTimeout(() => { /* ... */ }, feedbackDelay);
```

#### Fix 3: SprintRunner Double-Tap Guard

Added `submittedRef` to prevent duplicate submissions:

```typescript
const submittedRef = useRef(false);

const handleAnswer = useCallback((answer: string) => {
  if (!currentInteraction) return;
  if (submittedRef.current) return; // Guard
  submittedRef.current = true;
  // ... process answer ...
  feedbackTimerRef.current = setTimeout(() => {
    submittedRef.current = false; // Reset for next card
    // ... advance ...
  }, feedbackDelay);
}, [/* deps without streak */]);
```

#### Fix 4: SprintRunner Stale Streak

Used a ref alongside state to avoid stale closure:

```typescript
const streakRef = useRef(0);

// In handleAnswer:
if (finalCorrect === true) {
  const newStreak = streakRef.current + 1;
  streakRef.current = newStreak;
  setStreak(newStreak);
  onCorrect(newStreak);
} else if (finalCorrect === false) {
  streakRef.current = 0;
  setStreak(0);
}
```

#### Fix 5: COMPETE Mode Answer Stripping

Created `sanitizeDuelForClient()` helper applied to all response points:

```typescript
// app/api/duels/route.ts
function sanitizeDuelForClient(duel: Record<string, unknown>) {
  const sprint = duel.sprint as Record<string, unknown> | null;
  if (!sprint || sprint.mode !== "COMPETE") return duel;
  const interactions = sprint.interactions as Record<string, unknown>[];
  return {
    ...duel,
    sprint: {
      ...sprint,
      interactions: interactions.map((i) => ({
        ...i,
        correctAnswer: null,
        insightAnswer: null,
      })),
    },
  };
}
```

Also applied in `app/api/duels/[duelId]/route.ts` inline.

#### Fix 6: Evaluate Validation Ordering

Moved interaction ID validation **before** the expensive `evaluateAttempt()` call:

```typescript
// app/api/evaluate/route.ts
// 1. Validate interaction exists FIRST
const interaction = await prisma.interaction.findUnique({ where: { id: interactionId } });
if (!interaction) return NextResponse.json({ error: "..." }, { status: 404 });

// 2. THEN call expensive AI evaluation
const result = await evaluateAttempt(/* ... */);
```

### P2 Fixes (5 Applied)

| Fix | File | Change |
|-----|------|--------|
| AnimatedNumber controls.stop() | ResultsReveal.tsx | Store `animate()` return in `let controls` and call `controls?.stop()` in cleanup |
| SWR background polling | Leaderboard.tsx | Added `refreshWhenHidden: false` to SWR config |
| AnimatePresence mode | StreakBadge.tsx | Added `mode="wait"` to prevent overlapping animations |
| celebratedRef reset | MatchResult.tsx | Reset `celebratedRef.current = false` in useEffect cleanup for React Strict Mode |
| Semantic design tokens | 4 interaction components | Migrated `emerald-*` to `success`, `amber-*` to `warning`, `red-*` to `danger` |

### P3 Fixes (6 Applied)

| Fix | Files | Change |
|-----|-------|--------|
| Dead Badge imports | 5 interaction components | Removed unused `import { Badge }` |
| Collapsed union types | SprintRunner.tsx | `InteractionType \| string` to `string` with comment; `InteractionOption[] \| unknown` to `unknown` |
| let to const | duels/route.ts | Changed `let sprint` to `const sprint` |

## Prevention Strategies

### 1. Server-Side Data Sanitization

**Rule**: Never send sensitive data to the client and trust UI to hide it. Always strip server-side.

```typescript
// Pattern: Create sanitization helpers per entity
function sanitizeForClient<T extends Record<string, unknown>>(
  entity: T,
  sensitiveFields: string[]
): T {
  const sanitized = { ...entity };
  for (const field of sensitiveFields) {
    delete sanitized[field];
  }
  return sanitized;
}
```

### 2. Timer Cleanup Pattern

**Rule**: Every `setTimeout`/`setInterval` inside a component must be stored in a ref and cleared on unmount.

```typescript
// Pattern: Timer ref with cleanup
const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

useEffect(() => {
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, []);

// Usage:
timerRef.current = setTimeout(() => { /* ... */ }, delay);
```

### 3. Submission Guard Pattern

**Rule**: Any handler that triggers async side effects (timers, API calls) must have a ref-based guard.

```typescript
const submittedRef = useRef(false);

const handleSubmit = useCallback(() => {
  if (submittedRef.current) return;
  submittedRef.current = true;
  // ... async work ...
  // Reset when ready for next submission
}, []);
```

### 4. Ref + State Pattern for Closures

**Rule**: When a value is both displayed (needs state) and read inside callbacks (needs current value), use both:

```typescript
const [count, setCount] = useState(0);
const countRef = useRef(0);

// Update both:
const newCount = countRef.current + 1;
countRef.current = newCount;
setCount(newCount);

// Read current value in callbacks:
console.log(countRef.current); // Always fresh
```

### 5. Validate Before Expensive Operations

**Rule**: Always validate input before calling external APIs or running expensive computations.

### 6. useEffect Cleanup Contract

**Rule**: Never use early returns before the cleanup function in useEffect. Always use a single return path.

### 7. Design Token Consistency

**Rule**: Use semantic tokens (`success`, `warning`, `danger`) instead of color primitives (`emerald-*`, `amber-*`, `red-*`). This ensures theme consistency and makes dark mode work correctly.

## Verification

All fixes verified by:

1. `npm run build` - clean TypeScript compilation, 0 errors
2. All 17 fixes applied across 15 files
3. PR #1 squash-merged to main (commit 715c244)
4. 8 review agents confirmed fixes address all P1/P2 findings

## Files Changed

| File | Changes |
|------|---------|
| `components/layout/ResultsReveal.tsx` | Timer cleanup, AnimatedNumber fix |
| `components/interactions/SprintRunner.tsx` | setTimeout ref, double-tap guard, streakRef, type fixes |
| `app/api/evaluate/route.ts` | Validation ordering |
| `app/api/duels/[duelId]/route.ts` | Strip answers in COMPETE mode |
| `app/api/duels/route.ts` | sanitizeDuelForClient helper, let to const |
| `components/arena/Leaderboard.tsx` | refreshWhenHidden |
| `components/arena/MatchResult.tsx` | celebratedRef reset |
| `components/gamification/StreakBadge.tsx` | AnimatePresence mode="wait" |
| `components/interactions/Curveball.tsx` | Semantic tokens, dead import |
| `components/interactions/FillTheGap.tsx` | Semantic tokens, dead import |
| `components/interactions/ForcedTradeoff.tsx` | Dead import |
| `components/interactions/InteractionCard.tsx` | Semantic tokens |
| `components/interactions/RankAndPrioritize.tsx` | Semantic tokens |
| `components/interactions/SpotTheSignal.tsx` | Dead import |
| `components/interactions/TeachAndTest.tsx` | Dead import |

## Resources

- PR: [#1 Fix API 404s + UI overhaul with celebrations](https://github.com/poojitha-rachuri/praxel-arena/pull/1)
- Related: [docs/solutions/2026-02-12-build-review-omnibus-fixes.md](../2026-02-12-build-review-omnibus-fixes.md)
- Plan: [docs/plans/2026-02-12-fix-api-failures-and-ui-overhaul-plan.md](../../plans/2026-02-12-fix-api-failures-and-ui-overhaul-plan.md)
- React 19 useRef: Requires initial value argument (TS2554 without it)
- Motion 12: `AnimatePresence mode="wait"` prevents overlapping transitions
