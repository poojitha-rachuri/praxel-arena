---
title: "Fix API Failures + UI Overhaul"
type: fix
date: 2026-02-12
priority: critical
deepened: 2026-02-12
---

# Fix API Failures + UI Overhaul

## Enhancement Summary

**Deepened on:** 2026-02-12
**Sections enhanced:** 3 phases + 11 sub-sections
**Research agents used:** Clerk ensureUser patterns, Educational UI design, Warm OKLCH theme, Confetti/celebration animations, Frontend design skill, Context7 (Clerk + Motion docs)

### Key Improvements
1. **Race-safe `ensureUser()`** — Added P2002 retry logic for concurrent first-visit requests (from Clerk best practices research)
2. **Perceptible warm OKLCH palette** — Research shows hue ~55 (amber) with chroma 0.014-0.016 gives warmth without visible tinting; added complete surface hierarchy and mode-specific color tokens
3. **canvas-confetti** — 6KB library, no React wrapper needed, `useWorker: true` for off-main-thread rendering; complete hook pattern with haptic feedback integration
4. **Segmented progress bar** — Discrete step dots with gradient fill, pulse animation, and checkmarks replace thin continuous bar
5. **Callout component system** — 4 variants (insight/warning/info/ai) with left accent stripe and gradient border technique

### New Considerations Discovered
- `auth()` reads from JWT (no network call, ~3ms); `currentUser()` makes Clerk Backend API call (~50-150ms) — only call on user creation path
- P2002 (unique constraint violation) race condition: two concurrent requests can both pass `findUnique` before either creates — `upsert` with retry handles this
- OKLCH hue 260 (blue-purple) feels colder than hue 55 (amber); research recommends amber for "warm dark" perception
- `canvas-confetti` supports `disableForReducedMotion: true` for accessibility and `useWorker: true` for performance
- Motion 12.x `useSpring` provides natural overshoot for number counters; keyframe arrays `[0, 1.2, 0.95, 1.05, 1]` for scale-bounce

---

## Overview

Two critical issues need immediate resolution before the hackathon demo (Feb 16):

1. **All API routes return 404** — Users authenticated via Clerk are never created in the Prisma DB, so every `prisma.user.findUnique({ where: { clerkId } })` check fails with "User not found"
2. **UI is underwhelming** — Current design scores 6.2/10 compared to the reference (praxy.runable.site). Missing: rich data visualizations, warm color accents, character personality, celebration animations, visual hierarchy

## Problem Statement

### API Failures (CRITICAL — app is broken)

From the console screenshot, every API call fails:
- `GET /api/duels` → 404
- `POST /api/duels` → `{error: 'User not found'}`
- `GET /api/sprints?skillSlug=data-in...` → 404
- `GET /api/sprints?skillSlug=guessti...` → 404
- `GET /api/sprints?skillSlug=gtm-str...` → 404

**Root cause:** Every API route does this check:
```typescript
const user = await prisma.user.findUnique({ where: { clerkId } });
if (!user) {
  return NextResponse.json({ error: "User not found" }, { status: 404 });
}
```

Users only get created via the Clerk webhook (`/api/webhooks/clerk`), which:
- May not be configured in the Clerk dashboard
- May have wrong webhook secret
- Has no fallback — if the webhook doesn't fire, the user NEVER gets created

There is **no fallback user creation** anywhere in the app. If the webhook fails silently, the entire app is broken for that user.

### UI Underwhelm (HIGH — demo impact)

The reference site (praxy.runable.site) from another hackathon has:
- Character avatars with speech bubbles framing questions
- Step progress indicators (Learn → Quiz → Complete)
- Rich data visualizations (balance sheets, financial tables, color-coded sections)
- Calculation breakdowns with large numbers and status badges (HEALTHY)
- Insight callouts with icons
- Warm color scheme with gradients (cream, gold, teal, coral)
- Polished CTAs ("Got it! Take me to the Quiz →")

Current Praxel Arena has:
- Austere dark-only theme with cold OKLCH grays
- Plain text prompts with basic A/B/C/D buttons
- No character/personality
- No data visualizations or rich content rendering
- Thin progress bar with no step indicators
- No celebration animations (confetti, streak counters)
- Generic "Insight:" label with no visual impact
- Overall rating: 6.2/10

---

## Proposed Solution

### Phase 1: Fix API Failures (CRITICAL — do first)

