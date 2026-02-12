---
title: "fix: Ranking drag-and-drop broken on mobile + feedback insight too fast to read"
type: fix
date: 2026-02-12
priority: P1
---

# fix: Ranking Drag-and-Drop & Feedback Insight Timing

## Overview

Two critical UX issues in the sprint interaction flow:

1. **RANK_AND_PRIORITIZE drag-and-drop is broken** on mobile (touch doesn't initiate drag) and glitchy on web (items jump during reorder). Root causes: missing `touch-action: none`, Motion `layout` prop conflicting with dnd-kit transforms, no `DragOverlay`, no axis restriction.

2. **Insight/feedback disappears too fast** — after answering, the educational insight text is visible for only ~300-700ms before auto-advancing. Users literally cannot read the tips. Root cause: layered timers (800-1200ms component delay + 400ms SprintRunner delay) with no user control.

## Problem Statement

### DnD: Touch Never Initiates Drag

`RankAndPrioritize.tsx:68-85` — The drag handle button uses `touch-manipulation` (allows scroll) instead of `touch-none` (prevents browser from stealing touch events). The browser intercepts the touch as a scroll before dnd-kit's `TouchSensor` can claim it.

Additionally, each `SortableItem` is a `<motion.div layout>` (line 57) that fights with dnd-kit's `CSS.Transform.toString(transform)` — two animation systems competing for the same transform property, causing items to jump.

**Confirmed version compatibility:** `@dnd-kit/sortable@10.0.0` requires `@dnd-kit/core@^6.3.0` — our 6.3.1 is fine.

### Feedback: Only ~300-700ms of Reading Time

The timing chain for SpotTheSignal (most common interaction type):

```
0ms     → User taps answer, insight starts animating in
200ms   → Insight animation delay
500ms   → Insight fully visible (300ms duration + 200ms delay)
800ms   → Component calls onAnswer (setTimeout in SpotTheSignal.tsx:47)
800ms   → SprintRunner receives answer, starts 400ms feedbackDelay timer
1200ms  → Card advances to next question
```

**Insight is fully readable for only 300ms** (500ms→800ms). The InteractionCard's feedback overlay bounce animation (600ms) is also interrupted at 400ms, creating a jarring mid-bounce vanish.

Every major learning app (Duolingo, Brilliant, Anki) uses **manual "Continue" button** — not auto-advance — for feedback.

## Proposed Solution

### Phase 1: Fix Drag-and-Drop (RankAndPrioritize.tsx)

**Files:** `components/interactions/RankAndPrioritize.tsx`, `package.json`

- [x] **1.1** Install `@dnd-kit/modifiers` package
- [x] **1.2** Change drag handle CSS from `touch-manipulation` to `touch-none` (line ~73)
- [x] **1.3** Remove `layout` prop from SortableItem's `<motion.div>` (line ~57). Keep `motion.div` for scale/shadow effects during drag using `animate` prop instead
- [x] **1.4** Add `DragOverlay` component with `activeId` state tracking via `onDragStart`/`onDragEnd`. Render overlay item with elevated appearance (shadow, slight scale-up). Original item shows as translucent placeholder during drag
- [x] **1.5** Add `restrictToVerticalAxis` and `restrictToParentElement` modifiers to `DndContext`
- [x] **1.6** Update sensor config: `TouchSensor` delay `150→250ms` (official recommendation), `PointerSensor` distance `5→8px`
- [x] **1.7** Increase drag handle from `w-10 h-10` (40px) to `w-11 h-11` (44px) to meet project's touch target minimum
- [x] **1.8** Add visible focus ring on drag handle for keyboard users: `focus-visible:ring-2 focus-visible:ring-primary`

### Phase 2: Fix Feedback Timing (Mode-Dependent)

**Files:** `components/interactions/SprintRunner.tsx`, all 5 interaction components, `InteractionCard.tsx`

The core change: **remove all `setTimeout` calls from individual interaction components**. Move ALL timing control to SprintRunner. Components call `onAnswer` immediately after the user answers.

- [x] **2.1** Create `lib/utils/feedback-timing.ts` with mode-dependent timing logic:

```typescript
// lib/utils/feedback-timing.ts
const MOBILE_WPM = 200;
const MIN_DISPLAY_MS = 2000;
const MAX_DISPLAY_MS = 8000;
const BUFFER_FACTOR = 1.3;

export function calculateFeedbackDuration(
  insightText: string | null,
  mode: "LEARN" | "PRACTICE" | "COMPETE"
): number | null {
  if (mode === "LEARN") return null; // null = manual continue (no timer)
  if (mode === "COMPETE") return 1200; // fast, no insight shown
  // PRACTICE: reading-speed-based
  if (!insightText) return MIN_DISPLAY_MS;
  const words = insightText.trim().split(/\s+/).length;
  const readingTimeMs = (words / MOBILE_WPM) * 60 * 1000 * BUFFER_FACTOR;
  return Math.min(MAX_DISPLAY_MS, Math.max(MIN_DISPLAY_MS, readingTimeMs));
}
```

- [x] **2.2** Remove `setTimeout` + `onAnswer` delay from all 5 interaction components:
  - `SpotTheSignal.tsx:46-48` — remove 800ms setTimeout, call `onAnswer` immediately after setting `revealed = true`
  - `ForcedTradeoff.tsx:45-47` — remove 1000ms setTimeout
  - `FillTheGap.tsx:59-61` — remove 800ms setTimeout
  - `RankAndPrioritize.tsx:164-166` — remove 1200ms setTimeout
  - `Curveball.tsx:40-42` — remove 1000ms setTimeout

- [x] **2.3** Redesign SprintRunner feedback flow:
  - On `handleAnswer` callback, immediately show feedback state (correct/incorrect + insight)
  - **LEARN mode:** Show insight + "Continue" button at bottom. No auto-advance timer. User taps "Continue" to proceed
  - **PRACTICE mode:** Show insight + auto-advance timer (calculated from word count). Visible countdown bar. Tap anywhere pauses timer and shows "Continue" button
  - **COMPETE mode:** Show correct/incorrect flash only (no insight text). Auto-advance after 1200ms

- [x] **2.4** Add "Continue" button to the feedback state in `InteractionCard.tsx` or SprintRunner. Duolingo-style: full-width button at bottom, 44px height, primary color on correct, destructive on incorrect

- [x] **2.5** Fix InteractionCard feedback overlay: let it play fully since LEARN/PRACTICE now wait for user action (no longer cut off at 400ms)

- [x] **2.6** Pass `mode` prop through to SprintRunner (it already has access to sprint data — extract mode from there)

### Phase 3: Browser Lifecycle Handling

- [x] **3.1** Add `visibilitychange` handler in SprintRunner: pause feedback timers when document is hidden, resume on visible. Prevents feedback from vanishing while user is in another tab/app

```typescript
// In SprintRunner useEffect:
const handleVisibility = () => {
  if (document.hidden && feedbackTimerRef.current) {
    clearTimeout(feedbackTimerRef.current);
    // Store remaining time
  }
};
document.addEventListener("visibilitychange", handleVisibility);
return () => document.removeEventListener("visibilitychange", handleVisibility);
```

## Technical Considerations

### dnd-kit + Motion Interaction
The `layout` prop MUST be removed from SortableItem. Motion's layout animation and dnd-kit's CSS transforms compete for the same property. Use `animate={{ scale, boxShadow }}` for drag visual effects instead — this doesn't conflict because scale/shadow don't affect position.

### Timer Architecture Simplification
Currently 12 independent `setTimeout` calls across 7 files. After this fix: 1 timer in SprintRunner (for PRACTICE/COMPETE auto-advance) + 0 timers in components. Each component just calls `onAnswer(answer)` when the user submits.

### Existing Guards Still Apply
The `submittedRef` double-tap guard and `feedbackTimerRef` cleanup from PR #1 fixes remain intact. The `streakRef` stale closure pattern is preserved.

### Package Addition
`@dnd-kit/modifiers` — lightweight (~2KB), official companion package. Provides `restrictToVerticalAxis` and `restrictToParentElement`.

## Acceptance Criteria

### Drag-and-Drop
- [ ] Touch drag works on mobile (iOS Safari, Android Chrome) — user can grab handle and reorder items
- [ ] No visual jumping/jitter during drag on web
- [ ] Dragged item shows elevated overlay (shadow, scale) above other items
- [ ] Items can only be dragged vertically, not horizontally
- [ ] Drag handle has visible focus ring for keyboard users
- [ ] Drag handle meets 44px touch target minimum
- [ ] Keyboard reorder works (Tab to handle → Space to pick up → Arrow keys to move → Space to drop)

### Feedback Timing
- [ ] **LEARN mode:** Insight stays visible until user taps "Continue" button. No auto-advance
- [ ] **PRACTICE mode:** Insight visible for reading-speed-based duration (2-8s depending on text length). Visible countdown bar. Tap pauses and shows Continue button
- [ ] **COMPETE mode:** Quick correct/incorrect flash (1.2s), no insight text shown
- [ ] Feedback overlay animation completes without being cut off
- [ ] Backgrounding the app pauses feedback timer; returning shows remaining feedback

## Dependencies & Risks

- **New package:** `@dnd-kit/modifiers` (official, lightweight)
- **Risk:** Removing `setTimeout` from 5 components is a broad change. Each component's "reveal" animation (showing correct answer highlight) now happens without a coordinated delay. Components should still set `revealed = true` for their internal visual state, just not delay `onAnswer`
- **Risk:** COMPETE mode timing change (from current ~1200-1600ms to 1200ms flat) is minor but should be tested
- **Hackathon note:** Phase 1 (DnD fix) and Phase 2 (feedback timing) are independent — can be done in parallel or either one first

## References & Research

### Internal
- `components/interactions/RankAndPrioritize.tsx` — 267 lines, current DnD implementation
- `components/interactions/SprintRunner.tsx:155-170` — current feedbackDelay (400ms)
- `components/interactions/InteractionCard.tsx:42-79` — feedback overlay animation
- `docs/solutions/security-issues/pr1-answer-leak-and-race-conditions.md` — timer cleanup patterns, double-tap guard
- `docs/solutions/logic-errors/pr2-content-architecture-logic-fixes.md` — insightAnswer resolution

### External
- [dnd-kit TouchSensor docs](https://docs.dndkit.com/api-documentation/sensors/touch) — `delay: 250, tolerance: 5` official recommendation
- [dnd-kit DragOverlay docs](https://docs.dndkit.com/api-documentation/draggable/drag-overlay) — required for sortable in scrollable containers
- [dnd-kit Modifiers docs](https://next.dndkit.com/legacy/api-documentation/modifiers) — `restrictToVerticalAxis`
- [dnd-kit + Framer Motion — GitHub #605](https://github.com/clauderic/dnd-kit/issues/605) — `layout` prop conflict with transforms
- [Nielsen Norman Group — Response Times](https://www.nngroup.com/articles/response-times-3-important-limits/) — 0.1s/1s/10s thresholds
- [Frontiers in Psychology — Feedback Types in Mobile Quiz Apps](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.665144/full) — elaborated feedback only works when users can read it
- Duolingo, Brilliant, Anki all use manual "Continue" for learning feedback
