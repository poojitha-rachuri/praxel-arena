---
title: "fix: Eight Critical Issues - Charts, Compete, Timer, Em Dashes, PostHog, Scoring, Radar, Voice"
type: fix
date: 2026-02-14
---

# Fix: Eight Critical Issues

Eight user-reported bugs and UX problems affecting core functionality.

## Overview

| # | Issue | Severity | Root Cause |
|---|---|---|---|
| 1 | Charts don't show on ANY questions | P0 | **Database never re-seeded** after `chartData` feature was added (Feb 13). All 576 interactions have `chartData: null` in DB despite seed JSONs having data. Secondary: only 2 of 6 interaction types render charts. Compete page omits chartData in serialization. |
| 2 | Compete flow blank screen + matchmaking broken | P0 | **Zero COMPETE-mode sprints exist in seed data.** Duel creation sets `sprintId: null` → blank screen. |
| 3 | Time-based scoring stresses users | P1 | Time bonus/penalty applies in ALL modes. Timer always visible. No opt-out. |
| 4 | Em dashes feel AI-generated | P2 | 524 em dashes across 90 seed JSON files. No style constraint in AI prompt. |
| 5 | PostHog not working | P1 | `NEXT_PUBLIC_POSTHOG_KEY` not set in `.env`. Almost no `trackEvent()` calls exist. |
| 6 | Career % confusing + skill mapping simplistic | P1 | Career match from 1 sprint. Radar after every sprint. Type-only dimension mapping ignores question content. |
| 7 | Radar chart uses same 6 dimensions for all skills | P1 | SKILL.md files define per-skill weightings (HIGH/LOW) but code ignores them. "Quantitative Reasoning" scored on Stakeholder Communication. |
| 8 | ElevenLabs voice integration broken / not optimized | P1 | Voice transcripts NOT displayed in chat UI (`onMessage` is a stub). No mic permission handling. Interactions not optimized for voice input. |

---

## Issue 1: Charts Don't Show on ANY Questions

### Root Cause Analysis (CORRECTED)

The original plan incorrectly assumed SpotTheSignal/TeachAndTest charts worked. They don't. **No chart has ever rendered** because:

**Primary cause: Database never re-seeded.**

| Event | Date | Result |
|---|---|---|
| Database seeded | Feb 11-12 | All interactions created with `chartData: null` |
| chartData feature added | Feb 13 (commit `73a8d83`) | Migration ran, seed JSONs updated, but DB NOT re-seeded |
| User tests app | Feb 14 | All 576 interactions still have `chartData: null` |

The seed files have correct chartData. The seed script writes it (`prisma/seed.ts:549,593`). The migration added the column (`prisma/migrations/20260213151941_add_interaction_chart_data`). But **`npx prisma db seed` was never re-run**.

**Secondary causes** (still need fixing):

1. `SprintRunner.tsx` only passes `chartData` to SpotTheSignal (line 302) and TeachAndTest (line 329). Other 4 types get `{...sharedProps}` which excludes chartData.

2. `app/compete/[duelId]/page.tsx:65-76` — sprint serialization omits `chartData` field entirely.

### Fix

**Step 0: Re-seed the database** (fixes ALL charts immediately):
```bash
npx prisma db seed
```

**Step 1: Add `chartData` to `sharedProps`** in `SprintRunner.tsx` (~line 262) so ALL interaction types receive it:
```typescript
const sharedProps = {
  // ... existing props
  chartData: currentInteraction.chartData,
};
```

**Step 2: Add chart rendering to 4 missing interaction components:**
- `ForcedTradeoff.tsx` — accept `chartData?: unknown`, render `<InteractionChart>` above options
- `FillTheGap.tsx` — same pattern
- `RankAndPrioritize.tsx` — same pattern
- `Curveball.tsx` — same pattern

Each gets:
```tsx
import { InteractionChart } from "./InteractionChart";
// In props: chartData?: unknown;
// In render:
{chartData != null && <InteractionChart chartData={chartData} />}
```

**Step 3: Fix compete page serialization** in `app/compete/[duelId]/page.tsx` line 76:
```typescript
timeTarget: i.timeTarget,
chartData: i.chartData,  // ADD THIS LINE
```

### Verification

