---
title: "UX Polish, Bug Fixes, and New Features"
type: feat
date: 2026-02-13
branch: feat/ux-polish-and-features
---

# UX Polish, Bug Fixes, and New Features

## Overview

A consolidated batch of 10 fixes and features to polish the demo experience before the Feb 16 hackathon deadline. Covers icon consistency, layout fixes, auto-advance UX, chart data enrichment, profile sharing, and a "Challenge a Friend" flow for Compete mode.

## Problem Statement

Multiple UX issues undermine the demo experience:
- Skill icons are multicolored emojis mixed with colored Lucide icons -- inconsistent
- Compete page has bad space utilization with horizontal scroll everywhere
- Timed challenges section is broken (expired seed data) and confuses users
- LEARN mode forces Continue tap even on correct answers -- friction
- Continue button and SkillNodePath "Start Sprint" button are hidden behind BottomNav
- Only 1 of 96+ seed files has chart data despite the chart infrastructure being built
- Challenges page looks dated compared to redesigned pages
- Profile has no real sharing or referral capability
- No way to challenge a specific friend to a duel

---

## Phase 1: Quick Fixes (Low Effort, High Impact)

### 1.1 Monochrome Skill Icons

**Problem:** `SkillIcon.tsx` uses per-skill colors (blue, emerald, amber, etc.). Most places render raw emoji strings (`skill.icon || "📊"`). Career icons are Lucide with consistent styling -- skill icons should match.

**Solution:** Update `SkillIcon` to use a single color treatment (`text-primary` + `bg-primary/10`), then replace ALL emoji fallbacks with `<SkillIcon>`.

**Files:**
- `components/ui/SkillIcon.tsx` -- Remove per-skill color map, use uniform `bg-primary/10` + `text-primary`
- `components/layout/SkillCardsGrid.tsx` -- Replace `{skill.icon || "📊"}` with `<SkillIcon slug={skill.slug} size="sm" />`
- `components/arena/ArenaLobby.tsx` (line 126) -- Replace emoji in skill pills with `<SkillIcon>`
- `components/layout/SkillNodePath.tsx` (line 181) -- Replace emoji in header with `<SkillIcon>`
- `app/challenges/ChallengesHub.tsx` (line 135) -- Replace emoji in skill picker with `<SkillIcon>`
- `components/skill-graph/SkillCard.tsx` -- Check if it uses emoji, convert

**Implementation:**

