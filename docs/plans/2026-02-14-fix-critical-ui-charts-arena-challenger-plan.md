---
title: "fix: Critical UI, Charts, Arena, AI Challenger, Em-dashes"
type: fix
date: 2026-02-14
---

# fix: Critical UI, Charts, Arena, AI Challenger, Em-dashes

## Overview

9 critical issues across charts, arena/compete, AI challenger, profile, and content quality. Hackathon deadline is Feb 16 -- every fix must land. COMPETE mode (4.60/5.0 demo weight) is broken. Charts never render. Voice doesn't work. Timer kills challenge sessions.

## Issues Breakdown

| # | Issue | Severity | Root Cause |
|---|---|---|---|
| 1 | Charts never render in any interaction | P0 | Zod schema strips `chartData` from seed data |
| 2 | Arena: no way to see/rejoin existing duels | P0 | "Your Duels" section deleted in last commit |
| 3 | Arena invite flow unclear after share | P1 | UX gap -- creator has no way back to waiting duel |
| 4 | Profile "Recent Attempts" icons wrong | P1 | Uses raw emoji instead of `SkillIcon` component |
| 5 | AI Challenger has forced timer | P1 | 90-120s CountdownTimer auto-ends sessions |
| 6 | Voice agents don't work | P1 | ElevenLabs env vars + no upfront mode picker |
| 7 | Challenge: no Text/Voice mode picker | P1 | Mode toggle is mid-session, confusing |
| 8 | UI regression on Learn/Practice/Compete | P1 | Last commit removed useful UI elements |
| 9 | Em-dashes throughout app | P2 | Unicode em/en-dashes in .tsx, seed.ts, prompts |

## Phase 1: Data Layer Fixes (Charts + Em-dashes)

### 1A. Fix chartData Zod Schema

**Root cause**: `baseInteraction` in content-schema.ts has no `chartData` field. Zod `.safeParse()` silently strips it from every seed file. The seed script's `(interaction as Record<string, unknown>).chartData` cast operates on the already-stripped Zod output, so chartData is always `undefined`.

**Fix**:

```typescript
// lib/validation/content-schema.ts — add to baseInteraction (line 8-17)
const baseInteraction = z.object({
  order: z.number().int().min(1).max(8),
  prompt: z.string().min(1).max(500),
  options: z.array(optionSchema).length(4),
  correctAnswer: z.string().min(1),
  insightAnswer: z.string().min(1).nullable(),
  teachingPreamble: z.string().nullable(),
  priorContext: z.string().nullable(),
  timeTarget: z.number().int().min(5).max(60),
  chartData: z.unknown().optional(), // <-- ADD THIS
});
```

**Why `z.unknown().optional()`**: The chartData shape varies per chart type (bar, line, pie, area). `InteractionChart` already validates the shape at render time. For the hackathon, pass-through is sufficient.

**After fix**: The seed script's existing `(interaction as Record<string, unknown>).chartData` cast will now read from the Zod-parsed object that actually contains `chartData`.

- **File**: `lib/validation/content-schema.ts` line 8

### 1B. Fix chartData in seed script

The seed script already reads chartData, but the object it reads from is the Zod-stripped one. After 1A, the Zod output will preserve chartData. However, the seed's `interactionPayloads` construction (line ~537) casts to `Record<string, unknown>` — this should now work. Verify that `chartData` flows through to the `createMany` call by reading directly from the Zod-typed object:

```typescript
// prisma/seed.ts — in the interactionPayloads map
chartData: interaction.chartData ?? undefined,
```

Remove the `(interaction as Record<string, unknown>)` cast since Zod now includes the field.

- **File**: `prisma/seed.ts` (two locations: LEARN/PRACTICE and COMPETE interaction payloads)

### 1C. Global Em-dash Replacement

**User-facing strings in .tsx/.ts files** (replace `—` and `–` with ` - `):

| File | Line(s) | Context |
|---|---|---|
| `components/profile/ShareSheet.tsx` | 201 | "Share this code — you both earn 500 XP!" |
| `components/ai-challenger/AIChallenger.tsx` | 378 | "Voice mode active — speak to respond" |
| `components/landing/LandingPage.tsx` | 71, 72, 533 | Feature descriptions |
| `components/interactions/TeachAndTest.tsx` | 140 | "Read carefully — you'll be tested..." |

