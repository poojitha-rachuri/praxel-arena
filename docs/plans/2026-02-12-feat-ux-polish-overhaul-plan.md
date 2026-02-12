---
title: "feat: UX Polish Overhaul - Navigation, Icons, Cards, Sprint Exit, Bug Fixes"
type: feat
date: 2026-02-12
brainstorm: docs/brainstorms/2026-02-12-ux-polish-overhaul-brainstorm.md
deepened: 2026-02-12
---

# feat: UX Polish Overhaul

## Enhancement Summary

**Deepened on:** 2026-02-12
**Agents used:** security-sentinel, performance-oracle, code-simplicity-reviewer, julik-frontend-races-reviewer, Context7 (Next.js 16, Prisma 7)

### Key Improvements from Research
1. **YAGNI: Simplify Phase 3** — Sprint resume with partial save was explicitly CUT in hackathon strategy. Simplify to X button + navigate (no save, no resume, no new API routes). Saves ~6-8 hours.
2. **Security: Answer leakage** — If resume endpoint is kept, responses MUST strip `correctAnswer`, `insightAnswer`, `score` fields before returning.
3. **Performance: Server-side resume** — If resume is kept, fetch in server component (eliminates 150-250ms client waterfall).
4. **Race conditions: 7 identified** — Critical: X-during-feedback-timer, exit-during-evaluating, X-then-answer-tap. All need `exitRequested` guard.
5. **Prisma caveat** — Nullable fields in `@@unique` treat null as distinct. Upsert with `completedAt: null` won't work; use `findFirst` + create/update pattern.

### Critical Decision: Phase 3 Scope

The simplicity reviewer flagged that **sprint abandonment was explicitly in the CUT list** of `docs/plans/sub-plans/00-hackathon-strategy.md`. Two options:

**Option A (Recommended): Simplified exit — X button + navigate, no save**
- Add X button to ProgressBar
- On tap: confirmation dialog → `router.push('/{mode}')`
- No API routes, no schema migration, no resume logic
- ~1 hour implementation vs ~8 hours for full resume
- Demo sprints are 30-90 seconds; users won't abandon mid-demo

**Option B: Full resume (original plan)**
- Keep Phase 3 as written, but apply all security/race-condition fixes below
- Adds 2 API routes, 1 migration, complex state management
- Only choose this if resume is a specific demo talking point

## Overview

Cohesive design polish pass addressing 8 UX issues from user testing. Fixes duplicate navigation, unprofessional emoji icons, empty challenges, trapped-in-quiz UX, -100 XP bug, navigation dead-ends, generic card design, and new-user overwhelm. Goal: professional, clear, unintimidating first impression for hackathon demo judges.

## Problem Statement

Early user feedback: *"Once I sign in there's too much happening and I'm unable to understand what to do."* Combined with: duplicate nav, emoji icons, empty states, no sprint exit, negative XP display, and navigation traps.

## Technical Approach

### Architecture

No new models beyond adding one field (`lastInteractionIndex` to SprintAttempt — only if Option B chosen). Changes are primarily UI components + seed data expansion.

### Implementation Phases

---

#### Phase 1: Bug Fixes + Quick Wins (est. smallest, do first)

These are independent, low-risk changes that unblock everything else.

##### 1a. Fix -100 XP Display Bug

**Root cause confirmed**: `xpForLevel(1) = Math.floor(100 * 1^1.5) = 100`, but new users start with `level: 1` and `xp: 0`. Profile calculates `xpProgress = 0 - 100 = -100`.

**Files to change:**
- `lib/gamification/constants.ts:23-25` — Fix `xpForLevel` to return 0 for level 1

```typescript
// lib/gamification/constants.ts
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
}
```

**Also add safety guard:**
- `app/profile/page.tsx:149` — Wrap `xpProgress` with `Math.max(0, ...)`

```typescript
// app/profile/page.tsx
const xpProgress = Math.max(0, user.xp - currentLevelXp);
```

**Verification**: Profile page should show "0 / 282 XP to next level" and "0%" for a new level-1 user with 0 XP.

