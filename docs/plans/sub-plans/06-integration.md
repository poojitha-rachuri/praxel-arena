---
title: "Phase 2: Integration"
type: feat
date: 2026-02-11
depends_on: [01, 02, 03, 04, 05]
blocks: [07-polish]
owner: ALL agents + YOU
estimated_time: 8-12 hours (full day)
hackathon_priority: CRITICAL
---

# Phase 2: Integration (Feb 13)

**Wire everything together. Learn mode end-to-end by EOD.**

## Priority Order

### P0: Learn Mode End-to-End (Morning)
1. Clerk signup -> webhook -> user in DB
2. Onboarding -> save career goals -> redirect to /learn
3. Skill picker -> load skills from API
4. Select skill -> load LEARN sprints from API
5. Start sprint -> SprintRunner renders interactions
6. Complete sprint -> POST /api/evaluate -> scores
7. Results page -> radar chart + feedback

### P1: Practice Mode (Afternoon)
1. Practice page -> skill picker
2. Load practice sprints (harder, no teaching preamble)
3. SprintRunner (same component, different mode)
4. Evaluate -> AI debrief (richer than LEARN)
5. Results with "Areas to improve" focus

### P2: Profile + Leaderboard (Afternoon)
1. Profile page loads skill scores from API
2. RadarChart renders with real data
3. Career match % calculated and displayed
4. Leaderboard shows rankings

## Integration Test Script

Run through this manually:

```
1. Open http://localhost:3000
2. Click "Get Started Free"
3. Sign up with Google
4. Verify: user appears in Prisma Studio
5. Complete onboarding (pick PM career)
6. Verify: UserCareerGoal created in DB
7. Go to Learn tab
8. Select Guesstimation
9. Start first sprint
10. Complete all 8 interactions
11. Verify: SprintAttempt created in DB
12. See results page with scores
13. Check profile -> radar chart has data
14. Check leaderboard -> user appears
```

## Common Integration Issues

| Issue | Fix |
|---|---|
| SprintRunner doesn't receive data | Check API response shape matches Sprint type |
| Clerk webhook fails | Check webhook URL, CLERK_WEBHOOK_SECRET, svix verification |
| Prisma connection exhausted | Ensure singleton pattern in lib/db.ts |
| motion animations janky | Ensure AnimatePresence has `mode="wait"` |
| Async params error | Ensure all `params` are `await`ed (Next.js 16) |
| Recharts SSR error | Ensure RadarChart is in `'use client'` component |

## Done When
- [ ] Complete Learn mode works end-to-end (signup to scores)
- [ ] Practice mode works end-to-end
- [ ] Profile shows real skill data
- [ ] Leaderboard renders
- [ ] No console errors in browser