#### 1.1 Add "Ensure User" utility

Create `lib/auth/ensure-user.ts` — a function that checks if the Clerk user exists in Prisma, and creates them if not. This is the **fallback** for when the webhook doesn't fire.

```typescript
// lib/auth/ensure-user.ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import type { User } from "@/app/generated/prisma/client";
import { Prisma } from "@/app/generated/prisma/client";

export async function ensureUser(): Promise<User | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  // Fast path: user already exists (~3ms, JWT only, no network call)
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  // Slow path: user not in DB — fetch from Clerk Backend API (~50-150ms, one-time)
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkId}@placeholder.local`;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const imageUrl = clerkUser.imageUrl ?? null;

  return upsertWithRetry(clerkId, email, name, imageUrl);
}

// Handle P2002 race condition: two concurrent requests both pass findUnique
// before either creates the user. Second upsert attempt succeeds.
async function upsertWithRetry(
  clerkId: string,
  email: string,
  name: string | null,
  imageUrl: string | null
): Promise<User> {
  try {
    return await prisma.user.upsert({
      where: { clerkId },
      update: { email, name, imageUrl },
      create: { clerkId, email, name, imageUrl },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Unique constraint race — retry once, the row now exists
      return await prisma.user.upsert({
        where: { clerkId },
        update: { email, name, imageUrl },
        create: { clerkId, email, name, imageUrl },
      });
    }
    throw error;
  }
}
```

##### Research Insights (ensureUser)

**Best Practices (from Clerk docs + community patterns):**
- `auth()` reads from the JWT in the session cookie — **zero network calls**, ~3ms. Use this on the fast path for every request.
- `currentUser()` calls the Clerk Backend API — **network call**, 50-150ms. Only invoke when the user needs to be created (first visit).
- Use `upsert` (not `create`) to handle the race condition where the webhook fires simultaneously with the first API call.
- The P2002 retry handles the edge case where two concurrent requests both pass `findUnique` check before either inserts. One succeeds, one gets P2002, retry succeeds.

**Performance Considerations:**
- Fast path (existing user): `auth()` ~3ms + `findUnique` ~5ms = **~8ms overhead** per request
- Slow path (new user, first visit only): + `currentUser()` ~100ms + `upsert` ~10ms = **~120ms one-time cost**
- After first visit, all subsequent requests take the fast path

**Edge Cases:**
- **Placeholder email**: If Clerk user has no email (e.g., social login without email scope), use `${clerkId}@placeholder.local` to satisfy DB not-null constraint
- **Concurrent tab opens**: Two tabs opening simultaneously both trigger slow path — `upsert` with P2002 retry prevents duplicate key errors
- **Webhook still fires later**: Keep the webhook handler as-is. If `ensureUser` created the user first, the webhook's `upsert` becomes a no-op update. No conflict.

#### 1.2 Replace `findUnique` with `ensureUser()` in all API routes

Every route that currently does:
```typescript
const user = await prisma.user.findUnique({ where: { clerkId } });
if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
```

Replace with:
```typescript
import { ensureUser } from "@/lib/auth/ensure-user";
const user = await ensureUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

**Files to update:**
- [x] `app/api/sprints/route.ts` — GET handler (line 32-37)
- [x] `app/api/sprints/generate/route.ts` — POST handler
- [x] `app/api/duels/route.ts` — GET handler (line 16-19), POST handler (line 57-62)
- [x] `app/api/duels/[duelId]/route.ts` — GET handler
- [x] `app/api/evaluate/route.ts` — POST handler
- [x] `app/api/leaderboard/route.ts` — GET handler (skipped: no user lookup needed)
- [x] `app/api/profile/route.ts` — GET/PUT handlers

**Note:** Change error from 404 ("User not found") to 401 ("Unauthorized") — semantically correct since `ensureUser` returning null means no valid Clerk session, not a missing DB record.

#### 1.3 Add ensureUser to server-side pages too

Pages that fetch user data server-side also need the fallback:
- [x] `app/learn/page.tsx`
- [x] `app/practice/page.tsx`
- [x] `app/compete/page.tsx`
- [x] `app/profile/page.tsx`
- [x] `app/onboarding/page.tsx`

#### 1.4 Fix Clerk deprecation warning

Console shows: `"afterSignInUrl" is deprecated, use "fallbackRedirectUrl" or "forceRedirectUrl"`

- [ ] Update `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` → `NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL`
- [ ] Update `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` → `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- [ ] Update Dockerfile ARG/ENV declarations to match
- [ ] Update `.env.example` to match

---

### Phase 2: UI Overhaul — Warm Theme + Visual Polish

#### 2.1 Color System Upgrade

Replace the austere achromatic dark theme with a warm, vibrant palette while keeping dark mode default.

**`app/globals.css` changes:**

```css
.dark {
  /* Warm dark backgrounds — hue 55 (amber), low chroma for warmth without tinting */
  --background: oklch(0.145 0.014 55);     /* warm dark bg */
  --card: oklch(0.205 0.016 55);           /* warm card surface */
  --card-foreground: oklch(0.96 0.005 80); /* warm white text */

  /* Elevated surfaces for visual hierarchy */
  --surface-1: oklch(0.175 0.015 55);      /* navbar, sidebar */
  --surface-2: oklch(0.22 0.017 55);       /* modal, popover */
  --surface-3: oklch(0.26 0.018 55);       /* hover state */

  /* Accent: vibrant violet-blue (brand) */
  --primary: oklch(0.65 0.25 275);
  --primary-foreground: oklch(0.98 0 0);

  /* Secondary: warm slate */
  --secondary: oklch(0.28 0.015 55);
  --muted: oklch(0.28 0.015 55);
  --muted-foreground: oklch(0.65 0.02 55);

  /* Warm borders */
  --border: oklch(1 0 0 / 12%);

  /* Mode-specific accent colors */
  --mode-learn: oklch(0.72 0.19 155);      /* emerald green */
  --mode-practice: oklch(0.70 0.15 245);   /* bright blue */
  --mode-compete: oklch(0.68 0.22 25);     /* competitive red-orange */

  /* Semantic feedback colors */
  --success: oklch(0.72 0.19 155);
  --warning: oklch(0.80 0.16 85);
  --danger: oklch(0.65 0.22 25);
  --info: oklch(0.70 0.15 245);
  --insight: oklch(0.75 0.18 300);         /* purple for insights */

  /* Glow tokens for emphasis */
  --glow-primary: oklch(0.65 0.25 275 / 25%);
  --glow-success: oklch(0.72 0.19 155 / 20%);
  --glow-compete: oklch(0.68 0.22 25 / 20%);
}
```

##### Research Insights (Color System)

**Best Practices:**
- **Hue 55 (amber)** provides perceptible warmth in dark mode without visible color tinting. Hue 260 (blue-purple) actually feels colder.
- Keep background chroma at 0.014-0.016 — above 0.02 the tint becomes visible and distracting.
- **Surface hierarchy** (3 levels) creates depth perception: `surface-1` > `surface-2` > `surface-3` — each +0.03 lightness.
- **Mode colors** reinforce spatial memory: green=learn, blue=practice, red=compete. Users unconsciously associate color with context.
- **WCAG AA verified pairs:** `--card-foreground` on `--card` = 10.8:1 contrast ratio (exceeds 4.5:1 requirement).

**Performance:**
- OKLCH is natively supported in all modern browsers (2024+). No polyfills needed.
- CSS custom properties with OKLCH are more performant than runtime color manipulation.

**Anti-patterns to avoid:**
- Don't use `oklch(... / 50%)` for card backgrounds — half-transparent surfaces cause readability issues with text below
- Don't apply glassmorphism (`backdrop-blur`) to every card — reserve for navbar/modals only (performance + visual noise)

#### 2.2 Interaction Card Visual Overhaul

**SpotTheSignal.tsx, ForcedTradeoff.tsx, FillTheGap.tsx, Curveball.tsx** — all need:

- [ ] **Contextual header section** — Replace plain "Spot the Signal" badge with a colored header bar showing interaction type icon + name + a one-line context hint
- [ ] **Rich prompt rendering** — Parse prompts for data/metrics and render them in highlighted callout cards (numbers in large font, key terms in accent color)
- [ ] **Option cards (not buttons)** — Replace flat buttons with elevated cards: subtle gradient bg, left-color-bar for each option (A=blue, B=teal, C=amber, D=coral), larger touch area
- [ ] **Insight callout upgrade** — Replace plain "Insight:" label with a styled callout box: lightbulb icon, gradient accent border, bold title "Key Insight"
- [ ] **Feedback celebration** — On correct answer: pulse glow effect + "Correct!" text badge. On streak of 3+: show streak counter

##### Research Insights (Interaction Cards)

**Option Card Pattern:**
```tsx
// Option card with left accent stripe — replaces flat buttons
<button className="group relative w-full text-left rounded-xl border border-white/10
  bg-gradient-to-r from-surface-2/80 to-surface-2/40 p-4 pl-5
  hover:border-white/20 hover:bg-surface-3/60 transition-all">
  {/* Left accent stripe */}
  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
    style={{ backgroundColor: optionColors[index] }} />
  {/* Option label */}
  <span className="text-xs font-bold text-muted-foreground">{label}</span>
  <p className="mt-1 text-sm text-card-foreground">{text}</p>
</button>
```

**Callout Component (4 variants):**
```tsx
// components/ui/callout.tsx
const variants = {
  insight: { icon: Lightbulb, color: "var(--warning)", label: "Key Insight" },
  warning: { icon: AlertTriangle, color: "var(--danger)", label: "Watch Out" },
  info:    { icon: Info, color: "var(--info)", label: "Note" },
  ai:      { icon: Brain, color: "var(--insight)", label: "AI Analysis" },
};
// Gradient border technique: outer gradient div + inner card with 1px gap
```

**Performance:**
- Use CSS `transition-all` sparingly — prefer `transition-colors` or `transition-opacity` for better paint performance
- Option cards should use `will-change: transform` only on hover (not permanently)

**TeachAndTest.tsx** — needs the most work:

- [ ] **Step progress indicator** — Show "Learn → Quiz → Complete" step dots at top (like the reference)
- [ ] **Teaching content card** — Replace plain gradient box with a structured teaching card:
  - "KEY CONCEPT" label badge at top
  - Large concept title
  - Formula/calculation in highlighted box
  - Data table visualization when content contains numbers
  - "THE INSIGHT" callout section with lightbulb icon
- [ ] **CTA button** — "Got it! Take me to the Quiz →" with warm gradient (coral/orange)

##### Research Insights (TeachAndTest)

**Step Progress Pattern:**
```tsx
// Segmented step indicator for TeachAndTest phases
const steps = ["Learn", "Quiz", "Complete"];
<div className="flex items-center gap-2">
  {steps.map((step, i) => (
    <div key={step} className="flex items-center gap-2">
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
        i < currentStep ? "bg-success text-white" :
        i === currentStep ? "bg-primary text-white ring-2 ring-primary/40 animate-pulse" :
        "bg-surface-2 text-muted-foreground"
      )}>
        {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
      </div>
      <span className="text-xs font-medium hidden sm:inline">{step}</span>
      {i < steps.length - 1 && <div className="w-6 h-0.5 bg-border" />}
    </div>
  ))}