> **Research Insight (Performance):** The `xpForLevel` change only affects level 1. Level 2+ returns identical values. No ripple effects on leaderboard, XP transactions, or credential calculations.

##### 1b. Remove ModeSelector (Duplicate Nav)

**Files to change:**
- `app/learn/page.tsx:5,25` — Remove `ModeSelector` import and `<ModeSelector />` render
- `app/practice/page.tsx:5,25` — Same
- `components/arena/CompeteLobby.tsx:9,100` — Same
- `components/layout/ModeSelector.tsx` — Delete file entirely

**Test**: Navigate between Learn/Practice/Compete using bottom nav only. No top tab bar visible.

##### 1c. Wrap Challenges Page in AppShell

**Current state**: `app/challenges/page.tsx` is a client component with no `AppShell` wrapper. This means no Navbar or BottomNav.

**Fix**: Convert to server component wrapper + client inner, matching Learn/Practice pattern:

- Create `app/challenges/ChallengesClient.tsx` — Move existing client logic here
- `app/challenges/page.tsx` — Server component wrapper with `<AppShell>` + auth check

```typescript
// app/challenges/page.tsx
import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/auth/ensure-user";
import AppShell from "@/components/layout/AppShell";
import ChallengesClient from "./ChallengesClient";

export default async function ChallengesPage() {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");
  return (
    <AppShell>
      <ChallengesClient />
    </AppShell>
  );
}
```

> **Research Insight (Security):** The existing `/api/challenges` endpoint is already secure — auth is optional for viewing (challenges are public), user-specific data only fetched if authenticated. The conversion to server+client split introduces no new vulnerabilities.
>
> **Research Insight (Simplicity):** The simplicity reviewer suggested keeping the existing client page structure. However, the AppShell wrapper requires a server component parent — this extraction is necessary for navigation consistency, not premature optimization.

##### 1d. Seed Challenges in Database

**Current state**: Challenges are only created by cron endpoint. Fresh DB = empty challenges page.

**Files to change:**
- `prisma/seed.ts` — Add challenge seeding section after skill/topic/sprint seeding

**Seed 5 challenges using relative dates:**

```typescript
// prisma/seed.ts (new section at end)
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

const challengeSeeds = [
  {
    templateId: "quick-fire",
    type: "SPEED_ROUND",
    name: "Quick Fire",
    description: "Answer 20 interactions in 5 minutes. Speed + accuracy wins.",
    config: { interactionCount: 20, timeLimitMs: 300000, accuracyThreshold: 0.7 },
    startsAt: now,
    endsAt: tomorrow,
    rewardXpFirst: 250,
    rewardXpTenth: 50,
    // Assign to random skill
  },
  // ... 4 more (skill-sprint, accuracy-blitz, daily-spotlight, weekly-master)
];
```

Use `upsert` pattern with `templateId + startsAt` as key (per learnings from docs/solutions).

> **Research Insight (Simplicity):** 3 challenges is sufficient for demo (shows scrollable list + variety). Reduce from 5 to 3 to save seed time: `quick-fire`, `daily-spotlight`, `weekly-master`.
>
> **Research Insight (Performance):** The `ActiveChallengeBanner` component polls `/api/challenges` every 60 seconds via SWR. For seeded/static challenges, reduce to `refreshInterval: 300000` (5 min) or `0` (no polling) to cut 80% of API traffic during demo.

---

#### Phase 2: Icon System + Card Redesign (visual foundation)

These changes are tightly coupled — new icons need new cards.

##### 2a. Create SkillIcon Component

**New file**: `components/ui/SkillIcon.tsx`

Hardcode the icon mapping (6 skills, static list — no DB change needed for icons).