After re-seeding, verify chartData exists:
```sql
SELECT COUNT(*) FROM "Interaction" WHERE "chartData" IS NOT NULL;
-- Expected: 576 (all interactions)
```

### Files to Modify

- Run `npx prisma db seed` (no code change — just execution)
- `components/interactions/SprintRunner.tsx` — add chartData to sharedProps
- `components/interactions/ForcedTradeoff.tsx` — add chartData prop + InteractionChart render
- `components/interactions/FillTheGap.tsx` — same
- `components/interactions/RankAndPrioritize.tsx` — same
- `components/interactions/Curveball.tsx` — same
- `app/compete/[duelId]/page.tsx` — add chartData to serialization

### Acceptance Criteria

- [x] `npx prisma db seed` populates chartData for all 576 interactions
- [x] All 6 interaction types render charts when chartData is present
- [x] Charts display correctly (bar, line, pie, area types)
- [x] Compete page passes chartData to SprintRunner
- [x] No chart rendered when chartData is null/undefined (graceful)

---

## Issue 2: Compete Flow Blank Screen + Matchmaking

### Root Cause Analysis

**Primary**: No COMPETE-mode sprints in database. Seed data has only `learn-1.json`, `learn-2.json`, `practice-1.json` per topic. When creating a duel:

1. `app/api/duels/route.ts:242-250` queries `Sprint.findFirst({ mode: "COMPETE" })` → null
2. Line 256: `sprintId: sprint?.id ?? null` → null
3. Duel created with null sprint
4. `DuelPageClient.tsx:169`: `duel.sprint &&` → false → blank screen

**Both invite AND "Find an Opponent" break** because the underlying issue is no sprint content, not broken flow logic.

### Fix

**Phase A: Fallback to PRACTICE sprint** (immediate, no content generation needed):

1. In `app/api/duels/route.ts`, replace lines 241-250:
   ```typescript
   // Try COMPETE sprint first, fallback to PRACTICE
   let sprint = await prisma.sprint.findFirst({
     where: { skillId: skill.id, mode: "COMPETE" },
     include: { interactions: { orderBy: { order: "asc" } } },
   });

   if (!sprint) {
     sprint = await prisma.sprint.findFirst({
       where: { skillId: skill.id, mode: "PRACTICE" },
       include: { interactions: { orderBy: { order: "asc" } } },
     });
   }

   if (!sprint) {
     return NextResponse.json(
       { error: "No sprint available for this skill" },
       { status: 404 }
     );
   }
   ```

2. **Remove `?? null`** from line 256 — use `sprint.id` directly (now guaranteed non-null).

**Phase B: Defensive UI for null sprint**

3. In `DuelPageClient.tsx`, add fallback when status is IN_PROGRESS but sprint is null:
   ```tsx
   {duel.status === "IN_PROGRESS" && !duel.sprint && (
     <motion.div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
       <AlertCircle className="size-10 text-muted-foreground" />
       <p className="text-sm text-muted-foreground">Sprint not available.</p>
       <Button onClick={() => router.push("/compete")}>Back to Arena</Button>
     </motion.div>
   )}
   ```

### Files to Modify

- `app/api/duels/route.ts` — PRACTICE fallback, error guard, remove `?? null`
- `components/arena/DuelPageClient.tsx` — null sprint fallback UI

### Acceptance Criteria

- [x] Creating a duel always attaches a sprint (never null)
- [x] "Find an Opponent" matches two waiting players into the same duel
- [x] Invite link acceptance transitions both players to IN_PROGRESS with content
- [x] Blank screen never shown — either content or error message
- [x] Both players can complete the sprint and see results

---

## Issue 3: Remove Time-Based Scoring Stress

### Current Behavior

- `lib/scoring/evaluate.ts:112-120`: Time bonus (+8 to +15) for fast answers, penalty (up to -10) for slow in ALL modes
- `components/interactions/ProgressBar.tsx`: Sprint timer always visible with yellow/red stress warnings at 90s/110s
- Per-interaction `timeSpent` tracked via `cardStartTimeRef`

### Target Behavior

