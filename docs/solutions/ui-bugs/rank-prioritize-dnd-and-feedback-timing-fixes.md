---
title: "Drag-and-drop broken on mobile + feedback text disappears too fast"
category: ui-bugs
tags: [drag-and-drop, dnd-kit, touch-events, mobile, feedback-timing, user-pacing, animation-conflicts, mode-dependent, visibilitychange]
module: InteractionEngine
symptom: "RANK_AND_PRIORITIZE items won't drag on mobile and jitter on web; insight/feedback text vanishes before users can read it (300-700ms)"
root_cause: "DnD: touch-manipulation CSS blocks TouchSensor, Motion layout prop fights dnd-kit transforms, no DragOverlay. Feedback: layered setTimeout chain (800-1200ms + 400ms) with no user control, same timing across all modes despite different learning goals"
date_solved: 2026-02-12
pr: "#3"
severity: critical
stack: [Next.js 16, React 19, dnd-kit/core 6.3.1, dnd-kit/sortable 10.0.0, motion 12.34.0]
---

# Drag-and-Drop Broken on Mobile + Feedback Too Fast to Read

## Problem Summary

Two critical UX failures in Praxel Arena's interaction engine prevented users from completing RANK_AND_PRIORITIZE questions on mobile (touch events intercepted by CSS before dnd-kit could claim them) and reading educational feedback after answering (layered setTimeout timers caused 300-700ms visibility windows). Fixed by removing `touch-manipulation` CSS, eliminating Motion `layout` prop conflicts, adding DragOverlay + sensor tuning, and replacing fixed timers with mode-dependent feedback pacing (LEARN=manual Continue button, PRACTICE=reading-speed calculation 2-8s, COMPETE=1.2s flash). Eight files changed across interaction components and new timing utility.

## Root Cause Analysis

### Problem 1: Drag-and-Drop Failures

**Symptoms**: Touch drag never initiates on mobile (iOS Safari, Android Chrome). Items jump/jitter during reorder on web. No visual feedback for the dragged item.

**Root Causes** (7 identified):

1. **CSS `touch-manipulation` on drag handle** — allows browser scroll gestures which steal touch events before dnd-kit's TouchSensor can claim them
2. **Motion `layout` prop conflict** — both Motion's `layout` animation and dnd-kit's `CSS.Transform.toString(transform)` animate the CSS `transform` property simultaneously, causing visual jitter
3. **No `DragOverlay`** — without a dedicated overlay layer, the dragged item remained in document flow, causing visual artifacts and clipping
4. **No axis restriction** — items could be dragged horizontally, confusing the reorder gesture
5. **TouchSensor delay too aggressive** — 150ms (was) vs 250ms (recommended by dnd-kit)
6. **PointerSensor distance too small** — 5px caused accidental drags
7. **Drag handle below 44px** — was `w-10 h-10` (40px), below project minimum

### Problem 2: Feedback Timing Too Fast

**Symptoms**: After answering a question, educational insight text is readable for only ~300-700ms. Users cannot read tips. Feedback overlay animation gets cut mid-bounce.

**Timing Chain Analysis**:
```
0ms     -> User taps answer, insight starts animating in
200ms   -> Insight animation delay
500ms   -> Insight fully visible (300ms duration + 200ms delay)
800ms   -> Component calls onAnswer (setTimeout in component)
800ms   -> SprintRunner receives answer, starts 400ms feedbackDelay timer
1200ms  -> Card advances to next question
```
**Insight is fully readable for only 300ms** (500ms -> 800ms).

**Root Causes**:
1. **Layered timer chain** — component-level setTimeout (800-1200ms) + SprintRunner feedbackDelay (400ms) = stacked delays with tiny reading window
2. **No mode differentiation** — same timing for LEARN/PRACTICE/COMPETE despite different learning goals
3. **No user control** — no Continue button, no way to pause or extend feedback
4. **Tab-switch edge case** — timer fires when user switches tabs, skipping feedback entirely

## Solution

### Fix 1: Drag-and-Drop Rebuild

**Strategy**: Eliminate CSS/animation conflicts, add proper touch handling, implement dnd-kit best practices.

**1. `touch-none` on drag handle** (was `touch-manipulation`):
```tsx
// BEFORE (broken):
className="touch-manipulation active:bg-muted"

// AFTER (fixed):
className="touch-none active:bg-muted"
```

