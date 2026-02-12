# UX Polish Overhaul - Brainstorm

**Date**: 2026-02-12
**Status**: Ready for planning
**Branch**: TBD (likely `feat/ux-polish-overhaul`)

## What We're Building

A cohesive design polish pass that addresses 8 UX issues identified from user testing and self-review. The goal is to make Praxel Arena feel professional, clear, and unintimidating for first-time users while fixing several bugs.

### Problem Statement

Early user feedback: "Once I sign in there's too much happening and I'm unable to understand what to do." The app currently has duplicate navigation, emoji-based icons that look unprofessional, empty states, trapped-in-quiz UX, and a -100 XP display bug.

## Why This Approach

**Approach B: Cohesive Polish Pass** was chosen over piecemeal surgical fixes because:
- The "overwhelm" problem is holistic, not a single bug
- A unified design language update makes everything feel intentional
- Bundling related visual changes prevents "half-polished" appearance
- Hackathon demo judges will see the app fresh (first impression matters most)

## Key Decisions

### 1. Remove Top ModeSelector
- **Decision**: Delete `ModeSelector` component entirely
- **Rationale**: Bottom nav already has Learn/Practice/Compete tabs. Duplicate navigation wastes vertical space and creates confusion about which to use.
- **Impact**: Free up ~48px of vertical space on every mode page. Cleaner page headers with just mode name + subtitle.

### 2. Replace Emoji Icons with Lucide SVG Icons
- **Decision**: Use Lucide outline/filled icons in soft-colored circles (one muted accent per skill)
- **Inspiration**: Uxcel Go and Duolingo use clean, rounded, purpose-built icons with consistent color treatment
- **Style**: Icon inside a 40px circle with subtle background tint. Colors are muted/pastel, not saturated.
- **Proposed icon mapping**:

| Skill | Lucide Icon | Circle Color (muted) |
|---|---|---|
| Data Interpretation | `BarChart3` | Blue |
| GTM Strategy | `Rocket` | Emerald |
| Guesstimation | `Calculator` | Amber |
| Pricing & Monetization | `DollarSign` | Violet |
| Prioritization | `Scale` | Rose |
| Stakeholder Communication | `MessageSquare` | Cyan |

- **Implementation**: Update `seed.ts` to store Lucide icon names instead of emoji strings. Create a `SkillIcon` component that maps name -> Lucide component + color.

### 3. Redesign Skill Cards
- **Decision**: Remove colored left borders, use icon circles as primary visual anchor
- **What changes**:
  - Remove the multi-colored left border (distracting, doesn't add meaning)
  - Icon circle on left (see #2 above)
  - Clean typography: skill name (semibold) + description (muted, single line)
  - Progress indicator: subtle inline bar, not a separate element
  - Chevron for navigation affordance
- **What stays**: Card shadow/elevation, tap target size (44px+), progress count (e.g., "1/5")
- **Style reference**: Duolingo's clean list items, Uxcel Go's lesson cards

### 4. Seed Challenges in Database
- **Decision**: Add pre-built challenges to `prisma/seed.ts`
- **What**: 3-5 active challenges (mix of Speed Round + Score Attack + 1 Weekly)
- **Why**: Cron-only creation means fresh DB = empty challenges page. Demo needs populated data.
- **Also**: Ensure Challenges page has proper back navigation (header with back arrow)

### 5. Sprint Exit with Partial Save
- **Decision**: Add X button to sprint header + save partial progress + allow resume
- **Implementation**:
  - Add X/close icon to `ProgressBar` component (top-left of sprint view)
  - Tap X -> confirmation dialog ("Leave sprint? Your progress will be saved.")
  - On confirm: POST partial attempt to API (completedAt: null), navigate to mode page
  - On card listing: show "Resume" badge on partially-completed sprints
  - SprintPageWrapper checks for existing incomplete attempt on mount
- **DB changes**: SprintAttempt already has nullable `completedAt`. Need to track `lastInteractionIndex`.
- **Scope note**: This was previously CUT but user specifically requested it. Keep implementation minimal.

### 6. Fix -100 XP Display Bug
- **Decision**: Debug and fix the profile XP display
- **Root cause investigation needed**: No negative XP exists in code. Likely a level threshold calculation issue where `xpProgress = user.xp - currentLevelXp` produces a negative number due to level/XP mismatch.
- **Fix approach**: Add `Math.max(0, ...)` guard to XP progress display, and audit `levelFromXp` function.

### 7. Simplify Visual Hierarchy on Mode Pages
- **Decision**: Reduce overwhelm through progressive disclosure
- **Changes**:
  - Topic sections collapsed by default (user must tap to expand)
  - "Suggested next" / "Start here" callout for the recommended sprint
  - Cleaner page header: just mode icon + name + one-line description
  - Career progress banner remains but with reduced visual weight
- **Philosophy**: Keep current structure, simplify presentation

### 8. Fix Navigation Gaps
- **Decision**: Ensure every page has a way back
- **Changes**:
  - Challenges detail: add back arrow in header
  - Sprint view: X button (see #5)
  - Consistent `AppShell` usage across all pages (except sprint which has its own nav)

## Open Questions

1. **Icon storage**: Should we store Lucide icon names in DB (flexible, requires mapping component) or hardcode the mapping in a config file (simpler, but skill list is static)?
2. **Resume UX**: Should "Resume" show on the skill list card or inside the accordion when expanded?
3. **Challenge seeding**: Should seeded challenges have realistic timestamps (created today, expires tomorrow) or should seed script use relative dates?

## Scope / Out of Scope

### In Scope
- All 8 issues listed above
- Visual consistency pass (cards, icons, spacing)
- Bug fixes (XP display, empty states, navigation)

### Out of Scope
- New onboarding flow (keep existing structure)
- Leaderboard/Leagues integration
- Complex matchmaking for Compete mode
- OG images / social sharing
- Settings page
- Sprint abandonment analytics

## Success Criteria

- [ ] No duplicate navigation (ModeSelector removed)
- [ ] All skill icons are SVG-based, not emoji
- [ ] Challenges page shows 3+ active challenges on fresh seed
- [ ] User can exit sprint mid-way and resume later
- [ ] Profile never shows negative XP
- [ ] Every page has back navigation
- [ ] First-time user can understand what to do within 10 seconds
- [ ] Visual style feels cohesive and professional (not "default shadcn")