```tsx
// SkillIcon.tsx -- simplified monochrome
const SKILL_ICON_MAP: Record<string, LucideIcon> = {
  "data-interpretation": BarChart3,
  "gtm-strategy": Rocket,
  "guesstimation": Calculator,
  "pricing-monetization": DollarSign,
  "prioritization": Scale,
  "stakeholder-communication": MessageSquare,
  "financial-statement-analysis": FileSpreadsheet,
  "valuation": Landmark,
};

export function SkillIcon({ slug, size = "md", className }: SkillIconProps) {
  const Icon = SKILL_ICON_MAP[slug] ?? BarChart3;
  return (
    <div className={cn("rounded-xl flex items-center justify-center shrink-0 bg-primary/10", sizeClasses[size], className)}>
      <Icon className={cn(iconSizes[size], "text-primary")} />
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] All skill icons render as Lucide icons with uniform `primary` color
- [ ] No raw emoji strings remain for skill display across the app
- [ ] Career icons (already monochrome Lucide) remain unchanged

---

### 1.2 Hide Timed Challenges Section

**Problem:** Timed challenges use absolute timestamps from seed data that expire after 24h/7d. The API filters them out (`endsAt >= now`), showing an empty "No active challenges" message. The feature isn't ready for demo.

**Solution:** Hide the entire timed challenges section + its divider behind a `false &&` condition. Keep all code intact.

**Files:**
- `app/challenges/ChallengesHub.tsx` -- Wrap lines 208-265 (divider + timed section) in `{false && (...)}`

**Acceptance Criteria:**
- [ ] Timed challenges section and "Daily Challenges" divider are not visible
- [ ] AI Challenges section fills the page
- [ ] All timed challenge code remains (no deletions)

---

### 1.3 BottomNav Overlap Fixes (Continue Button + Bottom Sheet)

**Problem:** Two overlapping issues with the same root cause:
1. SprintRunner Continue button (`mt-4 px-4`, no bottom padding) is hidden behind BottomNav or screen edge
2. SkillNodePath bottom sheet (`fixed bottom-0 z-50 pb-8`) overlaps with BottomNav (also `fixed bottom-0 z-50`)

**Solution:**

**A) Continue button** -- Make it sticky at the bottom of the viewport with BottomNav clearance:

```tsx
// SprintRunner.tsx -- Continue button wrapper
<motion.div className="fixed inset-x-0 bottom-0 z-40 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
```

Note: Sprint pages don't use AppShell/BottomNav, so safe-area-inset-bottom is sufficient.

**B) SkillNodePath bottom sheet** -- Increase z-index above BottomNav and add bottom clearance:

```tsx
// SkillNodePath.tsx -- backdrop and sheet
<motion.div className="fixed inset-0 z-[60] bg-black/40" /> {/* backdrop above BottomNav */}
<motion.div className="fixed inset-x-0 bottom-0 z-[60] rounded-t-2xl bg-card p-5 pb-[calc(76px+env(safe-area-inset-bottom))] shadow-2xl">
```

**Files:**
- `components/interactions/SprintRunner.tsx` (lines 337-361) -- Fixed position Continue button
- `components/layout/SkillNodePath.tsx` (lines 324-382) -- z-[60] + pb clearance for BottomNav

**Acceptance Criteria:**
- [ ] Continue button is always visible above the fold, not behind BottomNav or keyboard
- [ ] "Start Sprint" / "Retry Sprint" button in bottom sheet is fully tappable
- [ ] Bottom sheet backdrop covers BottomNav (z-[60] > z-50)
- [ ] Works on iPhone with safe area (home indicator bar)

---

### 1.4 Auto-Advance on Correct Answers (LEARN Mode)

**Problem:** In LEARN mode, every answer (correct or incorrect) requires tapping Continue. When the answer is correct, there's no additional insight needed -- the user already knows they got it right. This adds unnecessary friction.

**Solution:** In LEARN mode, auto-advance after 1.5s on correct answers (brief green flash). Keep Continue button for incorrect answers (user needs to read the insight explaining why they were wrong).

**Files:**
- `lib/utils/feedback-timing.ts` -- Add `isCorrect` parameter. Return `1500` for LEARN + correct, `null` for LEARN + incorrect
- `components/interactions/SprintRunner.tsx` (lines 216-227) -- Pass `lastCorrect` to `calculateFeedbackDuration`

**Updated feedback-timing logic:**

```typescript
export function calculateFeedbackDuration(
  insightText: string | null,
  mode: "LEARN" | "PRACTICE" | "COMPETE",
  isCorrect: boolean | null
): number | null {
  if (mode === "COMPETE") return 1200;
  if (mode === "LEARN") {
    // Correct -> auto-advance after brief celebration
    if (isCorrect === true) return 1500;
    // Incorrect or null -> manual Continue (read insight)
    return null;
  }
  // PRACTICE -> reading-speed-based
  // ... existing logic
}
```

**State transition table:**

| Mode | Correct | Behavior |
|------|---------|----------|
| LEARN | true | Green flash, auto-advance 1.5s |
| LEARN | false | Red flash, insight text, Continue button |
| LEARN | null | Continue button (tradeoff-type questions) |
| PRACTICE | any | Auto-advance 2-8s (reading speed), Continue to skip |
| COMPETE | any | Auto-advance 1.2s, no Continue |

**Acceptance Criteria:**
- [ ] Correct LEARN answers auto-advance after ~1.5s green flash
- [ ] Incorrect LEARN answers show Continue + insight text
- [ ] Null-correctness answers (FORCED_TRADEOFF, CURVEBALL) show Continue
- [ ] PRACTICE and COMPETE modes are unchanged

---

## Phase 2: Visual Overhauls (Medium Effort, High Impact)

### 2.1 Compete Page Redesign

**Problem:** ArenaLobby has horizontal scroll for both skill pills and duel cards. Bad space utilization with sparse vertical stacking and no max-width constraint.

**Solution:** Redesign to vertical, dense layout with gradient treatment and add "Challenge a Friend" CTA.

**Files:**
- `components/arena/ArenaLobby.tsx` -- Full redesign

**Layout (top to bottom):**
1. **Header:** Gradient text "Arena" + subtitle (keep existing)
2. **Skill selector:** 2-column grid of compact skill buttons (not horizontal scroll pills) -- same pattern as SkillCardsGrid
3. **Two CTAs side by side:**
   - "Find Opponent" (primary gradient, full width) -- random matchmaking
   - "Challenge a Friend" (outline, full width) -- generates invite link
4. **Your Duels:** Vertical stack of duel rows (not horizontal cards). Each row: `SkillIcon` + skill name + status badge + date + chevron. Full width, compact.
5. **Constrain to `max-w-lg mx-auto`** for consistent width

**Duel row design (replaces horizontal card scroll):**

```tsx
<button className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card/80 p-3 backdrop-blur-sm">
  <SkillIcon slug={duel.skill.slug} size="sm" />
  <div className="flex-1 min-w-0">
    <span className="text-sm font-semibold truncate">{duel.skill.name}</span>
    <span className="text-xs text-muted-foreground">{date}</span>
  </div>
  <Badge>{status}</Badge>
  <ChevronRight className="size-4 text-muted-foreground" />