**2. Removed `layout` prop** — changed `motion.div` to plain `div`:
```tsx
// BEFORE (jittery — two animation systems fighting for transform):
<motion.div ref={setNodeRef} style={style} layout className={...}>

// AFTER (smooth — dnd-kit owns positioning exclusively):
<div ref={setNodeRef} style={style} className={...}>
```

**3. Added DragOverlay with `activeId` tracking**:
```tsx
const [activeId, setActiveId] = useState<string | null>(null);

const handleDragStart = useCallback((event: DragStartEvent) => {
  setActiveId(String(event.active.id));
}, []);

// Original item: opacity 0.4 during drag
// Overlay: elevated with shadow + scale
<DragOverlay>
  {activeId ? (
    <DragOverlayItem
      text={optionMap.get(activeId)?.text ?? ""}
      rank={items.indexOf(activeId) + 1}
    />
  ) : null}
</DragOverlay>
```

**4. Added axis and parent modifiers**:
```tsx
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";

<DndContext modifiers={[restrictToVerticalAxis, restrictToParentElement]} ...>
```

**5. Updated sensor config** (dnd-kit official recommendations):
```tsx
useSensor(PointerSensor, { activationConstraint: { distance: 8 } })   // was 5
useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })  // was 150
```

**6. 44px touch target + keyboard focus ring**:
```tsx
className="w-11 h-11 ... touch-none focus-visible:ring-2 focus-visible:ring-primary"
```

**7. Removed setTimeout from `handleLockIn`** — `onAnswer(answer)` called immediately.

### Fix 2: Mode-Dependent Feedback Timing

**Strategy**: Remove all component-level delays, centralize timing in SprintRunner, calculate durations dynamically.

**1. New `lib/utils/feedback-timing.ts`**:
```typescript
export function calculateFeedbackDuration(
  insightText: string | null,
  mode: "LEARN" | "PRACTICE" | "COMPETE"
): number | null {
  if (mode === "LEARN") return null;    // manual Continue
  if (mode === "COMPETE") return 1200;  // fast flash
  // PRACTICE: reading-speed-based (200 WPM, 1.3x buffer, clamped 2-8s)
  if (!insightText) return 2000;
  const words = insightText.trim().split(/\s+/).length;
  const readingTimeMs = (words / 200) * 60 * 1000 * 1.3;
  return Math.min(8000, Math.max(2000, readingTimeMs));
}
```

**2. Removed `setTimeout` from 5 interaction components**:
```tsx
// BEFORE (each component):
setTimeout(() => { onAnswer(optionId); }, 800); // or 1000, 1200

// AFTER (immediate):
onAnswer(optionId);
```

Applied to: SpotTheSignal (800ms), ForcedTradeoff (1000ms), FillTheGap (800ms), Curveball (1000ms), RankAndPrioritize (1200ms).

**3. SprintRunner mode-dependent flow**:
```tsx
const feedbackDuration = calculateFeedbackDuration(insightText, mode);

if (feedbackDuration === null) {
  // LEARN: manual Continue button, no auto-advance
  setWaitingForContinue(true);
} else {
  // PRACTICE/COMPETE: auto-advance after calculated duration
  feedbackTimerRef.current = setTimeout(advance, feedbackDuration);
}
```

**4. Duolingo-style Continue button**:
```tsx
<button onClick={advance} className={cn(
  "w-full min-h-[48px] rounded-xl text-base font-semibold",
  lastCorrect === true ? "bg-success text-success-foreground" :
  lastCorrect === false ? "bg-danger text-danger-foreground" :
  "bg-primary text-primary-foreground"
)}>
  Continue <ArrowRight />
</button>
```
- LEARN mode: always shown (required to advance)
- PRACTICE mode: shown alongside auto-advance timer (tap to skip)
- COMPETE mode: not shown (1.2s auto-advance)

**5. COMPETE mode hides insight text**:
```tsx
const displayInsight = mode === "COMPETE" ? null : resolvedInsight;
```

**6. Visibilitychange handler**:
```tsx
useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden && feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = undefined;
      setWaitingForContinue(true); // switch to manual on tab hide
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);
  return () => {
    document.removeEventListener("visibilitychange", handleVisibility);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  };
}, []);
```

## Code Changes Summary

