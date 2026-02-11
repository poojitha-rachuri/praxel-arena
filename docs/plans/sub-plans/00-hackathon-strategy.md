---
title: "Hackathon Strategy: Judging Criteria Optimization"
type: strategy
date: 2026-02-11
priority: READ FIRST
---

# Hackathon Strategy: How We Win

**Deadline: Feb 16, 3:00 PM EST. Judging Feb 16-18.**

## Judging Criteria Breakdown

| Criterion | Weight | Our Strategy |
|---|---|---|
| **Demo** | **30%** | Card-swipe animations + duel comparison = visually memorable |
| **Opus 4.6 Use** | **25%** | "Opus is not the chatbot. It's the entire testing infrastructure." |
| **Impact** | **25%** | Skill credentialing for 10M+ business professionals |
| **Depth & Execution** | **20%** | 6-dimension scoring, Elo system, coherent data model |

## Feature Priority Matrix (Weighted by Judging)

| Feature | Demo (30%) | Impact (25%) | Opus Use (25%) | Depth (20%) | **Weighted** | **Verdict** |
|---|---|---|---|---|---|---|
| COMPETE mode (duels + Elo) | 5 | 5 | 5 | 3 | **4.60** | MUST SHIP |
| LEARN mode (card-swipe) | 5 | 4 | 3 | 4 | **4.10** | MUST SHIP |
| Skill Graph (radar chart) | 5 | 4 | 2 | 4 | **3.85** | MUST SHIP |
| Onboarding (career -> skills) | 4 | 4 | 3 | 3 | **3.55** | MUST SHIP |
| PRACTICE mode + AI debrief | 3 | 4 | 4 | 3 | **3.50** | NICE TO HAVE |
| Leaderboard | 3 | 3 | 1 | 3 | **2.55** | NICE TO HAVE |
| Public Profile + OG image | 2 | 4 | 1 | 3 | **2.55** | CUT |
| Duel matchmaking (complex) | 1 | 2 | 1 | 3 | **1.70** | CUT |
| Sprint abandonment/resume | 0 | 2 | 0 | 2 | **1.00** | CUT |

## The Three Winning Moments

Every decision should serve these three moments in the demo:

### 1. The Card Swipe (Demo 30%)
Smooth, fast, satisfying interaction cards with spring physics. "I want to use this."
**Polish budget: Half a day on InteractionCard.tsx alone.**

### 2. The Duel Comparison (Opus 4.6 Use 25%)
Two radar charts side by side. AI judging who is the better business professional.
Per-dimension breakdown. "This is genuinely novel."
**This is the WOW moment. The demo should build to this climax.**

### 3. The Credential Payoff (Impact 25%)
A filled radar chart with Elo ratings. A verifiable, earned skill credential.
"This could replace certificates."
**The closing shot of the demo.**

## Opus 4.6 Framing (25% of score)

**Core message: "Opus 4.6 is not the tutor. It is the entire testing infrastructure."**

Seven distinct uses, from expected to surprising:

| # | Use | Novelty |
|---|---|---|
| 1 | Content generation (sprint interactions) | Expected |
| 2 | Answer evaluation (scoring) | Expected |
| 3 | **Psychometric assessment** (6-dimension cognitive profile) | Strong |
| 4 | **Head-to-head judge** (comparative analysis of two full sessions) | Strong |
| 5 | **Personalized coaching debrief** (references specific responses) | Strong |
| 6 | **Adaptive difficulty calibration** (adjusts to weaknesses) | Surprising |
| 7 | **Assessment architect** (designs balanced, fair tests from scratch) | Surprising |

**Demo callout:** "Every duel generates a unique, balanced assessment instrument. Opus 4.6 is doing in 8 seconds what takes assessment firms months."

## Demo Safety Protocol

| Risk | Mitigation |
|---|---|
| AI call times out during demo | Pre-generate + cache 3-5 duel sprints. Show loading animation but serve cached result. |
| Invalid JSON from AI | LEARN/PRACTICE use only static content. Zero AI calls for these modes. |
| Evaluation fails | Fallback to deterministic scoring (correctAnswer matching). |
| Clerk login fails | Pre-authenticated session in browser. Clear cookies only if resetting. |
| Animation jank | Test on actual demo device 3x before recording. |

## What to Pre-Polish vs. Leave Rough

### PRE-POLISH (disproportionate time)
- Card-swipe animations (spring physics, < 200ms feel)
- Score reveal animation (counting from 0 -> actual)
- Radar chart animated draw
- Duel result comparison (staggered dimension reveals)
- Onboarding career selection (RPG class selection feel)

### LEAVE ROUGH (functional, minimal styling)
- Landing page (judges never see it -- start demo signed in)
- Leaderboard (plain shadcn table is fine)
- Practice mode (if built, polish debrief only, not the sprint UI)
- Error states (demo environment is controlled)
- Mobile bottom nav (basic icon bar)

## DO NOT BUILD
- Public profile OG image generation
- Complex matchmaking (Elo range expansion, timeouts)
- Sprint abandonment/resume
- Settings/account pages
- Custom error pages

## Optimized Demo Script (3 minutes)

### [0:00-0:20] THE HOOK
Start with the payoff, not the problem. Show a filled radar chart.
"This is a skill credential. Not bought. Earned by outperforming 47 professionals in AI-judged duels."

### [0:20-0:50] ONBOARDING
Fresh signup. Pick PM career goal. Skills animate in.

### [0:50-1:40] LEARN MODE
3-4 card interactions. Teaching chain. Different types.
"Every interaction is 10-30 seconds. Active thinking, not passive reading."
Skip to results. Radar chart draws. "6 dimensions of cognitive assessment."

### [1:40-2:40] COMPETE MODE (THE CLIMAX)
"Now the real test." Create duel. Show loading: "Opus 4.6 is designing your assessment..."
Complete 2-3 cards. Switch to pre-completed opponent.
Show MatchResult: two radars, dimension winners, Elo animation.
"Opus 4.6 compared full response sets across 6 dimensions."

### [2:40-3:00] THE CLOSE
Profile with updated radar. "Every skill measured. Every competitor ranked. Every credential earned. Powered by Opus 4.6 -- not as a chatbot, but as the entire assessment infrastructure."
