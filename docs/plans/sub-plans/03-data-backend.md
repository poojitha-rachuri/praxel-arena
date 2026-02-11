---
title: "Phase 1c: Data Backend"
type: feat
date: 2026-02-11
depends_on: [00-foundation]
blocks: [06-integration]
owner: DATA-BACKEND agent
estimated_time: 4-6 hours
hackathon_priority: HIGH (Depth & Execution 20%)
---

# Phase 1c: Data Backend

**API routes, database layer, matchmaking, seed data.**

## Files to Create/Edit

```
lib/db.ts                           # Prisma singleton with PrismaPg adapter
prisma/schema.prisma                # Already created in Phase 0
prisma/seed.ts                      # Full seed with skills, careers, static sprints
prisma/seed-data/
  skills.json                       # Skill definitions
  careers.json                      # Career outcome definitions
  learn-sprints/                    # Pre-generated LEARN sprints (from skill)
    guesstimation-1.json
    guesstimation-2.json
    gtm-strategy-1.json
    gtm-strategy-2.json
    prioritization-1.json
    prioritization-2.json
  practice-interactions/            # Pre-generated practice pool (from skill)
    guesstimation.json
    gtm-strategy.json
    prioritization.json
app/api/
  skills/route.ts                   # GET all skills with career mappings
  sprints/
    route.ts                        # GET sprints by skill + mode
    generate/route.ts               # POST generate compete sprint
  evaluate/route.ts                 # POST evaluate sprint attempt
  duels/
    route.ts                        # POST create/join duel
    [duelId]/route.ts               # GET duel status
  leaderboard/route.ts              # GET leaderboard by skill
  profile/route.ts                  # GET/PUT own profile
  profile/[userId]/route.ts         # GET public profile
  webhooks/clerk/route.ts           # POST Clerk webhook
```

## API Route Specs

### GET /api/skills
- Public route (no auth needed for landing page)
- Returns all skills with career mappings and icons
- Include `relevanceWeight` for career match calculation

### GET /api/sprints?skillSlug=X&mode=LEARN
- Auth required
- Returns sprints for skill + mode from DB
- For LEARN: static sprints only (`isGenerated: false`)
- For PRACTICE: static pool, ordered by difficulty
- Include full interactions array with content

### POST /api/sprints/generate
- Auth required
- Body: `{ skillSlug, difficulty }`
- Calls AI-ENGINE to generate COMPETE sprint
- Saves to DB with `isGenerated: true`
- Rate limit: 5/user/hour
- Returns generated sprint

### POST /api/evaluate
- Auth required
- Body: `{ sprintId, responses: [{ interactionId, response, timeMs }] }`
- Creates SprintAttempt
- Calls AI-ENGINE evaluate
- Updates UserSkillScore
- Returns EvaluationResponse

### POST /api/duels
- Auth required
- Body: `{ skillSlug }` (to create) or `{ duelId }` (to join)
- **Create**: Find waiting duel within 200 Elo OR create new
- **Join**: Verify within Elo range, generate sprint, set status IN_PROGRESS
- Returns duel object

### GET /api/duels/[duelId]
- Auth required (only participants)
- Returns duel status, both attempts if complete
- If both complete + not evaluated: trigger evaluation

### GET /api/leaderboard?skillSlug=X
- Public route
- Returns top 50 by Elo for skill
- Include rank, name, avatar, Elo, matches played
- "Provisional" flag for < 10 matches

### GET /api/profile
- Auth required
- Returns own user + skill scores + Elo ratings + career match percentages
- Career match = weighted average of skill scores mapped to career outcomes

### POST /api/webhooks/clerk
- Webhook verification via svix
- On `user.created`: create User in DB with Clerk ID

## Matchmaking Logic (Duels)

```
1. User requests duel for skillSlug
2. Query: SELECT * FROM Duel WHERE skillSlug = X AND status = 'WAITING' AND ABS(player1Elo - userElo) <= 200
3. If found: join duel, generate sprint, set IN_PROGRESS
4. If not found: create duel with status WAITING
5. Duel expires after 15 min if no player2
6. After both complete: AI evaluates, Elo updates, status COMPLETED
```

## Done When
- [ ] All API routes return correct data shapes
- [ ] Seed data loads (skills, careers, static sprints)
- [ ] Clerk webhook creates users in DB
- [ ] Duel matchmaking works (create + join)
- [ ] Leaderboard returns sorted results
- [ ] Profile returns skill scores + career match %