```typescript
// components/ui/SkillIcon.tsx
import { BarChart3, Rocket, Calculator, DollarSign, Scale, MessageSquare, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SKILL_ICON_MAP: Record<string, { icon: LucideIcon; bg: string; text: string }> = {
  "data-interpretation": { icon: BarChart3, bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  "gtm-strategy": { icon: Rocket, bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  "guesstimation": { icon: Calculator, bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  "pricing-monetization": { icon: DollarSign, bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400" },
  "prioritization": { icon: Scale, bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400" },
  "stakeholder-communication": { icon: MessageSquare, bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400" },
};

const DEFAULT_ICON = { icon: BarChart3, bg: "bg-muted", text: "text-muted-foreground" };

interface SkillIconProps {
  slug: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SkillIcon({ slug, size = "md", className }: SkillIconProps) {
  const config = SKILL_ICON_MAP[slug] ?? DEFAULT_ICON;
  const Icon = config.icon;
  const sizeClasses = {
    sm: "size-8",   // 32px
    md: "size-10",  // 40px
    lg: "size-12",  // 48px
  };
  const iconSizes = { sm: "size-4", md: "size-5", lg: "size-6" };

  return (
    <div className={cn(
      "rounded-xl flex items-center justify-center shrink-0",
      sizeClasses[size],
      config.bg,
      className
    )}>
      <Icon className={cn(iconSizes[size], config.text)} />
    </div>
  );
}
```

##### 2b. Replace All Emoji Icon Usages

**Files to update** (8 locations found via grep `icon.*??`):
- `components/layout/SkillAccordion.tsx:146-148` — Replace `<span>{skill.icon ?? "🎯"}</span>` with `<SkillIcon slug={skill.slug} />`
- `components/layout/SkillPicker.tsx:51` — Same pattern
- `components/layout/CareerProgressBanner.tsx:45` — Use SkillIcon or keep emoji for career icons (separate from skill icons)
- `components/onboarding/OnboardingFlow.tsx:168` — Replace with SkillIcon
- `components/onboarding/CareerSelector.tsx:87` — Career icons stay as emoji (different entity)
- `components/arena/CompeteLobby.tsx:137,174` — Replace with SkillIcon
- `components/skill-graph/SkillCard.tsx:37` — Replace with SkillIcon
- `components/skill-graph/CareerMatchBar.tsx:34` — Career icon, keep emoji

**Also update topic icons in SkillAccordion:**
- `components/layout/SkillAccordion.tsx:245-246` — Topic emoji (`topic.icon`) can stay for now (topics are inside expanded sections, less visible)

##### 2c. Redesign Skill Cards in SkillAccordion

**File**: `components/layout/SkillAccordion.tsx`

**Changes:**
1. **Remove** `SKILL_ACCENTS` mapping (lines 12-19) — no more colored left borders
2. **Remove** `border-l-[3px]` and `accentClass` from card button (line 134)
3. **Add** `<SkillIcon slug={skill.slug} />` as left anchor (replace emoji span)
4. **Clean up** card styling:
   - Remove: `border-l-[3px]`, `accentClass`
   - Keep: `rounded-xl`, `bg-surface-1`, `min-h-[56px]`, shadow
   - Card should feel like a clean list item with icon circle on left

```tsx
// Updated accordion header button (simplified)
<button
  onClick={() => toggleSkill(skill.slug)}
  className={cn(
    "w-full flex items-center gap-3 rounded-xl px-4 py-3 min-h-[56px] text-left transition-all",
    isExpanded
      ? "bg-surface-1 ring-1 ring-border"
      : "bg-surface-1 hover:bg-surface-2"
  )}
>
  <SkillIcon slug={skill.slug} />
  {/* ... rest of content unchanged ... */}
</button>
```

> **Research Insight (Performance):** Lucide React has `"sideEffects": false` — tree-shaking works correctly. Importing 6 icons adds ~3-4KB gzipped, well within budget. No optimization needed.
>
> **Research Insight (Simplicity):** The simplicity reviewer suggested inlining the icon config in SkillAccordion instead of a separate file. However, SkillIcon is used in 6+ files (SkillAccordion, SkillPicker, OnboardingFlow, CompeteLobby, SkillCard, profile). A shared component is justified at this usage count.

---

