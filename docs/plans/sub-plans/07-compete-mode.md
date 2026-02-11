---
title: "Phase 3: Compete Mode + Polish"
type: feat
date: 2026-02-11
depends_on: [06-integration]
blocks: [08-demo]
owner: ALL agents + YOU
estimated_time: 12-16 hours (Feb 14-15)
hackathon_priority: CRITICAL (Demo 30% + Opus 4.6 Use 25%)
---

# Phase 3: Compete Mode + Polish (Feb 14-15)

**Compete mode is the WOW moment in the demo. Polish makes it memorable.**

## Feb 14: Compete Mode

### Duel Flow Implementation
- [x] Create duel: POST /api/duels with skillSlug
- [x] Duel lobby shows waiting duels
- [x] AI generates fresh sprint on duel creation (Opus 4.6 showcase!)
- [x] Both players complete same sprint
- [x] AI evaluates head-to-head (show "AI Analyzing..." animation)
- [x] Display MatchResult with per-dimension comparison
- [x] Elo updates + leaderboard shifts
- [x] EloDisplay animates the rating change

### For Demo (Critical Path)
Since this is async duels and you're likely demoing solo:
- [x] Pre-create a duel where "Player 2" already completed
- [x] You complete the sprint live in the demo
- [x] AI evaluates head-to-head immediately
- [x] Show the result + Elo change

**Hack for demo:** Create a seed user "Demo Opponent" with pre-recorded responses. DONE: Alex Chen (Elo 1250) with pre-completed attempt.

## Feb 15: Polish

### Animation Priority (Demo 30%)
1. [x] Card transitions: spring physics, Tinder-swipe feel
2. [x] Score reveal: counting animation (0 -> actual score, 2s duration)
3. [x] Elo change: green pulse (up) / red pulse (down) with number
4. [x] Correct answer: satisfying pulse + color change
5. [x] Radar chart: animated draw (scale 0 -> 1 with spring)
6. [ ] Page transitions: fade or slide between routes (skipped -- not needed for demo)

### Mobile Priority
1. [ ] Test at 375px width (manual test needed)
2. [x] Bottom nav feels native (proper active states)
3. [x] Cards fill viewport height
4. [x] No horizontal scroll
5. [x] Touch drag smooth for RankAndPrioritize (dnd-kit with touch sensors)

### OG Image for Sharing
- CUT per hackathon strategy (low impact vs effort)

### Demo Prep
- [x] Seed demo account with realistic data (varied skill scores, some duels)
- [x] Pre-create a duel ready for live completion
- [x] Deterministic fallback for duel evaluation (demo safety)
- [ ] Test the full demo flow 3x (manual)
- [ ] Record backup demo video in case live fails (manual)

## Done When
- [x] Compete mode works: create duel -> complete -> AI evaluates -> Elo updates
- [x] All animations feel polished (card spring, Elo pulse, answer bounce, radar draw, score count)
- [ ] Mobile layout is clean at 375px (manual test needed)
- CUT: OG image (per hackathon strategy)
- [ ] Demo flow rehearsed and smooth (manual)
