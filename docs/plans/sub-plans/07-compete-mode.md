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
- [ ] Create duel: POST /api/duels with skillSlug
- [ ] Duel lobby shows waiting duels
- [ ] AI generates fresh sprint on duel creation (Opus 4.6 showcase!)
- [ ] Both players complete same sprint
- [ ] AI evaluates head-to-head (show "AI Analyzing..." animation)
- [ ] Display MatchResult with per-dimension comparison
- [ ] Elo updates + leaderboard shifts
- [ ] EloDisplay animates the rating change

### For Demo (Critical Path)
Since this is async duels and you're likely demoing solo:
- Pre-create a duel where "Player 2" already completed
- You complete the sprint live in the demo
- AI evaluates head-to-head immediately
- Show the result + Elo change

**Hack for demo:** Create a seed user "Demo Opponent" with pre-recorded responses.

## Feb 15: Polish

### Animation Priority (Demo 30%)
1. [ ] Card transitions: spring physics, Tinder-swipe feel
2. [ ] Score reveal: counting animation (0 -> actual score, 2s duration)
3. [ ] Elo change: green pulse (up) / red pulse (down) with number
4. [ ] Correct answer: satisfying pulse + color change
5. [ ] Radar chart: animated draw (scale 0 -> 1 with spring)
6. [ ] Page transitions: fade or slide between routes

### Mobile Priority
1. [ ] Test at 375px width
2. [ ] Bottom nav feels native (proper active states)
3. [ ] Cards fill viewport height
4. [ ] No horizontal scroll
5. [ ] Touch drag smooth for RankAndPrioritize

### OG Image for Sharing
- [ ] Next.js ImageResponse API at `/api/og/[userId]`
- [ ] Shows: user name, radar chart (as simple SVG), top 3 Elo ratings
- [ ] Meta tags on public profile page
- [ ] Test: paste profile URL into Slack/Twitter preview

### Demo Prep
- [ ] Seed demo account with realistic data (varied skill scores, some duels)
- [ ] Pre-create a duel ready for live completion
- [ ] Test the full demo flow 3x
- [ ] Record backup demo video in case live fails

## Done When
- [ ] Compete mode works: create duel -> complete -> AI evaluates -> Elo updates
- [ ] All animations feel polished
- [ ] Mobile layout is clean at 375px
- [ ] OG image generates for profiles
- [ ] Demo flow rehearsed and smooth