| Mode | Timer Visible | Time Affects Score |
|---|---|---|
| LEARN | No | No |
| PRACTICE (default) | No | No |
| PRACTICE (timed) | Yes (opt-in) | Yes |
| COMPETE | Yes | Yes |
| CHALLENGE | No | No |

### Fix

1. **`lib/scoring/evaluate.ts`** — add `mode` parameter to `scoreInteractionDeterministic`:
   ```typescript
   function scoreInteractionDeterministic(
     interaction: SprintInteraction,
     response: SprintResponse | undefined,
     mode?: string
   ): { score: number; isCorrect: boolean } {
     // ... existing correct/incorrect logic stays ...

     let score = 75; // base for correct

     // Time bonus/penalty ONLY in COMPETE
     if (mode === "COMPETE") {
       if (timeSpent <= timeTarget) {
         score += Math.round(15 * (1 - (timeSpent / timeTarget) * 0.5));
       } else {
         const overRatio = Math.min((timeSpent - timeTarget) / timeTarget, 1);
         score -= Math.round(10 * overRatio);
       }
     }
     // LEARN/PRACTICE/CHALLENGE: correct = 75pts flat
   }
   ```

2. **Thread `mode` through calling chain**: `evaluateAttempt` → `distributeToDimensions` → `scoreInteractionDeterministic`

3. **`ProgressBar.tsx`** — hide clock for non-timed modes:
   - LEARN/PRACTICE (untimed): Show progress indicator only (step dots or "3 of 8")
   - COMPETE: Full timer with warnings
   - Pass `showTimer` prop from SprintRunner

4. **Add timed practice toggle** in practice mode page — localStorage preference

### Files to Modify

- `lib/scoring/evaluate.ts` — conditional time scoring
- `components/interactions/ProgressBar.tsx` — conditional timer display
- `components/interactions/SprintRunner.tsx` — pass mode/timed to ProgressBar
- Practice mode page — timed toggle

### Acceptance Criteria

- [x] LEARN: no timer visible, no time-based scoring
- [x] PRACTICE (default): no timer, no time-based scoring
- [ ] PRACTICE (timed): timer visible, time affects score (deferred — timed practice toggle)
- [x] COMPETE: timer + time scoring
- [x] CHALLENGE: no timer, no time-based scoring

---

## Issue 4: Remove Em Dashes from Content

### Current State

524 em dash (---) occurrences across all 90 seed data JSON files. Used in `teachingPreamble`, option `text`, `prompt`, and `insightAnswer` fields.

### Fix

1. **One-time cleanup script** `scripts/fix-em-dashes.ts`:
   ```typescript
   // Read all JSON files in prisma/seed-data/**/*.json
   // Replace — with " - " (spaced hyphen)
   // Replace – with " - " (en dash too)
   // Write back, preserving formatting
   ```

2. **Update AI generation prompt** in `scripts/generate-content.ts` system prompt:
   ```
   STYLE RULES:
   - Never use em dashes or en dashes. Use commas, periods, or spaced hyphens instead.
   - Keep sentences concise. Avoid long parenthetical clauses.
   ```

3. **Re-seed database** after fixing JSON files (combined with Issue 1 re-seed).

### Files to Modify

- `scripts/fix-em-dashes.ts` — new one-time script
- `scripts/generate-content.ts` — style constraint in AI prompt
- `prisma/seed-data/**/*.json` — all 90 files (via script)

### Acceptance Criteria

- [x] Zero em/en dashes in seed data JSON
- [x] AI prompt prevents future em dashes
- [x] Content reads naturally

---

## Issue 5: PostHog Not Working

### Root Cause

`NEXT_PUBLIC_POSTHOG_KEY` is not set in `.env` (verified: grep returned no matches). PostHogProvider correctly degrades — no errors, just no tracking. Almost zero `trackEvent()` calls exist.

### Fix

**Phase A: Environment variables**

1. **Add to `.env`** (copy from PostHog dashboard):
   ```
   NEXT_PUBLIC_POSTHOG_KEY=phc_<key>
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```

2. **Add to Railway** for production deployment.

3. **Verify** `/ingest` proxy rewrites in `next.config.ts` work.

**Phase B: Comprehensive event tracking**