**AI prompts** (replace in prompt strings):

| File | Line(s) |
|---|---|
| `lib/scoring/evaluate.ts` | 436 |
| `lib/ai/prompts/challenger.ts` | 26, 30, 46 |
| `app/api/elevenlabs/signed-url/route.ts` | 32, 37, 39 |

**COMPETE seed data in seed.ts** (inline sprint strings):

| File | Line(s) |
|---|---|
| `prisma/seed.ts` | 239, 250, 273, 275, 276, 318, 321, 332, 334 |

**En-dashes** (`–`) in:

| File | Line(s) |
|---|---|
| `components/onboarding/CareerSelector.tsx` | 61 |

After code fixes, reseed production: `railway run npx prisma db seed`

Then run the direct DB cleanup for any AI-generated content:

```typescript
// One-time script: replace em/en-dashes in ALL interaction text fields
await prisma.$executeRawUnsafe(`
  UPDATE "Interaction"
  SET prompt = REPLACE(REPLACE(prompt, '—', ' - '), '–', ' - '),
      "insightAnswer" = REPLACE(REPLACE("insightAnswer", '—', ' - '), '–', ' - '),
      "teachingPreamble" = REPLACE(REPLACE("teachingPreamble", '—', ' - '), '–', ' - ')
  WHERE prompt LIKE '%—%' OR prompt LIKE '%–%'
     OR "insightAnswer" LIKE '%—%' OR "insightAnswer" LIKE '%–%'
     OR "teachingPreamble" LIKE '%—%' OR "teachingPreamble" LIKE '%–%'
`);
```

## Phase 2: UI Restoration + Polish

### 2A. Revert Learn/Practice to SkillCardsGrid

The SkillAccordion swap made the pages look blank/minimal. Revert to SkillCardsGrid which has:
- 2-column grid with SVG progress rings
- Visual appeal for demos
- Tap-to-navigate to `/learn/[skillSlug]` which shows the SkillNodePath

```tsx
// app/learn/page.tsx and app/practice/page.tsx
import SkillCardsGrid from "@/components/layout/SkillCardsGrid";

<SkillCardsGrid
  skills={data.skills}
  sprints={data.sprints}
  completedSprints={data.completedSprints}
  basePath="/learn"
/>
```

Keep SkillAccordion as the drill-down view on `/learn/[skillSlug]` pages.

- **Files**: `app/learn/page.tsx`, `app/practice/page.tsx`

### 2B. Restore "Your Duels" Section in ArenaLobby

The last commit removed the duels list, SWR fetch, and status badges. Restore them. This is critical — users can't find their waiting/in-progress duels without it.

Restore:
- `useSWR<{ duels: Duel[] }>("/api/duels", fetcher)` data fetch
- `Duel` interface with `id, status, skill, createdAt, completedAt, winnerId`
- `STATUS_COLORS` mapping
- The "Your Duels" vertical list with status badges and skill icons
- Imports: `useSWR`, `Badge`, `Clock`, `Trophy`, `ChevronRight`, `fetcher`
- Only show duels that are WAITING, IN_PROGRESS, or COMPLETED (not CANCELLED/FORFEIT)

Additionally, **filter out** CANCELLED duels and limit to 5 most recent to keep it clean.

Add a brief explainer for when there are no duels yet: "Create a duel above, then wait for an opponent or share the invite link."

- **File**: `components/arena/ArenaLobby.tsx`

### 2C. Fix Profile AttemptHistory Icons

Replace raw emoji with SkillIcon component.

```tsx
// components/profile/AttemptHistory.tsx line 83
// Before:
<span className="text-sm">{attempt.skillIcon ?? "📊"}</span>

// After:
<SkillIcon slug={attempt.skillSlug} size="sm" className="size-7" />
```

Add import: `import { SkillIcon } from "@/components/ui/SkillIcon";`

- **File**: `components/profile/AttemptHistory.tsx`

### 2D. Arena + Challenges UI Polish

