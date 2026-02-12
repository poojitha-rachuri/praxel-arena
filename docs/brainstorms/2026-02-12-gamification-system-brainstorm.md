# Gamification System Brainstorm

**Date:** 2026-02-12
**Status:** Approved
**Approach:** All-at-Once (full schema + parallel build)

---

## What We're Building

A comprehensive gamification system for Praxel Arena that drives daily engagement, competitive motivation, and long-term goal achievement. The system introduces XP, streaks, challenges, leagues, seasons, and credentials -- turning skill development into a game professionals can't put down.

### Core Engagement Loop

```
Complete Sprint → Earn XP → Maintain Streak → Climb League → Unlock Credentials
     ↑                                                              |
     └──────────── Challenge Notifications ←────────────────────────┘
```

---

## Key Decisions

### 1. Dual Currency: XP + Elo

| Currency | Purpose | Drives | Leaderboard |
|----------|---------|--------|-------------|
| **XP** | Engagement metric | Volume, consistency, challenges | Weekly XP leaderboard + leagues |
| **Elo** | Skill metric | Quality, win rate in Compete | Per-skill ranking + monthly seasons |

- XP rewards playing. Elo rewards winning.
- Both have separate leaderboards and progression systems.
- XP powers the casual/engagement loop. Elo powers the credential/prestige loop.

### 2. XP Economy (Moderate Progression)

| Action | XP Earned | Notes |
|--------|-----------|-------|
| Complete LEARN sprint | 25-50 XP | Scaled by score (0-100 → 25-50) |
| Complete PRACTICE sprint | 30-60 XP | Slightly more than LEARN |
| Complete COMPETE sprint | 40-75 XP | Win or lose, you earn XP |
| Win a duel | +100 XP bonus | On top of sprint completion XP |
| Speed round challenge | 50-250 XP | Based on placement (1st-10th) |
| Score attack challenge | 75-300 XP | Based on placement |
| Daily streak bonus | 1.5x after 7 days | Multiplier on all XP earned that day |
| First sprint of the day | +25 XP bonus | "Daily bonus" incentive |

**Level Curve (exponential):**

| Level | Total XP Required | Approx. Sessions to Reach |
|-------|-------------------|--------------------------|
| 1 | 0 | Start |
| 5 | 500 | ~5-7 sessions |
| 10 | 2,000 | ~15-20 sessions |
| 15 | 5,000 | ~35-40 sessions |
| 20 | 10,000 | ~70-80 sessions |
| 25 | 20,000 | ~140 sessions |
| 30 | 35,000 | ~250 sessions |
| 50 | 100,000 | ~700 sessions |

**Formula:** `xpForLevel(n) = Math.floor(100 * (n ^ 1.5))`

### 3. Streak System

- **Tracked by:** Daily activity (complete at least 1 sprint per day)
- **Reset:** Midnight UTC if no sprint completed previous day
- **Streak freeze:** Not for v1 (keep it simple)
- **Visual:** Flame icon with day count in navbar + profile
- **Milestones:** 3, 7, 14, 30, 60, 100, 365 days (confetti celebration at each)
- **Streak bonus:** 1.5x XP multiplier kicks in at 7+ day streak

### 4. Challenges

Two types, pre-defined templates that rotate:

#### Speed Rounds
- **Format:** "Complete N interactions in M minutes"
- **Scoring:** Fastest completion time with accuracy threshold (70%+ correct)
- **Leaderboard:** Per-challenge, sorted by time
- **Frequency:** 2-3 available daily
- **Duration:** 5-15 minutes each

**Templates:**
1. "Quick Fire" - 20 interactions, 5 min, any skill
2. "Skill Sprint" - 15 interactions, 4 min, specific skill
3. "Accuracy Blitz" - 10 interactions, 3 min, 90%+ accuracy required
4. "Marathon" - 40 interactions, 10 min, mixed skills
5. "Lightning Round" - 8 interactions, 2 min, advanced difficulty

#### Score Attacks
- **Format:** "Get the highest score on this featured sprint"
- **Scoring:** Total score (0-100), tiebreaker by time
- **Leaderboard:** Per-challenge, sorted by score then time
- **Frequency:** 1 featured daily, 1 featured weekly
- **Duration:** Standard sprint time (~3-5 min)