4. **Event constants** in `lib/analytics.ts`:
   ```typescript
   export const EVENTS = {
     SPRINT_STARTED: "sprint_started",
     SPRINT_COMPLETED: "sprint_completed",
     INTERACTION_ANSWERED: "interaction_answered",
     DUEL_CREATED: "duel_created",
     DUEL_JOINED: "duel_joined",
     DUEL_COMPLETED: "duel_completed",
     INVITE_COPIED: "invite_link_copied",
     INVITE_ACCEPTED: "invite_accepted",
     CHALLENGE_STARTED: "challenge_started",
     CHALLENGE_COMPLETED: "challenge_completed",
     VOICE_SESSION_STARTED: "voice_session_started",
     VOICE_SESSION_ENDED: "voice_session_ended",
     SKILL_SELECTED: "skill_selected",
     MODE_SELECTED: "mode_selected",
     PROFILE_VIEWED: "profile_viewed",
     SHARE_INITIATED: "share_initiated",
   } as const;
   ```

5. **Add tracking** at each touchpoint (see table in previous plan version for locations).

6. **Server-side PostHog** (`lib/posthog.ts`) for API route events.

### Files to Modify

- `.env` / Railway — PostHog keys
- `lib/analytics.ts` — event constants + enhanced trackEvent
- SprintRunner, DuelPageClient, InviteAcceptor, AIChallenger, VoiceToggle, SkillAccordion, ProfileClient — add trackEvent calls
- API routes (duels, evaluate) — server-side tracking

### Acceptance Criteria

- [x] PostHog receives events in dev
- [x] 15+ distinct events tracked
- [x] User identification (Clerk → PostHog)
- [x] Server-side events for API routes
- [x] Graceful degradation when key missing

---

## Issue 6: Career % Confusing + Skill Mapping Simplistic

### Problem Breakdown

**6a. Career % shown too early**: Shows after 1 sprint. Missing skills default to 0, dragging percentage.

**6b. Skill graph after every sprint**: RadarChart renders in ResultsReveal after EVERY sprint. Should be module (topic) completion only.

**6c. Dimension mapping is type-only**: `INTERACTION_DIMENSION_MAP` maps by interaction type globally. A SPOT_THE_SIGNAL about pricing maps to analyticalThinking/quantitativeReasoning regardless of content.

### Fix

**6a: Career % threshold**

1. In `career-match.ts`, skip unattempted skills and require minimum coverage:
   ```typescript
   for (const mapping of mappings) {
     const score = scoreLookup.get(mapping.skillId);
     if (score === undefined || score === 0) continue; // Skip unattempted
     weightedSum += score * mapping.weight;
     careerWeight += mapping.weight;
   }

   const coveredSkills = skillScores.filter(s => s.overallScore > 0).length;
   const matchPercentage = careerWeight > 0 ? Math.round(weightedSum / careerWeight) : null;
   ```

2. In CareerProgressBanner, show "Locked" state when `matchPercentage === null` or `coveredSkills < 3`.

**6b: Module-based radar chart**

3. Remove RadarChart from ResultsReveal for individual sprints.

4. After evaluation, check if all sprints in the topic are completed:
   ```typescript
   // In evaluate API: check topic completion
   const topicSprints = await prisma.sprint.findMany({
     where: { topicId: sprint.topicId, mode: sprint.mode },
     select: { id: true },
   });
   const completedAttempts = await prisma.sprintAttempt.count({
     where: { userId, sprintId: { in: topicSprints.map(s => s.id) }, score: { not: null } },
   });
   const moduleComplete = completedAttempts >= topicSprints.length;
   ```

5. Return `moduleComplete` flag. ResultsReveal shows radar only when true.

**6c: Content-aware dimension mapping**

6. Add `scoringDimensions Json?` field to Interaction model in Prisma schema.

7. Update AI content pipeline to generate per-interaction dimension weights:
   ```
   For each interaction, output "scoringDimensions" mapping the 6 dimensions it tests.
   Weights must sum to 1.0. Use 2-4 dimensions. Consider the SKILL.md weighting guidance.

   Example for a pricing question in Pricing & Monetization skill:
   { "quantitativeReasoning": 0.4, "decisionQuality": 0.3, "strategicReasoning": 0.2, "analyticalThinking": 0.1 }
   ```

8. Update `distributeToDimensions` to prefer per-interaction weights, falling back to type-based.