</button>
```

**Acceptance Criteria:**
- [ ] No horizontal scroll on the Compete page
- [ ] Skills shown as 2-col grid matching Learn/Practice style
- [ ] Duels shown as vertical list with full-width rows
- [ ] "Challenge a Friend" button visible (wired in Phase 3)
- [ ] Constrained to `max-w-lg mx-auto`

---

### 2.2 Challenges UI Modernization

**Problem:** ChallengesHub looks "old school" -- plain header, standard borders, no gradients or animations. Out of line with redesigned ArenaLobby and SkillCardsGrid.

**Solution:** Apply the gradient/glassmorphism visual language used elsewhere.

**Files:**
- `app/challenges/ChallengesHub.tsx` -- Visual update

**Changes:**
1. **Header:** Gradient text like ArenaLobby (`bg-gradient-to-r from-violet-400 to-primary bg-clip-text text-transparent`)
2. **Skill picker:** Replace 2x3 grid with 2-col grid using `<SkillIcon>` + glassmorphism cards (`bg-card/80 backdrop-blur-sm`)
3. **Challenge type cards:** Add Motion stagger entrance animations, glassmorphism borders
4. **Start button:** Gradient treatment matching ArenaLobby CTA (`bg-gradient-to-r from-violet-600 to-primary`)
5. **"NEW" badge:** Keep but style with glow effect

**Acceptance Criteria:**
- [ ] Challenges page header uses gradient text
- [ ] Skill picker uses `<SkillIcon>` (monochrome) instead of emojis
- [ ] Challenge type cards have glassmorphism + Motion entrance
- [ ] Start button has gradient treatment
- [ ] Visual consistency with ArenaLobby and SkillCardsGrid

---

## Phase 3: New Features (Higher Effort)

### 3.1 Chart Data for All SPOT_THE_SIGNAL Interactions

**Problem:** InteractionChart.tsx works but only 1 of ~128 SPOT_THE_SIGNAL interactions has chartData in seed JSONs. Users never see charts.

**Solution:** Write a script using Claude API to generate appropriate chartData for all SPOT_THE_SIGNAL interactions that reference quantitative data. Also pass chartData to TeachAndTest for data-heavy topics.

**Files:**
- `scripts/generate-chart-data.ts` -- New script (reads seed JSONs, generates chartData via Claude, writes back)
- `prisma/seed-data/**/*.json` -- ~60-80 files updated with chartData on SPOT_THE_SIGNAL interactions
- `components/interactions/SprintRunner.tsx` -- Also pass `chartData` to `TeachAndTest`
- `components/interactions/TeachAndTest.tsx` -- Accept and render `chartData` via InteractionChart

**Script approach:**

```typescript
// scripts/generate-chart-data.ts
// For each seed JSON file:
//   1. Find SPOT_THE_SIGNAL interactions
//   2. Analyze prompt for quantitative references (numbers, %, trends, comparisons)
//   3. If quantitative: call Claude to generate appropriate chartData JSON
//   4. Validate with Zod schema
//   5. Write back to JSON file