| File | Change |
|---|---|
| `components/interactions/RankAndPrioritize.tsx` | DnD overhaul: touch-none, removed layout, DragOverlay, modifiers, sensors, 44px handle, focus ring, removed setTimeout |
| `components/interactions/SprintRunner.tsx` | Mode-dependent feedback: advance(), waitingForContinue, Continue button, calculateFeedbackDuration, visibilitychange, COMPETE hides insight |
| `components/interactions/SpotTheSignal.tsx` | Removed 800ms setTimeout |
| `components/interactions/ForcedTradeoff.tsx` | Removed 1000ms setTimeout |
| `components/interactions/FillTheGap.tsx` | Removed 800ms setTimeout |
| `components/interactions/Curveball.tsx` | Removed 1000ms setTimeout |
| `lib/utils/feedback-timing.ts` | **NEW** — calculateFeedbackDuration utility |
| `package.json` | Added `@dnd-kit/modifiers` (~2KB) |

**Timer count**: 12 independent `setTimeout` calls across 7 files -> 1 timer in SprintRunner + 0 in components.

## Prevention Strategies

### 1. dnd-kit + Animation Library Integration Rules

- **NEVER** use Motion's `layout` prop on dnd-kit draggable/droppable elements
- **NEVER** use `touch-manipulation` on drag handles (blocks touch initiation)
- **ALWAYS** use `touch-none` on drag handles
- **ALWAYS** implement `<DragOverlay>` for any sortable UI
- **ALWAYS** add `restrictToVerticalAxis` for vertical-only lists

### 2. Timer Architecture: Single Owner

- **SprintRunner** (or page-level component) is the only timer owner for auto-advance
- Child interaction components call `onAnswer` immediately — never delay internally
- No stacking delays: if a child has 1200ms + parent has 400ms = 1600ms total (bad)

### 3. Mode-Dependent UX Contract

| Mode | Auto-Advance | Feedback Duration | User Control |
|---|---|---|---|
| LEARN | Never | Indefinite | Manual Continue required |
| PRACTICE | Yes (2-8s) | Reading-speed-based | Continue button to skip |
| COMPETE | Yes (1.2s) | Fixed flash | No control |

Apply this pattern to any future mode-dependent behavior.

### 4. Browser Lifecycle Safety

Any component with auto-advance timers MUST:
- Listen for `visibilitychange` events
- Clear timers when `document.hidden` is true
- Switch to manual Continue when returning to foreground

### 5. Touch Target Checklist

- [ ] All interactive elements: minimum 44px x 44px hit area
- [ ] Drag handles: `touch-none` CSS
- [ ] Buttons/links: `touch-manipulation` only if scrollable
- [ ] Focus rings: `focus-visible:ring-2` on all interactive elements
- [ ] Spacing: 8px minimum between adjacent touch targets

### 6. Testing Recommendations

**DnD**: Test on real iOS/Android devices (Chrome DevTools emulation is insufficient for touch). Verify `touch-none` prevents scroll interference. Inspect CSS during drag to confirm no transform conflicts.

**Feedback Timing**: Verify LEARN never auto-advances. Verify PRACTICE auto-advances between 2-8s. Verify tab switch pauses timer. Verify Continue button color matches correctness.

## Related Documentation

### Solution Docs
- `docs/solutions/security-issues/pr1-answer-leak-and-race-conditions.md` — Timer cleanup patterns (`feedbackTimerRef`, `submittedRef`) preserved in this fix
- `docs/solutions/logic-errors/pr2-content-architecture-logic-fixes.md` — `resolvedInsight` useMemo pattern that feeds the feedback display
- `docs/solutions/runtime-errors/evaluation-500-nan-propagation-and-data-fixes.md` — Answer field stripping that prevents correctAnswer/insightAnswer exposure in API

### Plans
- `docs/plans/2026-02-12-fix-ranking-dnd-and-feedback-timing-plan.md` — Authoritative spec for this work
- `docs/plans/sub-plans/01-interaction-engine.md` — Original component specs (InteractionCard spring physics, SprintRunner state management)

### External References
- [dnd-kit TouchSensor docs](https://docs.dndkit.com/api-documentation/sensors/touch) — `delay: 250, tolerance: 5`
- [dnd-kit DragOverlay docs](https://docs.dndkit.com/api-documentation/draggable/drag-overlay)
- [dnd-kit + Framer Motion — GitHub #605](https://github.com/clauderic/dnd-kit/issues/605) — `layout` prop conflict
- Duolingo, Brilliant, Anki — manual "Continue" pattern for learning feedback