### Files to Modify

- `lib/scoring/career-match.ts` — skip unattempted, threshold
- `components/layout/ResultsReveal.tsx` — conditional radar
- `app/api/evaluate/route.ts` — moduleComplete flag
- `lib/scoring/evaluate.ts` — per-interaction dimension weights
- `prisma/schema.prisma` — add `scoringDimensions Json?` to Interaction
- `scripts/generate-content.ts` — generate scoringDimensions
- `components/profile/CareerProgressBanner.tsx` — locked state

### Acceptance Criteria

- [x] Career % not shown until 2+ skills attempted
- [x] Career % only uses attempted skills
- [x] Radar chart shows after topic completion only
- [ ] Module completion celebration (deferred)
- [x] Per-skill dimension overrides (pragmatic approach — no schema change needed)
- [x] Dimension mapping contextually accurate per skill

---

## Issue 7: Radar Chart Same Dimensions for All Skills (NEW)

### Problem

The radar chart displays the exact same 6 dimensions for every skill:

```
Analytical | Strategic | Quantitative | Communication | Decision | Creative
```

This creates **conceptual mismatches**:

| Skill | Awkward Dimension | Why |
|---|---|---|
| Stakeholder Communication | Quantitative Reasoning (Low) | Not tested in communication sprints |
| Data Interpretation | Communication Clarity (Low) | Not tested in data sprints |
| Guesstimation | Communication Clarity (Low) | Estimation doesn't test communication |

SKILL.md files define per-skill weightings (HIGH/MEDIUM/LOW) but the code ignores them entirely.

### Current Architecture

- `lib/scoring/dimensions.ts`: 6 global dimensions, no per-skill override
- `RadarChart.tsx`: Hardcoded `SCORING_DIMENSIONS` import, displays all 6
- `UserSkillScore` schema: Fixed columns for all 6 dimensions
- `evaluate.ts:46-74`: `INTERACTION_DIMENSION_MAP` is global, type-based only

### Fix: Per-Skill Dimension Emphasis (pragmatic approach)

Instead of redesigning the schema (too risky mid-hackathon), **hide irrelevant dimensions** from the radar chart per skill:

1. **Create per-skill dimension config** in `lib/scoring/dimensions.ts`:
   ```typescript
   export const SKILL_DIMENSION_EMPHASIS: Record<string, DimensionKey[]> = {
     "data-interpretation": [
       "analyticalThinking", "quantitativeReasoning",
       "decisionQuality", "creativeProblemSolving"
     ],
     "stakeholder-communication": [
       "communicationClarity", "strategicReasoning",
       "decisionQuality", "creativeProblemSolving"
     ],
     "pricing-monetization": [
       "quantitativeReasoning", "decisionQuality",
       "strategicReasoning", "analyticalThinking"
     ],
     "gtm-strategy": [
       "strategicReasoning", "decisionQuality",
       "creativeProblemSolving", "analyticalThinking"
     ],
     "guesstimation": [
       "quantitativeReasoning", "analyticalThinking",
       "creativeProblemSolving", "decisionQuality"
     ],
     "prioritization": [
       "strategicReasoning", "decisionQuality",
       "analyticalThinking", "communicationClarity"
     ],
   };
   ```

2. **Update RadarChart** to accept optional `dimensions` prop:
   ```tsx
   interface RadarChartProps {
     scores: DimensionScores;
     size?: number;
     animated?: boolean;
     skillSlug?: string; // NEW: filter to relevant dimensions
   }
   ```
   When `skillSlug` is provided, only show the 4 emphasized dimensions for that skill. When viewing the full profile (no skillSlug), show all 6.

3. **Pass `skillSlug`** from ResultsReveal and profile page to RadarChart.

### Why 4 dimensions per skill (not 6)?

- **Readability**: 4-point radar is cleaner and more actionable than 6-point
- **Relevance**: Users only see dimensions that matter for the skill they practiced
- **Honesty**: Don't show "Quantitative Reasoning" for communication skills
- **Profile page**: Still shows all 6 for the aggregate view

### Files to Modify