#### Phase 3: Sprint Exit (simplified — see Enhancement Summary)

> **CRITICAL DECISION:** The original plan called for full resume with partial save. Research recommends **Option A: Simplified exit** (X button + navigate, no save). See Enhancement Summary above for rationale.

##### Option A: Simplified Exit (Recommended — ~1 hour)

**File**: `components/interactions/ProgressBar.tsx`

Add `onExit` callback prop + X button (same as original 3c):

```tsx
{onExit && (
  <button
    onClick={onExit}
    className="flex items-center justify-center size-8 -ml-1 rounded-full hover:bg-surface-2 transition-colors"
    aria-label="Exit sprint"
  >
    <X className="size-4 text-muted-foreground" />
  </button>
)}
```

**File**: `components/layout/SprintPageWrapper.tsx`

Add exit confirmation dialog (no save, just navigate):

```tsx
const [showExitDialog, setShowExitDialog] = useState(false);

// On confirm: just navigate back, no API call
const handleExitConfirm = () => {
  router.push(`/${sprint.mode.toLowerCase()}`);
};
```

**Race condition guards (from frontend-races review):**
```tsx
const [exitRequested, setExitRequested] = useState(false);

// Guard advance() in SprintRunner
const advance = useCallback(() => {
  if (advancingRef.current || exitRequested) return;
  // ...
}, [/* deps */, exitRequested]);

// Guard handleAnswer in SprintRunner
if (submittedRef.current || exitRequested) return;

// Disable pointer events during exit
<div className={cn("flex-1", exitRequested && "pointer-events-none")}>
  {children}
</div>

// Disable exit during evaluating
<ProgressBar onExit={evalState === "running" ? handleExitRequest : undefined} />
```

**No schema migration, no new API routes, no resume logic needed.**

##### Option B: Full Resume (Original Plan — ~8 hours)

If resume is chosen, keep the original Phase 3 below but apply these critical fixes:

This is the most complex change. Requires schema migration + API + UI.

##### 3a. Schema Migration: Add `lastInteractionIndex`

**File**: New migration via `npx prisma migrate dev --name add-sprint-resume`

```prisma
// prisma/schema.prisma — SprintAttempt model
model SprintAttempt {
  // ... existing fields ...
  lastInteractionIndex Int?       // Track progress for resume
  // ...
}
```

##### 3b. API: Save Partial Progress

**New file**: `app/api/sprints/[sprintId]/abandon/route.ts`

```typescript
// POST /api/sprints/[sprintId]/abandon
// Body: { responses: SprintResponse[], lastInteractionIndex: number }
// Creates/updates SprintAttempt with completedAt: null
```

**Logic:**
1. Auth check
2. Validate sprintId exists
3. Upsert SprintAttempt: `where: { userId_sprintId (+ completedAt null) }`, set `responses`, `lastInteractionIndex`, `completedAt: null`
4. Return `{ success: true, attemptId }`

**Also update**: `app/api/sprints/[sprintId]/resume/route.ts` (or GET endpoint)
- Fetch incomplete attempt for current user + sprint
- Return `{ attempt: { responses, lastInteractionIndex } }` or `null`

##### 3c. UI: Add X Button to ProgressBar

**File**: `components/interactions/ProgressBar.tsx`

Add `onExit` callback prop:

```tsx
interface ProgressBarProps {
  // ... existing props ...
  onExit?: () => void;
}
```

Add X button before mode badge (top-left):

```tsx
{onExit && (
  <button
    onClick={onExit}
    className="flex items-center justify-center size-8 -ml-1 rounded-full hover:bg-surface-2 transition-colors"
    aria-label="Exit sprint"
  >
    <X className="size-4 text-muted-foreground" />
  </button>
)}
```

##### 3d. UI: Exit Confirmation Dialog + Save Logic

**File**: `components/layout/SprintPageWrapper.tsx`

Add state for exit dialog:
```tsx
const [showExitDialog, setShowExitDialog] = useState(false);
```