const chartDataSchema = z.object({
  type: z.enum(["bar", "line", "pie", "area"]),
  title: z.string().optional(),
  data: z.array(z.record(z.union([z.string(), z.number()]))),
  xKey: z.string().optional(),
  yKey: z.string().optional(),
  nameKey: z.string().optional(),
  dataKey: z.string().optional(),
});
```

**Chart type heuristics:**
- Revenue/sales over time -> line chart
- Comparison across categories -> bar chart
- Market share / distribution -> pie chart
- Trend with volume -> area chart

**Acceptance Criteria:**
- [ ] 60+ SPOT_THE_SIGNAL interactions have chartData
- [ ] Charts render correctly with the existing InteractionChart component
- [ ] TeachAndTest also renders charts when chartData is present
- [ ] Zod validation passes for all generated chartData
- [ ] Charts are contextually relevant to the question prompt

---

### 3.2 Profile Shareability

**Problem:** Profile only has a "copy URL to clipboard" button. No Web Share API, no social links, no visual share card.

**Solution:** Enhance sharing with Web Share API (with clipboard fallback) + social share links. Defer referral/downloadable card to post-hackathon.

**Files:**
- `app/profile/ProfileClient.tsx` -- Replace `handleShare` with comprehensive share sheet
- `components/profile/ShareSheet.tsx` -- New component: bottom sheet with share options
- `app/profile/[userId]/page.tsx` -- Ensure public profile works for shared links

**Share sheet design:**

```
┌─────────────────────────────┐
│  Share Your Profile         │
│                             │
│  [Share via...] (Web Share) │
│  [Copy Link]   (Clipboard) │
│  [Twitter/X]   (Pre-filled) │
│  [LinkedIn]    (Pre-filled) │
│                             │
│  ─── Referral Code ───      │
│  PRAXEL-AB12CD              │
│  [Copy Code]                │
│  Share this code with        │
│  friends to earn bonus XP   │
└─────────────────────────────┘
```

**Referral flow (lightweight version):**
- Generate a deterministic referral code from userId (e.g., `PRAXEL-` + first 6 chars of base36 userId hash)
- Store referred-by in a new `referralCode` field on User model
- On sign-up, if referral code provided: +500 XP bonus for both referrer and referee
- No new Prisma model needed -- just a `referralCode String?` on User + `referredBy String?`

**Schema change:**

```prisma
model User {
  // ... existing fields
  referralCode  String?  @unique  // e.g. "PRAXEL-AB12CD"
  referredBy    String?            // referralCode of the user who referred them
}
```

**Social share text:**
- Twitter: `"I'm leveling up my business skills on Praxel Arena! Check out my profile: {url} #PraxelArena"`
- LinkedIn: `"Building data-driven business skills on Praxel Arena. See my progress: {url}"`

**Acceptance Criteria:**
- [ ] Web Share API works on supported devices (falls back to clipboard copy)
- [ ] Twitter/X and LinkedIn share links open pre-filled posts
- [ ] Referral code displayed in share sheet
- [ ] Referral code can be entered during onboarding
- [ ] +500 XP bonus on successful referral (both parties)
- [ ] Public profile accessible via `/profile/[userId]`

---

### 3.3 Challenge a Friend (Compete Mode)

**Problem:** No way to challenge a specific friend. Users can only random-match via "Find Opponent."

**Solution:** Add invite link generation. Challenger creates a WAITING duel, gets a shareable link. Friend opens link, accepts, duel starts.

**Files:**
- `components/arena/ArenaLobby.tsx` -- "Challenge a Friend" button + invite modal
- `app/compete/invite/[duelId]/page.tsx` -- New invite landing page
- `app/compete/invite/[duelId]/InviteAcceptor.tsx` -- Client component for accept flow
- `app/api/duels/route.ts` -- Already supports JOIN path (POST with `duelId`), may need minor updates

**Challenger flow:**
1. Select skill in ArenaLobby
2. Tap "Challenge a Friend"
3. System creates a WAITING duel via `POST /api/duels` (existing endpoint)
4. Modal appears with shareable link: `{origin}/compete/invite/{duelId}`
5. User shares via Web Share API or copies link
6. Modal shows "Waiting for opponent..." with duel status polling (5s interval)

**Friend (recipient) flow:**
1. Opens invite link `/compete/invite/[duelId]`
2. **If authenticated:** Sees invite page with challenger info + skill + "Accept Challenge" button
3. **If not authenticated:** Clerk redirects to sign-in, then back to invite page
4. Taps "Accept Challenge" -> `POST /api/duels { duelId }` (existing JOIN path)
5. Duel transitions to IN_PROGRESS
6. Redirected to `/compete/{duelId}` to play

**Invite page design:**

```
┌─────────────────────────────────────┐
│        ⚔️ You've Been Challenged!   │
│                                     │
│     [Avatar]                        │
│     John challenged you to          │
│     a Data Interpretation duel      │
│                                     │
│     ┌──────────────────────┐        │
│     │ Accept Challenge     │        │
│     └──────────────────────┘        │
│                                     │
│     Decline (link to /compete)      │
└─────────────────────────────────────┘
```

**Edge cases:**
- Duel already taken -> "This challenge has already been accepted"
- Own invite link -> "You created this challenge. Share the link with a friend!"
- Duel expired/cancelled -> "This challenge is no longer available"
- Unauthenticated user -> Clerk sign-in redirect with `redirect_url` back to invite

**Acceptance Criteria:**
- [ ] "Challenge a Friend" button in ArenaLobby creates WAITING duel and shows shareable link
- [ ] Invite page at `/compete/invite/[duelId]` shows challenger info and accept button
- [ ] Accept flow joins the duel and redirects both players
- [ ] Handles edge cases: already taken, expired, own link, unauthenticated
- [ ] Web Share API or clipboard copy for the invite link

---

## Implementation Order

Priority ordered for hackathon demo impact:

| # | Task | Effort | Files | Demo Impact |
|---|------|--------|-------|-------------|
| 1 | Hide timed challenges (1.2) | 5 min | 1 file | Unblocks clean demo |
| 2 | Monochrome skill icons (1.1) | 30 min | 6 files | Visual consistency |
| 3 | BottomNav overlap fixes (1.3) | 45 min | 2 files | Critical usability |
| 4 | Auto-advance correct (1.4) | 30 min | 2 files | Reduced friction |
| 5 | Compete redesign (2.1) | 1.5 hr | 1 file | Demo highlight |
| 6 | Challenges UI modernization (2.2) | 1 hr | 1 file | Visual polish |
| 7 | Chart data enrichment (3.1) | 2 hr | 80+ JSON files + 2 code files | Visual richness |
| 8 | Challenge a Friend (3.3) | 2.5 hr | 4 files | WOW moment |
| 9 | Profile shareability (3.2) | 2 hr | 3 files + schema | Social virality |

**Total estimated build time:** ~10-11 hours

---

## Dependencies & Risks

| Risk | Mitigation |
|------|-----------|
| Chart data generation quality | Zod validation + manual review of 10% sample |
| Invite link for unauthenticated users | Clerk handles redirect; test sign-in -> redirect flow |
| Referral code collisions | Use `@unique` constraint; retry on collision |
| BottomNav safe-area varies by device | Use `env(safe-area-inset-bottom)` CSS function |
| 80+ JSON file edits | Script-based generation, not manual |

---

## References

- Brainstorm: `docs/brainstorms/2026-02-13-no-scroll-ux-overhaul-brainstorm.md`
- Strategy: `docs/plans/sub-plans/00-hackathon-strategy.md`
- Feedback timing patterns: `docs/solutions/ui-bugs/rank-prioritize-dnd-and-feedback-timing-fixes.md`
- Animation formulas: `docs/solutions/2026-02-12-build-review-omnibus-fixes.md` (Fix #10)
- API contract patterns: `docs/solutions/2026-02-12-build-review-omnibus-fixes.md` (Fixes #5, #6)
- Content architecture: `docs/solutions/logic-errors/pr2-content-architecture-logic-fixes.md`