- `lib/scoring/dimensions.ts` — add `SKILL_DIMENSION_EMPHASIS` map
- `components/skill-graph/RadarChart.tsx` — accept skillSlug, filter dimensions
- `components/layout/ResultsReveal.tsx` — pass skillSlug
- `app/profile/page.tsx` — keep full 6-dimension radar for aggregate

### Acceptance Criteria

- [x] Per-skill dimension scoring via SKILL_DIMENSION_OVERRIDES in evaluate.ts
- [x] Profile aggregate radar shows all 6 dimensions
- [x] Dimension emphasis matches SKILL.md weighting guidance
- [x] Radar chart shapes differ per skill based on scoring overrides

---

## Issue 8: ElevenLabs Voice Integration Broken + Voice UX (NEW)

### Current Architecture

```
User clicks Voice Toggle (VoiceToggle.tsx)
  → Fetches signed URL from /api/elevenlabs/signed-url
  → ElevenLabs SDK connects via WebSocket
  → Voice conversation happens ENTIRELY inside ElevenLabs
  → onMessage callback is a STUB (comment only)
  → Voice transcripts NEVER appear in chat UI
  → When voice ends, no record of what was discussed
```

### Problems Found

| Problem | File | Line | Impact |
|---|---|---|---|
| Voice transcripts not displayed in chat | `VoiceToggle.tsx` | 57-59 | User sees nothing during voice session |
| `onMessage` is a comment-only stub | `VoiceToggle.tsx` | 57 | No transcript capture |
| No mic permission handling | `VoiceToggle.tsx` | - | Silent failure if browser denies mic |
| Error auto-dismisses after 2s | `VoiceToggle.tsx` | 49-56 | User can't read error message |
| Agent may not exist in ElevenLabs dashboard | Dashboard | - | Would return 404 on signed-url fetch |
| Interactions not optimized for voice | All interaction components | - | Text-heavy UI during voice mode |

### Architecture Assessment

The current design has two **disconnected** conversation systems:

1. **Text chat** (Vercel AI SDK): Messages flow through `/api/challenge`, displayed in ChatMessage components, stored in ChallengeSession.messages
2. **Voice** (ElevenLabs): Conversation happens inside ElevenLabs agent, no messages sent to app, no display, no storage

These should be **connected**: voice transcripts should appear in the chat UI, and the app should know what was discussed.

### Recommended Fix: Bridge Voice to Chat UI

**Phase A: Display voice transcripts in chat** (core fix)

1. **Wire `onMessage` callback** in `VoiceToggle.tsx`:
   ```typescript
   onMessage: ({ message, source }: { message: string; source: "user" | "ai" }) => {
     // Forward transcript to parent component
     onTranscript?.({ role: source === "user" ? "user" : "assistant", content: message });
   },
   ```

2. **Add `onTranscript` prop** to VoiceToggle, pass from AIChallenger.

3. **In AIChallenger**, append voice transcripts to the chat messages:
   ```typescript
   const handleVoiceTranscript = useCallback(
     ({ role, content }: { role: string; content: string }) => {
       // Display in chat UI alongside text messages
       addLocalMessage({ role, content, source: "voice" });
     }, []
   );
   ```

4. **Visual indicator** for voice messages in ChatMessage (mic icon, different styling).

**Phase B: Microphone permission handling**

5. Before starting voice session, check mic permission:
   ```typescript
   const checkMicPermission = async () => {
     try {
       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       stream.getTracks().forEach(t => t.stop()); // Release immediately
       return true;
     } catch {
       setVoiceState("error");
       setError("Microphone access required for voice mode");
       return false;
     }
   };
   ```

6. Show clear error message when mic is denied (not auto-dismissing).

**Phase C: Voice-optimized interaction UX** (user to implement)

7. When voice mode is active during a sprint, the interaction UI should adapt:
   - **Larger text** for prompts (voice users are listening, not reading closely)
   - **Read prompt aloud** via ElevenLabs TTS before expecting voice answer
   - **Simplified options** — voice users say "A", "B", "C", "D" or the option text
   - **Confirmation step** — "I heard 'Option B'. Is that your answer?"
   - **Visual feedback** — pulsing mic indicator while listening

8. This requires changes to the interaction flow:
   - SprintRunner needs a `voiceMode` prop
   - Each interaction component needs a voice-compatible variant
   - Answer parsing needs to handle spoken text ("I think it's the second one" → option B)