On X tap: show AlertDialog (from shadcn) with:
- Title: "Leave sprint?"
- Description: "Your progress will be saved. You can resume later."
- Cancel + Confirm buttons

On confirm:
1. POST to `/api/sprints/${sprint.id}/abandon` with current responses
2. `router.push(\`/${sprint.mode.toLowerCase()}\`)`

##### 3e. UI: Resume Badge on Sprint Cards

**File**: `components/layout/SkillAccordion.tsx` — `SprintRow` component

Add check for incomplete attempt (pass down from mode page data):

```tsx
// In SprintRow
{isIncomplete && (
  <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full">
    Resume
  </span>
)}
```

**Data flow**: `getModePageData` needs to also query incomplete attempts (where `completedAt IS NULL`).

**File**: `lib/data/mode-page-data.ts` — Add incomplete attempts query to parallel Promise.all

##### 3f. Resume: Load Partial Progress on Sprint Mount

**File**: `components/layout/SprintPageWrapper.tsx`

On mount, check for existing incomplete attempt:
```tsx
useEffect(() => {
  fetch(`/api/sprints/${sprint.id}/resume`)
    .then(r => r.json())
    .then(data => {
      if (data.attempt) {
        // Pre-populate responses and skip to lastInteractionIndex
        setResumeData(data.attempt);
      }
    });
}, [sprint.id]);
```

Pass resume data to SprintRunner to start from the saved index.

### Research Insights for Phase 3 Option B (if chosen)

**Security Findings (CRITICAL — deploy-blocking if Option B):**
1. **Answer leakage via resume endpoint** — Responses stored in DB contain `correctAnswer`, `insightAnswer`, `score`. Resume endpoint MUST strip these before returning:
   ```typescript
   const sanitizedResponses = (attempt.responses as any[]).map(({
     correctAnswer, insightAnswer, score, isCorrect, ...safe
   }) => safe);
   ```
2. **Missing ownership check on abandon** — Validate `userId` matches authenticated user before upsert
3. **No rate limiting** — Add 10 abandons/user/hour limit (follow existing pattern from `/api/evaluate`)
4. **lastInteractionIndex validation** — Must validate: `>= 0`, `< responses.length`, `< sprint.interactions.length`
5. **InteractionId validation** — Check all response interactionIds belong to the sprint

**Prisma Caveat (Context7):** Nullable fields in `@@unique` constraints treat null as distinct in Prisma 7. The planned upsert with `completedAt: null` won't work as a composite unique. Use `findFirst` + create/update pattern instead:
```typescript
const existing = await prisma.sprintAttempt.findFirst({
  where: { userId: user.id, sprintId, completedAt: null },
});
if (existing) {
  await prisma.sprintAttempt.update({ where: { id: existing.id }, data: { ... } });
} else {
  await prisma.sprintAttempt.create({ data: { ... } });
}
```

**Race Conditions (7 identified by frontend-races reviewer):**

| Race Condition | Severity | Fix |
|---|---|---|
| X during feedback timer | Critical | `exitRequested` guard in `advance()` + clear timer |
| X then answer tap | Critical | `exitRequested` guard + `pointer-events-none` on card |
| Exit during evaluating | Critical | Disable X button when `evalState !== "running"` |
| Resume fetch after user answered | Moderate | Fetch resume in parent (server component), pass as props |
| Two tabs open same sprint | Moderate | localStorage attempt ID + conflict detection |
| Browser back vs X button | Moderate | Intercept `popstate`, show dialog instead of navigating |
| Timer after unmount | Low | Clear `feedbackTimerRef` before abandon POST |

**Recommended state machine (replaces current `evalState`):**
```typescript
type EvalState = "resuming" | "running" | "exit-pending" | "exiting" | "evaluating" | "done" | "error";
```

**Performance:** Move resume fetch to server-side parallel query (saves 150-250ms waterfall):
```typescript
// In sprint page server component, NOT in SprintRunner useEffect
const [sprint, resumeData] = await Promise.all([
  prisma.sprint.findUnique({ where: { id: sprintId }, include: { interactions: true } }),
  prisma.sprintAttempt.findFirst({
    where: { userId: user.id, sprintId, completedAt: null },
    select: { responses: true, lastInteractionIndex: true }
  })
]);
```