**Templates:**
1. "Daily Spotlight" - Random skill, random topic, beat the high score
2. "Weekly Master" - Specific skill, advanced difficulty, highest score wins
3. "Perfect Run" - Any sprint, bonus XP for 100% accuracy
4. "Dimension Focus" - Score highest on a specific dimension (e.g., analyticalThinking)
5. "Community Challenge" - Sprint chosen by previous day's winner

### 5. Leagues (Weekly XP)

**Structure:** Duolingo-inspired with business professional theming

| League | Tier | Promotion | Demotion |
|--------|------|-----------|----------|
| Rookie | 0 | Auto after week 1 | None (protected) |
| Analyst | 1 | Top 10 of 30 | N/A (lowest real tier) |
| Consultant | 2 | Top 10 of 30 | Bottom 5 |
| Director | 3 | Top 10 of 30 | Bottom 5 |
| VP | 4 | Top 10 of 30 | Bottom 5 |
| C-Suite | 5 | Top 5 of 30 | Bottom 5 |
| Board | 6 | Top 3 of 30 | Bottom 5 |
| Chairman | 7 | — | Bottom 3 |

- **Reset:** Every Monday at midnight UTC
- **Group size:** 30 users per league instance
- **Rookie protection:** First week, users are in a separate "Rookie" league. Can only go up. No demotion. Matched with other new users.
- **XP counted:** Only XP earned during the league week
- **Rewards:** League completion XP bonus (scales by tier), promotion celebration

### 6. Elo Seasons (Monthly)

- **Duration:** Calendar month
- **Tiers:** Same as existing (Bronze < 1300, Silver 1300-1499, Gold 1500-1799, Diamond 1800+)
- **Season rewards:** XP bonus based on peak Elo, season badge in profile
- **Season reset:** Soft reset (Elo compressed toward 1200 by 25% at month start)
- **Season leaderboard:** Per-skill, shows peak Elo during season
- **End-of-season:** Summary card (peak Elo, W/L record, best dimension, XP earned)

### 7. Credentials & Titles

#### Elo Credentials (Professional, permanent)
| Elo Threshold | Credential | Badge |
|---------------|------------|-------|
| 1500 | Certified Practitioner | Silver shield |
| 1800 | Expert | Gold shield |
| 2000 | Master | Diamond shield |
| 2200 | Grandmaster | Platinum shield |

- **Per-skill:** Each skill has independent credentials
- **Permanent:** Once earned, never lost (even if Elo drops)
- **Shareable:** Generate credential card for LinkedIn/social
- **Verification:** Unique URL to verify credential

#### XP Titles (Fun, progression-based)
| Level | Title |
|-------|-------|
| 1-4 | Intern |
| 5-9 | Analyst |
| 10-14 | Associate |
| 15-19 | Manager |
| 20-24 | Senior Manager |
| 25-29 | Director |
| 30-39 | VP |
| 40-49 | SVP |
| 50+ | C-Suite |

### 8. Cold Start: Rookie Protection

- **Week 1:** All new users placed in "Rookie" league (separate pool)
- **Rookie league:** No demotion possible, only promotion
- **Matchmaking:** Rookies matched with other rookies in Compete (or bots if insufficient)
- **After week 1:** Auto-promoted to Analyst league tier
- **Leaderboard seeding:** Not needed if rookie league is separate; real leaderboards populate naturally

---

## Why This Approach

### All-at-Once Build Rationale
- **Schema coherence:** All tables designed together, no intermediate migration debt
- **Feature interdependence:** XP feeds leagues, challenges feed XP, streaks multiply XP -- everything connects
- **Demo readiness:** When it works, the full system demos spectacularly
- **Risk mitigation:** Schema can be built and tested before UI, reducing integration risk

### Why Not Layered
- Features are deeply interconnected (league placement depends on XP, which depends on challenges)
- Intermediate states would require temporary UI that gets replaced
- Schema changes in layers risk migration conflicts

### Why Not Event-Driven
- YAGNI for hackathon scope
- Direct function calls work fine for this scale
- Can always add events later if needed

---

## Open Questions

1. **Bot opponents for Compete cold start:** Should we create AI-controlled opponents for duels when no real opponents are available? (Separate from league bots)
2. **Notification system:** Push notifications for streak reminders? Or just in-app? (Probably in-app only for v1)
3. **Challenge creation UI:** Should admins be able to create custom challenges, or is the template rotation sufficient?
4. **League group assignment:** Random assignment within tier, or seeded by previous week's XP?
5. **Season reset magnitude:** 25% compression toward 1200 -- too aggressive? Too mild?

---

## Architecture Notes

### New Database Models Needed

