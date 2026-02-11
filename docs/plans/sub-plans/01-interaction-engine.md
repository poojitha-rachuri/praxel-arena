---
title: "Phase 1a: Interaction Engine"
type: feat
date: 2026-02-11
depends_on: [00-foundation]
blocks: [06-integration]
owner: INTERACTION-ENGINE agent
estimated_time: 6-8 hours
hackathon_priority: CRITICAL (Demo 30%)
---

# Phase 1a: Interaction Engine

**The heart of the product. This is what judges SEE in the demo.**

## Overview

Build all 6 micro-interaction card components + the SprintRunner orchestrator.
Every component is a full-screen card with motion animations. Mobile-first.

## Files to Create/Edit

```
components/interactions/
  InteractionCard.tsx      # Base card wrapper with motion enter/exit
  SpotTheSignal.tsx        # Data display + 4 options
  ForcedTradeoff.tsx       # Strategic choice + 2-4 options
  FillTheGap.tsx           # Knowledge check + 4 options
  RankAndPrioritize.tsx    # Drag-to-reorder 4 items
  Curveball.tsx            # Like ForcedTradeoff + priorContext banner
  TeachAndTest.tsx         # Teaching preamble + test interaction
  SprintRunner.tsx         # Orchestrates 8-card sequence
  ProgressBar.tsx          # Top progress + timer
```

## Component Specs

### InteractionCard.tsx (Base Wrapper)
- Full-screen card (`min-h-[calc(100vh-120px)]` to account for nav + progress)
- motion enter: `{ x: 300, opacity: 0 }` -> `{ x: 0, opacity: 1 }`
- motion exit: `{ x: -300, opacity: 0 }`
- Spring transition: `type: 'spring', stiffness: 300, damping: 25`
- Renders children (the specific interaction type)
- Shows correct/incorrect feedback overlay after answer

### SpotTheSignal.tsx
- **Prompt**: 1-3 sentences of business scenario/data (bold key metrics)
- **Options**: 4 large tap buttons, each at least 44px height
- **On tap**: Highlight selected, show correct answer with explanation
- **Timing**: target 10s

### ForcedTradeoff.tsx
- **Prompt**: Strategic scenario with real tradeoffs
- **Options**: 2-4 options, each with 1-line description below
- **On tap**: Show selection, brief explanation of tradeoff
- **Timing**: target 15-20s

### FillTheGap.tsx
- **Prompt**: Statement with a blank `____`
- **Options**: 4 fill-in choices
- **On tap**: Fill in the blank with selected answer, show correct
- **Timing**: target 10s

### RankAndPrioritize.tsx
- **Prompt**: "Rank these in order of priority"
- **Items**: 4 draggable items using @dnd-kit/sortable
- **Confirm button**: "Lock in ranking" (44px+ height)
- **Touch-friendly**: Large drag handles, visual feedback on drag
- **Timing**: target 15-25s

### Curveball.tsx
- **Banner at top**: "CURVEBALL: [what changed]" in warning color
- **priorContext**: Shows what the user chose earlier
- **Rest**: Same as ForcedTradeoff
- **Timing**: target 10-20s

### TeachAndTest.tsx (LEARN mode only)
- **Phase 1 - Teach**: 2-3 sentences of teaching content, auto-advance after 5s or tap "Got it"
- **Phase 2 - Test**: Immediately shows a test interaction (any type except TEACH_AND_TEST)
- **Timing**: 20-30s total

### SprintRunner.tsx (Orchestrator)
- Receives `Sprint` object with array of interactions
- Manages state: `currentIndex`, `responses[]`, `startTime`
- Renders one InteractionCard at a time via AnimatePresence
- On answer: records `{ interactionId, response, timeMs }`, advances to next
- On complete: calls `onComplete(responses)` callback
- Shows ProgressBar at top

### ProgressBar.tsx
- Shows `currentIndex / totalInteractions` as filled bar
- Shows elapsed timer (mm:ss format)
- Subtle, doesn't distract from content

## Design Constraints
- `'use client'` on every component
- Import from `motion/react` (NOT `framer-motion`)
- Dark mode: use shadcn dark theme tokens
- 375px min width
- 44px min touch targets
- No hover-dependent states (use `active:` for feedback)

## Done When
- [ ] All 6 interaction types render correctly with test data
- [ ] SprintRunner advances through 8 cards smoothly
- [ ] Card transitions feel snappy (spring physics, < 200ms)
- [ ] RankAndPrioritize drag works on touch devices
- [ ] ProgressBar shows progress and timer
- [ ] Correct/incorrect feedback shows briefly before advancing