**NOTE**: Phase C is a significant UX redesign. For the hackathon, Phases A+B make voice functional. Phase C is a future improvement.

### ElevenLabs Dashboard Checklist (User Action Required)

Before any code fix will work, verify in the ElevenLabs dashboard:

- [ ] Agent `agent_3401khanj5tvftyb3xthtjv335qm` exists and is active
- [ ] Agent has a configured LLM (Claude or GPT)
- [ ] Agent accepts custom prompt overrides
- [ ] Agent has a voice configured (e.g., "Rachel", "Josh")
- [ ] API key `sk_aab43718...` has Conversational AI permissions
- [ ] Billing is active / free tier not exhausted

### Files to Modify

- `components/ai-challenger/VoiceToggle.tsx` — wire onMessage, add onTranscript prop, mic permission check
- `components/ai-challenger/AIChallenger.tsx` — receive voice transcripts, display in chat
- `components/ai-challenger/ChatMessage.tsx` — voice message styling (mic icon)

### Acceptance Criteria

- [x] Voice transcripts appear in chat UI in real-time
- [x] Mic permission requested before voice session starts
- [x] Clear error shown when mic denied
- [ ] Voice messages visually distinct from text messages (deferred — mic icon styling)
- [ ] ElevenLabs agent verified in dashboard (user action required)
- [x] Voice session start/end tracked in PostHog (ties to Issue 5)

---

## Implementation Order

```
Phase 1 (Blocking — do first, 1-2 hours):
  ├── Issue 1: Re-seed database (npx prisma db seed) — instant chart fix
  ├── Issue 2: Compete PRACTICE fallback + null guard
  ├── Issue 4: Em dash cleanup script (run before re-seed)
  └── Issue 5: PostHog env vars (quick win)

Phase 2 (Core UX — parallel, 3-4 hours):
  ├── Issue 1: Chart rendering in all 6 interaction types + compete serialization
  ├── Issue 3: Remove time scoring from LEARN/PRACTICE/CHALLENGE
  ├── Issue 5: Add 15+ tracking events
  └── Issue 8: ElevenLabs voice transcript bridge (Phase A+B)

Phase 3 (Scoring + radar overhaul, 3-4 hours):
  ├── Issue 6: Career % threshold, module-based radar, per-interaction dimensions
  └── Issue 7: Per-skill dimension emphasis in radar chart

NOTE: Run em dash fix → re-seed ONCE at the start of Phase 1.
This single re-seed fixes both Issue 1 (chartData) and Issue 4 (em dashes).
```

## References

### Internal
- `components/interactions/InteractionChart.tsx` — chart component (works, just no data)
- `lib/scoring/evaluate.ts:46-226` — scoring + dimension mapping
- `lib/scoring/dimensions.ts` — 6 global dimensions (no per-skill)
- `lib/scoring/career-match.ts` — career percentage logic
- `app/api/duels/route.ts:241-271` — duel creation with null sprint
- `components/arena/DuelPageClient.tsx:169` — blank screen condition
- `components/providers/PostHogProvider.tsx` — PostHog init
- `components/layout/ResultsReveal.tsx:188-203` — always-shown radar chart
- `components/interactions/ProgressBar.tsx` — timer UI
- `components/ai-challenger/VoiceToggle.tsx` — ElevenLabs voice (stub onMessage)
- `components/ai-challenger/AIChallenger.tsx` — AI Challenger main component
- `app/api/elevenlabs/signed-url/route.ts` — signed URL generation
- `.claude/skills/*/SKILL.md` — per-skill dimension weighting guidance
- `prisma/migrations/20260213151941_add_interaction_chart_data` — chartData migration

### Documented Solutions
- `docs/solutions/runtime-errors/evaluation-500-nan-propagation-and-data-fixes.md` — NaN guards
- `docs/solutions/ui-bugs/rank-prioritize-dnd-and-feedback-timing-fixes.md` — mode-dependent timing
- `docs/solutions/2026-02-12-build-review-omnibus-fixes.md` — duel race conditions
- `docs/solutions/security-issues/pr1-answer-leak-and-race-conditions.md` — answer stripping
