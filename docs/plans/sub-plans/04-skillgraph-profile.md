---
title: "Phase 1d: Skill Graph & Profile"
type: feat
date: 2026-02-11
depends_on: [00-foundation]
blocks: [06-integration]
owner: SKILLGRAPH-PROFILE agent
estimated_time: 4-5 hours
hackathon_priority: HIGH (Demo 30% - visual wow factor)
---

# Phase 1d: Skill Graph & Profile

**The Skill Graph radar is the visual centerpiece of the demo. Make it beautiful.**

## Files to Create/Edit

```
components/skill-graph/
  RadarChart.tsx           # 6-axis radar with gradient fill + animation
  SkillCard.tsx            # Individual skill: name, icon, score bar, Elo
  CareerMatchBar.tsx       # "85% match for PM" progress bar
components/arena/
  DuelCard.tsx             # Duel lobby card
  EloDisplay.tsx           # Animated Elo number (ticks up/down)
  MatchResult.tsx          # Head-to-head: two radars + dimension winners
  Leaderboard.tsx          # Table with SWR polling
app/profile/
  page.tsx                 # Own profile (private)
  [userId]/page.tsx        # Public profile
app/leaderboard/
  page.tsx                 # Filterable leaderboard
```

## Component Specs

### RadarChart.tsx (THE MONEY SHOT)
- Recharts RadarChart with 6 axes: Strategic Thinking, Analytical Rigor, Prioritization, Commercial Acumen, Communication, Adaptability
- Domain: [0, 100]
- Gradient fill (brand purple/blue) with `fillOpacity={0.4}`
- Animated entrance on first render (motion scale 0 -> 1)
- Support overlay of two datasets (for head-to-head comparison)
- Responsive: fills container width, 300px height on mobile
- Dark mode: light grid lines, white axis labels
- `'use client'` component

### SkillCard.tsx
- Skill icon (emoji) + name
- Score bar (0-100) with animated fill
- Elo badge with rank number
- Tap to navigate to that skill's sprints

### CareerMatchBar.tsx
- Career icon + name + percentage
- Animated progress bar fill
- Sort by match percentage (highest first)

### EloDisplay.tsx
- Large number display
- On change: animate counting from old to new value
- Green glow + up arrow for increase
- Red glow + down arrow for decrease
- Use motion for the counting animation

### MatchResult.tsx
- Two RadarCharts side by side (or overlaid on mobile)
- Per-dimension comparison: winner highlighted
- Overall winner announcement with Elo change
- "View detailed analysis" expandable section

### Leaderboard.tsx
- Table: Rank | Avatar+Name | Elo | Matches | Streak
- SWR with `refreshInterval: 5000`
- Skill filter tabs at top
- "Provisional" badge for < 10 matches
- Highlight current user's row

### Profile Page
- Avatar + name (from Clerk)
- RadarChart (aggregate across all skills)
- Per-skill cards: SkillCard for each skill with scores
- Career match section: CareerMatchBar for each career goal
- Recent activity: last 5 sprint attempts with scores
- Share button (copies public profile URL)

### Public Profile Page
- Same layout as own profile but read-only
- OG meta tags for social sharing (Phase 4 polish)

## Done When
- [ ] RadarChart renders with 6 axes and animated entrance
- [ ] RadarChart supports two-dataset overlay for H2H
- [ ] EloDisplay animates on value change
- [ ] Leaderboard polls and updates
- [ ] Profile page renders with all sections
- [ ] Public profile is viewable without auth