---

#### Phase 4: Visual Simplification (final polish)

##### 4a. Clean Up Mode Page Headers

**Files**: `app/learn/page.tsx`, `app/practice/page.tsx`

After removing ModeSelector, simplify the header area:
- Keep: `<h1>` + subtitle `<p>`
- Keep: `ActiveChallengeBanner` + `CareerProgressBanner`
- The page should feel calmer with one less UI element

##### 4b. Topic Sections — Consider Collapse by Default

**File**: `components/layout/SkillAccordion.tsx`

Currently, expanding a skill shows all topics open. The user wanted "collapsed by default" for topics. However, looking at the current implementation, topics are already **shown inline** (not accordions themselves) — they're just headers above sprint rows.

**Simpler approach**: Don't add topic-level collapse (adds complexity). The skill-level accordion already provides progressive disclosure. Just ensure only the "suggested" skill is auto-expanded for new users via `initialSkill` prop.

**Change**: When no `initialSkill` is provided AND no completions exist, auto-expand the first skill:

```tsx
const [expandedSlug, setExpandedSlug] = useState<string | undefined>(
  initialSkill && validSlugs.has(initialSkill)
    ? initialSkill
    : completedSprints && Object.keys(completedSprints).length === 0
      ? skills[0]?.slug
      : undefined
);
```

This shows new users exactly where to start without overwhelming them.

---

## Acceptance Criteria

### Functional Requirements

- [x] ModeSelector removed from Learn, Practice, Compete pages
- [x] All 6 skill icons render as Lucide SVGs in colored circles
- [x] Skill cards have no left-border color accents
- [x] SkillIcon component created at `components/ui/SkillIcon.tsx`
- [x] Challenges page wrapped in AppShell (has Navbar + BottomNav)
- [x] `prisma db seed` creates 3 active challenges with relative dates
- [x] Sprint ProgressBar has X button that opens exit dialog
- [x] X button disabled during evaluation state
- [x] Profile shows 0 XP progress (not -100) for level-1 users with 0 XP
- [x] First skill auto-expanded for new users with no completions

**Option B (full resume) — SKIPPED (chosen Option A: simple exit)**
- ~~Exiting sprint saves partial progress~~
- ~~Resume endpoint~~
- ~~Abandon endpoint~~
- ~~Incomplete sprints show "Resume" badge~~
- ~~Resuming a sprint starts from saved interaction index~~

### Quality Gates

- [x] `npm run build` succeeds with no type errors
- [x] No negative XP values possible in any display
- [x] All pages accessible via BottomNav have AppShell wrapper
- [x] `exitRequested` guard prevents advance/answer during exit flow

## Dependencies & Prerequisites

- None external. All changes are internal.
- Schema migration needed before Phase 3 (add `lastInteractionIndex`)
- Phase 2 (icons) should land before Phase 4 (visual simplification) for cohesive look

## Risk Analysis

| Risk | Mitigation |
|---|---|
| Sprint exit race conditions (7 found) | `exitRequested` guard + `pointer-events-none` + disable during evaluating |
| `xpForLevel` change breaks level calculations | Only changes level 1 (returns 0 instead of 100). Level 2+ unchanged. |
| Emoji icons still rendered somewhere | Grep for `?? "🎯"` and `?? "📊"` after changes to catch stragglers |
| Challenge seeds expire for demo | Use relative dates (`new Date()`) so seeds always produce future-dated challenges |
| Answer leakage via resume (Option B only) | Strip correctAnswer/insightAnswer/score from all response payloads |
| Prisma upsert fails on nullable unique (Option B) | Use findFirst + create/update instead of upsert |

## File Change Summary

### Option A (Simplified Exit — Recommended)

**New Files:**
- `components/ui/SkillIcon.tsx` — Icon mapping component
- `app/challenges/ChallengesClient.tsx` — Extracted client component