```
User (extend existing)
  + xp: Int
  + level: Int
  + currentStreak: Int
  + longestStreak: Int
  + lastActivityDate: DateTime
  + leagueTier: Int (0-7)
  + weeklyXp: Int (reset weekly)
  + dailyGoal: Enum (CASUAL, REGULAR, INTENSE) -- future

XpTransaction
  - id, userId, amount, source (SPRINT, DUEL_WIN, CHALLENGE, STREAK_BONUS, DAILY_BONUS, LEAGUE_REWARD)
  - metadata: Json (sprintId, challengeId, etc.)
  - createdAt

Challenge
  - id, type (SPEED_ROUND, SCORE_ATTACK), templateId
  - name, description, skillId (nullable for any-skill)
  - config: Json (interactionCount, timeLimit, accuracyThreshold, difficulty)
  - startsAt, endsAt, isActive
  - rewardXp: Int

ChallengeAttempt
  - id, userId, challengeId
  - score, timeSpent, accuracy
  - xpEarned, rank (computed)
  - completedAt

LeagueInstance
  - id, tier (0-7), weekStart, weekEnd
  - members: LeagueMembership[]

LeagueMembership
  - id, userId, leagueInstanceId
  - weeklyXp, finalRank
  - promoted, demoted

EloSeason
  - id, month, year
  - seasonStart, seasonEnd

UserSeasonStats
  - id, userId, eloSeasonId, skillId
  - startElo, peakElo, endElo
  - wins, losses, matchCount
  - xpEarned

Credential
  - id, userId, skillId
  - type (PRACTITIONER, EXPERT, MASTER, GRANDMASTER)
  - eloAtGrant, grantedAt
  - verificationCode: String (unique)

Achievement (future, not v1)
  - id, name, description, icon, category
  - condition: Json

UserAchievement (future, not v1)
  - id, userId, achievementId, unlockedAt
```

### Key API Routes Needed

- `POST /api/xp` - Award XP (internal, called after sprint/duel completion)
- `GET /api/xp/history` - XP transaction history
- `GET /api/streaks` - Current streak info
- `POST /api/streaks/check` - Check and update streak (called on app load)
- `GET /api/challenges` - Active challenges
- `POST /api/challenges/:id/attempt` - Submit challenge attempt
- `GET /api/challenges/:id/leaderboard` - Challenge leaderboard
- `GET /api/leagues` - Current league info for user
- `GET /api/leagues/:id/standings` - League standings
- `POST /api/leagues/assign` - Assign users to leagues (cron/weekly)
- `GET /api/seasons/current` - Current Elo season
- `GET /api/seasons/:id/leaderboard` - Season leaderboard
- `GET /api/credentials` - User's earned credentials
- `GET /api/credentials/:code/verify` - Public verification endpoint

### UI Components Needed

- `StreakDisplay` - Navbar streak flame + count
- `XpBar` - Level progress bar (profile + navbar)
- `LeagueCard` - Current league tier + standings preview
- `ChallengeCard` - Active challenge with timer + CTA
- `ChallengeLeaderboard` - Per-challenge rankings
- `LeagueStandings` - Full league view with promotion/demotion zones
- `SeasonSummary` - End-of-season stats card
- `CredentialBadge` - Shareable credential display
- `CredentialVerify` - Public verification page
- `XpPopup` - "+50 XP" animation after actions
- `LevelUpModal` - Celebration on level up
- `LeaguePromotionModal` - Celebration on league promotion

### Integration Points

1. **Sprint completion** → Award XP + update streak + check level up + check credential threshold
2. **Duel completion** → Award XP (+ win bonus) + update Elo + check credential + update season stats
3. **Challenge completion** → Award XP + update challenge leaderboard
4. **App load** → Check streak continuity + show active challenges
5. **Weekly cron** → Reset leagues, assign new league instances, tally promotions/demotions
6. **Monthly cron** → Close Elo season, soft-reset Elo, generate season summaries

---

## Success Metrics

- **Daily active users:** Target 60%+ DAU/MAU (Duolingo benchmark: 55%)
- **Streak retention:** 50%+ users maintain 7-day streak
- **Challenge participation:** 30%+ of DAU attempt at least 1 challenge daily
- **Compete adoption:** 20%+ of users try at least 1 duel in first week
- **Credential earned:** 10%+ of active users earn at least 1 credential in first month

---

## Next Steps

Run `/workflows:plan` to create implementation plan with file-by-file breakdown.
