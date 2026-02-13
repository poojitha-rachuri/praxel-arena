# No-Scroll UX Overhaul + Visual Polish

**Date:** 2026-02-13
**Status:** Brainstorm complete
**Priority:** Critical (hackathon demo Feb 16)

---

## What We're Building

A comprehensive UX overhaul that eliminates unnecessary scrolling across all screens, introduces a Duolingo-inspired skill path for Learn/Practice modes, gives Compete an arena personality, fixes the Challenge 404 bug, adds dynamic chart rendering to interactions, and cleans up career path display with swipeable cards and consistent icons.

## Why This Approach

The current UI stacks too much vertically (banners + headers + accordions = 250px before actionable content on Learn/Practice). The accordion pattern is functional but uninspiring compared to gamified alternatives. The Compete page lacks personality. The Challenge feature is broken. These issues collectively undermine the demo experience.

---

## Key Decisions

### 1. Learn/Practice: Hybrid Cards + Duolingo-Style Path

**Main screen (Learn or Practice):**
- Replace SkillAccordion with a **2-column grid of skill cards** (3 rows)
- Each card: skill icon + name + SVG progress ring (x/12 sprints) + tap to drill in
- CareerProgressBanner becomes a **compact strip** at top (icon + career name + % — one line, not two)
- ModeWelcomeBanner moved to a dismissible tooltip or removed entirely
- Everything fits in viewport — zero scroll on the main skill selection screen

**Drill-down screen (`/learn/[skillSlug]` or `/practice/[skillSlug]`):**
- Duolingo-inspired **winding node path** for the selected skill
- Each node = one sprint (circle, ~48px diameter)
- Nodes wind in an S-curve pattern (3-4 nodes per horizontal wave)
- Topic names appear as full-width section dividers between groups
- **Three visual states:** completed (green/gold fill), active (pulsing glow, slightly larger), locked (gray, muted)
- Tap a node → popup card with sprint title + description + "Start" button
- Auto-scroll to the user's current active node on load
- Floating "jump back" button if user scrolls away from active position

**Why hybrid:** Skill cards give a clean overview without scroll. The path per skill provides the game-like progression feel. Best balance of polish and build effort.

### 2. Onboarding: 4 Steps, All Viewport-Fit

**Step 1 (Welcome):** Already compact. No changes needed.

**Step 2 (Career Paths):**
- Replace 1-col/2-col grid with **horizontal swipeable cards** (one card visible at a time, peek next)
- Each card: large icon + career name + 1-line description
- Swipe or tap dots to browse. Tap to select (max 3). Selected cards get a checkmark overlay.
- "Continue" button always visible at bottom without scrolling

**Step 3 (How It Works):**
- Compact to a **horizontal 3-step indicator** (Learn → Practice → Compete) with icons
- One-line description for each, all in a single row or minimal stack
- Must fit in viewport

**Step 4 (Skill Map):**
- Show only the **top 3 recommended skills** as compact pills/chips instead of full list
- "Start here" indicator on first skill
- Fits viewport easily with 3 items

### 3. Compete: Arena/Tournament Feel

**Visual direction:**
- Dark, intense gradients (deep violet → black)
- "Find Opponent" as hero CTA (large button, center stage)
- Active duels displayed as **horizontal scroll cards** with live status badges (waiting, in-progress, completed)
- Leaderboard snippet: top 3 players as a compact podium
- Remove the duplicate header issue (single CompeteLobby component owns everything)
- Skill selection for duels: horizontal pill selector, not a 2-col grid

### 4. Challenge 404 Fix

**Root cause:** `ChallengesHub.tsx:259` routes timed challenges to `/compete/${challenge.skill.slug}` which hits the `[duelId]` dynamic route with a slug instead of an actual duel ID.

**Fix options:**
- Option A: Create a proper route for timed challenges (`/challenges/timed/[challengeId]`)
- Option B: Route to a new timed challenge page that creates a sprint attempt inline

**Decision:** Fix the routing to point to the correct page. The challenge detail/session flow should work within the `/challenges` route group.

Also: Remove dead code at `/app/challenge/page.tsx` and `/app/challenge/ChallengeSelector.tsx` (duplicates of ChallengesHub).

### 5. Image Support: Dynamic Charts via Recharts

**Approach:** Render charts client-side using recharts (already in the project).

**Schema change:**
- Add optional `chartData` field (JSON) to the `Interaction` model
- Structure: `{ type: "bar"|"line"|"pie"|"area", data: [...], xKey, yKey, title }`

**Rendering:**
- New `InteractionChart` component that takes `chartData` and renders the appropriate recharts chart
- Used primarily in `SpotTheSignal` interactions (data/metrics with 4 options)
- Can also enhance `TeachAndTest` for data interpretation topics

**Content pipeline:**
- Update `scripts/generate-content.ts` to include `chartData` in AI generation prompts for data-heavy interactions
- Zod schema validation for chart data structure

**Why recharts over images:** No storage needed, responsive, theme-aware (CSS variables), already a dependency. Perfect for the types of charts business professionals analyze.

### 6. Career Paths: Swipeable + Consistent Icons

**Career display on mode pages:**
- Replace single CareerProgressBanner with **horizontal swipeable career cards**
- If user selected 2-3 careers, show all as swipeable cards (not just the top match)
- Each card: career icon + name + match % + progress bar
- Swipe indicator dots below

**Icon style:**
- Career path icons should use the same Lucide icon style as skill icons
- Current career icons are inconsistent — standardize to match the design language
- Map each career outcome to a specific Lucide icon

---

## Open Questions

1. **Path node interactivity:** Should locked nodes show a "why locked?" tooltip, or just be visually muted?
2. **Chart data volume:** How many of the 576 interactions should have charts? All SpotTheSignal types (~96), or selective?
3. **Career card behavior:** Tap a career card to... filter skills by relevance? Navigate to career detail? Just informational?

---

## Scope Estimate (Hackathon Reality Check)

| Item | Effort | Demo Impact |
|------|--------|-------------|
| Skill cards grid (Learn/Practice main) | Medium | High |
| Duolingo-style node path (drill-down) | High | Very High |
| Onboarding viewport-fit | Low | Medium |
| Compete arena redesign | Medium | High |
| Challenge 404 fix | Low | Critical |
| Recharts in interactions | Medium | High |
| Career swipeable cards + icons | Low-Medium | Medium |

**Recommended build order:**
1. Challenge 404 fix (unblocks demo)
2. Skill cards grid + node path (biggest visual wow)
3. Compete arena redesign (demo highlight)
4. Recharts in interactions (visual richness)
5. Onboarding compact (polish)
6. Career swipeable cards (polish)