**Modified Files:**
- `lib/gamification/constants.ts` — Fix `xpForLevel(1)` bug
- `app/profile/page.tsx` — Add `Math.max(0, ...)` guard
- `app/learn/page.tsx` — Remove ModeSelector
- `app/practice/page.tsx` — Remove ModeSelector
- `components/arena/CompeteLobby.tsx` — Remove ModeSelector
- `components/layout/SkillAccordion.tsx` — Remove color borders, use SkillIcon, auto-expand for new users
- `components/layout/SkillPicker.tsx` — Use SkillIcon
- `components/onboarding/OnboardingFlow.tsx` — Use SkillIcon
- `components/skill-graph/SkillCard.tsx` — Use SkillIcon
- `components/interactions/ProgressBar.tsx` — Add X button + onExit prop
- `components/layout/SprintPageWrapper.tsx` — Exit dialog with exitRequested guard
- `app/challenges/page.tsx` — Server component with AppShell
- `prisma/seed.ts` — Add 3 challenge seeds
- `components/gamification/ActiveChallengeBanner.tsx` — Reduce SWR polling interval

**Deleted Files:**
- `components/layout/ModeSelector.tsx`

**NOT needed (saved by Option A):**
- ~~`app/api/sprints/[sprintId]/abandon/route.ts`~~ — No save needed
- ~~`app/api/sprints/[sprintId]/resume/route.ts`~~ — No resume needed
- ~~`prisma/schema.prisma` migration~~ — No `lastInteractionIndex` field
- ~~`lib/data/mode-page-data.ts` changes~~ — No incomplete attempts query

### Option B additions (if full resume chosen)

**Additional new files:**
- `app/api/sprints/[sprintId]/abandon/route.ts` — Save partial progress (with security fixes)
- `app/api/sprints/[sprintId]/resume/route.ts` — Load partial progress (with response sanitization)
- New Prisma migration (add `lastInteractionIndex`)

**Additional modified files:**
- `prisma/schema.prisma` — Add `lastInteractionIndex` to SprintAttempt
- `lib/data/mode-page-data.ts` — Query incomplete attempts for resume badges

## References

### Internal
- Brainstorm: `docs/brainstorms/2026-02-12-ux-polish-overhaul-brainstorm.md`
- Timer cleanup patterns: `docs/solutions/security-issues/pr1-answer-leak-and-race-conditions.md`
- Seeding patterns: `docs/solutions/logic-errors/pr2-content-architecture-logic-fixes.md`
- NaN guard chain: `docs/solutions/runtime-errors/evaluation-500-nan-propagation-and-data-fixes.md`
- Hackathon strategy: `docs/plans/sub-plans/00-hackathon-strategy.md`

### Key Code Locations
- XP bug: `lib/gamification/constants.ts:23` (`xpForLevel`)
- Profile calculation: `app/profile/page.tsx:147-160`
- ModeSelector: `components/layout/ModeSelector.tsx` (3 consumers)
- Icon rendering: 8 locations (grep `icon.*??`)
- Card borders: `components/layout/SkillAccordion.tsx:12-19` (`SKILL_ACCENTS`)
- Sprint wrapper: `components/layout/SprintPageWrapper.tsx`
- Sprint runner: `components/interactions/SprintRunner.tsx` (feedback timer, advance logic)
- Progress bar: `components/interactions/ProgressBar.tsx`
- Feedback timing: `lib/utils/feedback-timing.ts` (mode-dependent auto-advance)
- Challenge templates: `lib/gamification/challenges.ts:18-123`
- Challenge polling: `components/gamification/ActiveChallengeBanner.tsx:12-13` (60s SWR interval)
- Seed script: `prisma/seed.ts`
- Hackathon strategy CUT list: `docs/plans/sub-plans/00-hackathon-strategy.md`

### External References (from Context7)
- Next.js 16 async params: Route handlers must `await params` as Promise
- Prisma 7 nullable unique: Null treated as distinct in composite unique constraints — use findFirst pattern