**ArenaLobby** (after restoring duels):
- Keep the "How it works" info box added in last commit
- Tighten spacing between sections (gap-4 instead of gap-5)
- Add user's Elo rating next to skill selector cards (if available)

**ChallengesHub**:
- Add subtle gradient background on challenge type cards
- Show "Recent Sessions" below the start button (last 3 completed sessions with score/date)
- Better empty state with illustration

- **Files**: `components/arena/ArenaLobby.tsx`, `app/challenges/ChallengesHub.tsx`

## Phase 3: AI Challenger Overhaul

### 3A. Remove CountdownTimer

Remove the forced timer. Keep max exchanges (4 for post-sprint, 5 for standalone) as the session limiter. Add a subtle elapsed-time display instead.

```tsx
// components/ai-challenger/AIChallenger.tsx

// REMOVE: <CountdownTimer totalSeconds={seconds} onExpire={handleEnd} />
// REMOVE: defaultTime constant, seconds state

// ADD: Elapsed time display (non-pressuring)
const [startTime] = useState(Date.now());
const elapsed = Math.floor((Date.now() - startTime) / 1000);

// In header, replace CountdownTimer with:
<span className="text-xs text-muted-foreground tabular-nums">
  {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
</span>
```

Add a server-side stale session check: if session.createdAt > 1 hour ago and not completed, auto-complete on page load.

- **Files**: `components/ai-challenger/AIChallenger.tsx`, `app/challenge/[sessionId]/page.tsx`

### 3B. Add Upfront Text/Voice Mode Picker

Add a pre-chat screen in `ChallengeSessionClient` that appears before AIChallenger mounts.

```
┌─────────────────────────┐
│     Mock Interview      │
│    Data Interpretation  │
│                         │
│  How do you want to     │
│  take this challenge?   │
│                         │
│  ┌─────────┐ ┌────────┐│
│  │  💬     │ │  🎤    ││
│  │  Text   │ │  Voice ││
│  │  Chat   │ │  Call  ││
│  └─────────┘ └────────┘│
│                         │
│  [ Begin Challenge ]    │
└─────────────────────────┘
```

Implementation:
1. Add `selectedMode` state to `ChallengeSessionClient`: `"TEXT" | "VOICE" | null`
2. When `selectedMode === null`, show the mode picker screen (not AIChallenger)
3. When user selects a mode and clicks "Begin", set `selectedMode` and render AIChallenger
4. Pass `lockedMode={selectedMode}` to AIChallenger
5. In AIChallenger, when `lockedMode === "VOICE"`:
   - Skip the initial `sendMessage()` call (ElevenLabs agent has its own `firstMessage`)
   - Hide the text input area
   - Auto-start ElevenLabs conversation
   - Track exchanges from voice transcripts, not text messages
6. In AIChallenger, when `lockedMode === "TEXT"`:
   - Hide the VoiceToggle button entirely
   - Proceed with current text-only flow
7. Persist `inputMode` to ChallengeSession via the PATCH endpoint

**Voice availability check**: Before showing the Voice option, check if voice is available:
- Add a client-side check: `fetch("/api/elevenlabs/signed-url", { method: "HEAD" })` or a simpler `/api/elevenlabs/status` endpoint
- If voice is unavailable (503), gray out the Voice option with "Voice not configured" text

- **Files**: `app/challenge/[sessionId]/ChallengeSessionClient.tsx`, `components/ai-challenger/AIChallenger.tsx`, `components/ai-challenger/VoiceToggle.tsx`

### 3C. Fix Voice Agent Configuration

Verify ElevenLabs env vars are set in both local and Railway:
- `ELEVENLABS_AGENT_ID` — the Conversational AI agent ID from ElevenLabs dashboard
- `ELEVENLABS_API_KEY` — API key from ElevenLabs

If not configured:
- Hide voice option in mode picker (3B handles this)
- Remove VoiceToggle from header when voice is unavailable

If configured but still failing:
- Check the signed-url route's fetch to `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url`
- Verify the agent ID matches an existing agent in the ElevenLabs dashboard
- Check CORS/CSP headers aren't blocking the ElevenLabs WebSocket connection