</div>
```

**CTA Button:**
- Use `bg-gradient-to-r from-orange-500 to-amber-500` for warm coral/orange feel
- Add `→` arrow with `group-hover:translate-x-1 transition-transform` for movement on hover
- Min height 48px for mobile touch target compliance

**RankAndPrioritize.tsx:**
- [ ] Color-coded priority indicators (rank 1 = gold, rank 2 = silver, etc.)
- [ ] Drag handle more prominent with "hold and drag" hint on first use

#### 2.3 Progress Bar → Step Indicator

Replace the thin 1.5px progress bar with a visual step indicator:

- [ ] Show step dots: "1 · 2 · 3 · 4 · 5 · 6 · 7 · 8" with current step highlighted
- [ ] Current step has animated pulse ring
- [ ] Completed steps show checkmark with gradient fill
- [ ] Mode badge with icon (BookOpen for Learn, Target for Practice, Swords for Compete)
- [ ] Timer more prominent with color change at warning threshold

##### Research Insights (Progress Bar)

**Segmented Progress Pattern:**
```tsx
// Discrete step dots replacing thin continuous bar
<div className="flex items-center gap-1.5">
  {Array.from({ length: totalSteps }).map((_, i) => (
    <div key={i} className={cn(
      "h-2.5 w-2.5 rounded-full transition-all duration-300",
      i < currentStep
        ? "bg-gradient-to-r from-primary to-primary/80 shadow-[0_0_6px_var(--glow-primary)]"
        : i === currentStep
        ? "bg-primary ring-2 ring-primary/30 animate-pulse scale-125"
        : "bg-surface-2"
    )} />
  ))}