- **Files**: `app/api/elevenlabs/signed-url/route.ts`, `.env.local`, Railway env vars

## Phase 4: Reseed + Verify

### 4A. Reseed Production

After all code changes:

```bash
# Push to main
git push origin main

# Reseed production (now includes chartData)
railway run npx prisma db seed

# Clean remaining em-dashes from AI-generated content
railway run npx tsx -e "..." # (SQL UPDATE script from Phase 1C)
```

### 4B. Verification Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] Charts render on SPOT_THE_SIGNAL interactions (data-interpretation skill)
- [ ] Career carousel shows for users with 1+ completed skill
- [ ] Learn page shows SkillCardsGrid with progress rings
- [ ] Practice page shows SkillCardsGrid with progress rings
- [ ] Compete page shows "Your Duels" section with status badges
- [ ] Invite link flow: create duel > share > friend joins > both play
- [ ] Profile "Recent Attempts" uses Lucide SkillIcon, not emoji
- [ ] Profile "Duel History" shows completed duels with Elo change
- [ ] AI Challenge starts with Text/Voice mode picker
- [ ] Text mode: no timer, no voice toggle, max exchanges limit works
- [ ] Voice mode: ElevenLabs connects (or gracefully shows unavailable)
- [ ] No em-dashes in any user-facing text (check LandingPage, TeachAndTest, ShareSheet)
- [ ] BottomNav Challenges tab shows Brain icon (already done in last commit)

## Implementation Order

```
Phase 1 (30 min) — Data fixes
├── 1A: chartData Zod schema fix
├── 1B: seed script chartData cleanup
└── 1C: Em-dash global replacement (code + seed.ts + DB)

Phase 2 (45 min) — UI restoration
├── 2A: Revert Learn/Practice to SkillCardsGrid
├── 2B: Restore ArenaLobby "Your Duels" section
├── 2C: Fix AttemptHistory icons
└── 2D: Arena + Challenges polish

Phase 3 (60 min) — AI Challenger overhaul
├── 3A: Remove CountdownTimer, add elapsed time
├── 3B: Text/Voice mode picker in ChallengeSessionClient
└── 3C: Voice agent configuration check

Phase 4 (15 min) — Reseed + verify
├── 4A: Push + reseed production
└── 4B: Full verification checklist
```

## Key File Changes Summary

| File | Changes |
|---|---|
| `lib/validation/content-schema.ts` | Add `chartData: z.unknown().optional()` to baseInteraction |
| `prisma/seed.ts` | Fix chartData cast, replace em-dashes in COMPETE data |
| `app/learn/page.tsx` | Revert to SkillCardsGrid |
| `app/practice/page.tsx` | Revert to SkillCardsGrid |
| `components/arena/ArenaLobby.tsx` | Restore "Your Duels" + SWR fetch + status badges |
| `components/profile/AttemptHistory.tsx` | Replace emoji with SkillIcon |
| `components/ai-challenger/AIChallenger.tsx` | Remove CountdownTimer, accept lockedMode prop |
| `app/challenge/[sessionId]/ChallengeSessionClient.tsx` | Add Text/Voice mode picker screen |
| `components/ai-challenger/VoiceToggle.tsx` | Conditional render based on availability |
| `components/profile/ShareSheet.tsx` | Em-dash replacement |
| `components/landing/LandingPage.tsx` | Em-dash replacement |
| `components/interactions/TeachAndTest.tsx` | Em-dash replacement |
| `lib/ai/prompts/challenger.ts` | Em-dash replacement |
| `lib/scoring/evaluate.ts` | Em-dash replacement |
| `app/api/elevenlabs/signed-url/route.ts` | Em-dash replacement |
| `app/challenges/ChallengesHub.tsx` | UI polish + recent sessions |

## References

- Hackathon strategy: `docs/plans/sub-plans/00-hackathon-strategy.md`
- Timer/race condition learnings: `docs/solutions/ui-bugs/rank-prioritize-dnd-and-feedback-timing-fixes.md`
- Answer leak patterns: `docs/solutions/security-issues/pr1-answer-leak-and-race-conditions.md`
- Content architecture: `docs/solutions/logic-errors/pr2-content-architecture-logic-fixes.md`