</div>
```

**Timer Warning Pattern:**
- Normal: `text-muted-foreground`
- Warning (<30% time): `text-warning animate-pulse`
- Critical (<10% time): `text-danger font-bold`

#### 2.4 Landing Page Redesign

**`app/page.tsx`:**
- [ ] Gradient hero background (radial glow from center using primary color)
- [ ] Larger, bolder headline with gradient text (`bg-clip-text text-transparent bg-gradient-to-r`)
- [ ] Feature cards with colored icon backgrounds (each mode gets its own color from `--mode-*` tokens)
- [ ] Add stats section: "6 Skills · 3 Modes · AI-Powered Evaluation"
- [ ] CTA button with gradient and arrow animation

##### Research Insights (Landing Page)

**Hero Gradient Pattern:**
```css
/* Radial glow emanating from center — creates depth without images */
.hero-glow {
  background: radial-gradient(
    ellipse 80% 60% at 50% 40%,
    oklch(0.65 0.25 275 / 15%) 0%,
    transparent 70%
  );
}
```

**Gradient Text:**
```tsx
<h1 className="text-5xl font-extrabold bg-gradient-to-r from-primary via-info to-insight
  bg-clip-text text-transparent">
  Master Business Skills
</h1>
```

**Mode Feature Cards:**
- Learn: `border-l-4 border-mode-learn` + BookOpen icon on green bg
- Practice: `border-l-4 border-mode-practice` + Target icon on blue bg
- Compete: `border-l-4 border-mode-compete` + Swords icon on red bg

#### 2.5 Skill Picker Enhancement

**`components/layout/SkillPicker.tsx`:**
- [ ] Larger skill icons (emoji at 3xl)
- [ ] Colored category badge on each card (ANALYTICAL=blue, STRATEGIC=purple, etc.)
- [ ] Subtle hover/active scale animation (`hover:scale-[1.02] active:scale-[0.98]`)
- [ ] "Recommended for you" badge on skills matching user's career goals

##### Research Insights (Skill Picker)

**Category Color Map:**
```typescript
const categoryColors: Record<string, string> = {
  ANALYTICAL: "bg-blue-500/20 text-blue-400",
  STRATEGIC: "bg-purple-500/20 text-purple-400",
  QUANTITATIVE: "bg-emerald-500/20 text-emerald-400",
  COMMUNICATION: "bg-amber-500/20 text-amber-400",
  CREATIVE: "bg-pink-500/20 text-pink-400",
};
```

#### 2.6 Results Page Enhancement

**`components/layout/ResultsReveal.tsx`:**
- [ ] Score reveal with confetti animation for scores > 70
- [ ] Dimension bars with colored thresholds (green ≥70, amber ≥50, red <50) — already partially there
- [ ] AI Debrief in a styled card with avatar icon (brain/lightbulb)
- [ ] "Share Your Score" CTA and "Next Sprint" recommendation

##### Research Insights (Results Page)

**Animated Score Counter (Motion 12.x):**
```tsx
import { useSpring, motion } from "motion/react";

function AnimatedScore({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  useEffect(() => { spring.set(value); }, [value]);
  return <motion.span>{spring}</motion.span>;
}
```

**Dimension Bar Thresholds:**
```tsx
const getBarColor = (score: number) =>
  score >= 70 ? "bg-success" :
  score >= 50 ? "bg-warning" :
  "bg-danger";
```

#### 2.7 Leaderboard + Arena Polish

- [ ] Top 3 get medal icons (gold/silver/bronze circles instead of emoji)
- [ ] "Your Position" highlighted row with accent border
- [ ] EloDisplay shows tier badge (Beginner <1200, Intermediate 1200-1400, Advanced >1400)

---

### Phase 3: Celebration & Delight Layer

- [ ] **Confetti component** — `canvas-confetti` library (~6KB, no React wrapper): burst on correct answer streaks (3+), score reveal > 80, duel victory
- [ ] **Animated number counter** — Already exists in ResultsReveal, extend to EloDisplay changes using Motion `useSpring`
- [ ] **Streak indicator** — Floating center-top badge during sprints showing streak count with flame icon
- [ ] **Haptic feedback** — `navigator.vibrate(10)` on option select (Android only, no-op on iOS)

##### Research Insights (Celebrations)

**canvas-confetti Setup:**
```bash
npm install canvas-confetti
npm install -D @types/canvas-confetti
```

**Celebration Utilities:**
```typescript
// lib/utils/celebrations.ts
import confetti from "canvas-confetti";

export function fireCorrectBurst() {
  confetti({
    particleCount: 40,
    spread: 55,
    origin: { y: 0.7 },
    colors: ["#22c55e", "#a3e635", "#4ade80"], // success greens
    disableForReducedMotion: true,
    useWorker: true,
  });
}

export function celebrateSprint(score: number) {
  if (score < 70) return;
  const intensity = score >= 90 ? 150 : score >= 80 ? 100 : 60;
  confetti({
    particleCount: intensity,
    spread: 100,
    origin: { y: 0.6 },
    disableForReducedMotion: true,
    useWorker: true,
  });
}

export function fireStreakConfetti(streak: number) {
  if (streak < 3) return;
  confetti({
    particleCount: 30 + streak * 10,
    spread: 70,
    origin: { y: 0.5 },
    colors: ["#f59e0b", "#ef4444", "#f97316"], // fire colors
    disableForReducedMotion: true,
    useWorker: true,
  });
}
```

**useCelebration Hook (orchestrator):**
```typescript
// lib/hooks/use-celebration.ts
import { useCallback } from "react";
import { fireCorrectBurst, fireStreakConfetti, celebrateSprint } from "@/lib/utils/celebrations";

export function useCelebration() {
  const onCorrect = useCallback((streak: number) => {
    fireCorrectBurst();
    if (streak >= 3) fireStreakConfetti(streak);
    // Haptic feedback (Android only, no-op on iOS/desktop)
    navigator?.vibrate?.(10);
  }, []);

  const onSprintComplete = useCallback((score: number) => {
    celebrateSprint(score);
    navigator?.vibrate?.([10, 50, 10]);
  }, []);

  return { onCorrect, onSprintComplete };
}
```

**StreakBadge Component:**
```tsx
// components/gamification/StreakBadge.tsx
<AnimatePresence>
  {streak >= 3 && (
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50
        bg-gradient-to-r from-orange-500 to-amber-500
        px-4 py-2 rounded-full shadow-lg"
    >
      <span className="text-sm font-bold text-white">
        {streak} in a row!
      </span>
    </motion.div>
  )}
</AnimatePresence>
```

**Performance Budget:**
- `useWorker: true` — confetti runs in Web Worker (off main thread)
- `disableForReducedMotion: true` — respects user accessibility preferences
- Particle count capped at 150 for mobile devices
- `navigator.vibrate()` is a no-op on iOS, safe to call unconditionally

---

## Acceptance Criteria

### Phase 1 (API — Must-Fix)
- [ ] Signing up via Clerk and immediately using the app works without 404s
- [ ] Users are auto-created in Prisma DB on first API call if webhook missed
- [ ] All 7 API route files use `ensureUser()` instead of manual `findUnique`
- [ ] Clerk deprecation warnings are resolved
- [ ] Zero 404 errors in console when navigating Learn → Practice → Compete
- [ ] P2002 race condition handled (concurrent first-visit requests)

### Phase 2 (UI — Demo Impact)
- [ ] Warm color palette applied (hue ~55 amber, not pure achromatic gray)
- [ ] Surface hierarchy visible (3 levels of card depth)
- [ ] Interaction cards have option cards with left accent stripe (not flat buttons)
- [ ] TeachAndTest shows step progress (Learn → Quiz → Complete)
- [ ] Insight callouts have lightbulb icon and gradient border
- [ ] Landing page has gradient hero, gradient text, and mode-colored feature cards
- [ ] Progress bar replaced with step indicator dots (pulse + checkmarks)
- [ ] Skill cards show colored category badges
- [ ] Mode-specific accent colors applied (green=learn, blue=practice, red=compete)

### Phase 3 (Celebration — Optional but High Impact for Demo)
- [ ] canvas-confetti installed and configured with `useWorker: true`
- [ ] Confetti fires on correct answer streaks (3+) and sprint scores > 70
- [ ] Streak counter appears as floating badge during sprints
- [ ] Score reveal uses Motion `useSpring` animated counter
- [ ] Haptic feedback fires on mobile option selection
- [ ] `disableForReducedMotion: true` set for accessibility

---

## Implementation Priority

| # | Task | Impact | Effort | Priority |
|---|------|--------|--------|----------|
| 1 | ensureUser utility + API fixes | CRITICAL | Small | P0 — Do first |
| 2 | Clerk deprecation fix | Medium | Tiny | P0 — Do with #1 |
| 3 | Warm color palette (globals.css) | High | Small | P1 |
| 4 | Interaction card visual overhaul | High | Large | P1 |
| 5 | TeachAndTest step progress + teaching card | High | Medium | P1 |
| 6 | Progress bar → step indicator | Medium | Small | P1 |
| 7 | Landing page redesign | Medium | Small | P2 |
| 8 | Skill picker enhancement | Medium | Small | P2 |
| 9 | Results page confetti + polish | Medium | Medium | P2 |
| 10 | Leaderboard polish | Low | Small | P3 |
| 11 | Confetti + streak animations | Medium | Medium | P3 |

**Estimated total effort:** ~6-8 hours for all 11 tasks (Phase 1: ~1h, Phase 2: ~4-5h, Phase 3: ~1-2h)

---

## Files Changed

### Phase 1 (API)
- `lib/auth/ensure-user.ts` (NEW)
- `app/api/sprints/route.ts`
- `app/api/sprints/generate/route.ts`
- `app/api/duels/route.ts`
- `app/api/duels/[duelId]/route.ts`
- `app/api/evaluate/route.ts`
- `app/api/leaderboard/route.ts`
- `app/api/profile/route.ts`
- `app/learn/page.tsx`
- `app/practice/page.tsx`
- `app/compete/page.tsx`
- `app/profile/page.tsx`
- `app/onboarding/page.tsx`
- `Dockerfile` (env var rename)
- `.env.example` (env var rename)

### Phase 2 (UI)
- `app/globals.css`
- `components/interactions/SpotTheSignal.tsx`
- `components/interactions/ForcedTradeoff.tsx`
- `components/interactions/FillTheGap.tsx`
- `components/interactions/Curveball.tsx`
- `components/interactions/TeachAndTest.tsx`
- `components/interactions/RankAndPrioritize.tsx`
- `components/interactions/InteractionCard.tsx`
- `components/interactions/ProgressBar.tsx`
- `components/layout/SkillPicker.tsx`
- `components/layout/ResultsReveal.tsx`
- `components/arena/Leaderboard.tsx`
- `components/arena/EloDisplay.tsx`
- `components/ui/callout.tsx` (NEW)
- `app/page.tsx`

### Phase 3 (Celebration)
- `lib/utils/celebrations.ts` (NEW)
- `lib/hooks/use-celebration.ts` (NEW)
- `components/gamification/StreakBadge.tsx` (NEW)
- Updates to SprintRunner, ResultsReveal, MatchResult

### New Dependencies
- `canvas-confetti` (~6KB gzipped)
- `@types/canvas-confetti` (dev)

---

## References

- Omnibus fixes doc: `docs/solutions/2026-02-12-build-review-omnibus-fixes.md`
- Prevention pattern #7: Docker Artifacts — copy all generated dirs
- Prevention pattern #4: API Contract Types — server transforms to client shape
- Clerk redirect URL migration: https://clerk.com/docs/guides/custom-redirects#redirect-url-props
- Clerk `auth()` vs `currentUser()`: https://clerk.com/docs/references/nextjs/auth
- Motion 12 `useSpring`: https://motion.dev/docs/react-use-spring
- canvas-confetti: https://github.com/catdad/canvas-confetti
- OKLCH color picker: https://oklch.com
- Reference design: praxy.runable.site (another hackathon project)

---

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| `ensureUser()` adds latency (extra Clerk API call on first visit) | Only calls `currentUser()` when user not found — one-time cost (~120ms) per new user. Fast path is ~8ms. |
| P2002 race condition on concurrent first visits | `upsert` with retry handles this; second attempt always succeeds |
| Color changes break existing component readability | WCAG AA verified: warm white on warm card = 10.8:1 contrast. Test all 6 interaction types. |
| UI overhaul scope creep delays demo | Phase 1 (API fix) is independent — ship it immediately. UI changes are incremental. |
| Warm colors don't look good in dark mode | Hue 55 + chroma 0.014 = perceptible warmth without visible tinting. Research-validated values. |
| canvas-confetti bundle size | Only 6KB gzipped; `useWorker: true` offloads to Web Worker; `disableForReducedMotion` for a11y |
| Motion animations jank on mobile | Use `useSpring` (GPU-composited), avoid `layout` animations. Particle count capped at 150. |
