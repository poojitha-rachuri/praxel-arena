# Praxel Arena

**Learn. Practice. Compete. Credential.**

Praxel Arena is a skill credentialing platform for business professionals. Users learn through micro-interactions, practice with adaptive challenges, and compete in AI-generated head-to-head duels to build a public Skill Graph that replaces traditional credentials.

## How It Works

| Mode | Description |
|------|-------------|
| **Learn** | Teaching chains with micro-interactions. 2-3 sentence lessons followed by immediate tests. |
| **Practice** | No teaching preamble. Harder challenges. AI-generated debrief at the end. |
| **Compete** | Head-to-head duels. Claude generates unique business scenarios. Elo-rated. |

Every interaction takes 10-30 seconds. No passive reading. Active thinking only.

## How Claude Opus 4.6 Is Used

Claude Opus 4.6 powers the entire assessment infrastructure -- not as a chatbot, but as seven distinct capabilities:

1. **Dynamic Scenario Generation** -- Each competitive duel features a unique, coherent business scenario that unfolds across 8 micro-interactions. No two duels are identical.
2. **6-Dimension Cognitive Assessment** -- Evaluates responses across Analytical Thinking, Strategic Reasoning, Quantitative Reasoning, Communication Clarity, Decision Quality, and Creative Problem Solving.
3. **Head-to-Head Comparative Analysis** -- Compares two players' full response sets like a business school professor grading essays side-by-side.
4. **Mentorship-Quality Debriefs** -- References specific responses to provide personalized coaching feedback.
5. **Adaptive Difficulty Calibration** -- Adjusts challenge difficulty based on player skill level and Elo rating.
6. **Practice Sprint Generation** -- Creates varied practice scenarios targeting weak dimensions.
7. **Assessment Architect** -- Designs balanced, fair tests with scoring rubrics from scratch in seconds.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Auth | Clerk |
| Database | PostgreSQL on Railway |
| ORM | Prisma 7 (with PrismaPg adapter) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Animation | Motion (formerly Framer Motion) |
| Charts | Recharts (RadarChart for Skill Graph) |
| AI | Claude Opus 4.6 API (@anthropic-ai/sdk) |
| Drag & Drop | dnd-kit |
| Hosting | Railway |

## Architecture

```
app/
  (auth)/          Clerk sign-in/sign-up
  onboarding/      Career goal selection
  learn/           Learn mode sprints
  practice/        Practice mode sprints
  compete/         Duel lobby + sprint runner
  results/         Score reveal + skill graph
  profile/         Public skill credential
  leaderboard/     Per-skill Elo rankings
  api/
    sprints/       Sprint CRUD + AI generation
    evaluate/      AI scoring + duel evaluation
    duels/         Matchmaking + duel state
    skills/        Skill taxonomy
    leaderboard/   Elo leaderboard
    profile/       User profile + skill scores
    webhooks/      Clerk user sync

components/
  interactions/    6 micro-interaction types + SprintRunner
  skill-graph/     RadarChart, SkillCard, CareerMatchBar
  arena/           DuelCard, EloDisplay, MatchResult, Leaderboard
  onboarding/      CareerSelector, OnboardingFlow
  layout/          Navbar, BottomNav, ModeSelector

lib/
  ai/              Claude API client + prompt templates
  scoring/         6-dimension evaluator + Elo calculator
  db.ts            Prisma client singleton
```

## 6 Interaction Types

| Type | Time | Description |
|------|------|-------------|
| Spot the Signal | 10s | Data/metrics -- pick the key insight |
| Forced Tradeoff | 15-20s | Strategic choice with real tradeoffs |
| Fill the Gap | 10s | Knowledge check with 4 options |
| Rank & Prioritize | 15-25s | Drag-to-reorder items by priority |
| Curveball | 15-20s | Context change -- adapt your strategy |
| Teach & Test | 20-30s | Mini-lesson followed by immediate test |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Clerk account (auth)
- Anthropic API key (Claude Opus 4.6)

### Setup

```bash
# Clone
git clone https://github.com/poojitha-rachuri/praxel-arena.git
cd praxel-arena

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in DATABASE_URL, Clerk keys, and ANTHROPIC_API_KEY

# Run migrations and seed data
npx prisma migrate deploy
npx prisma db seed

# Start dev server
npm run dev
```

### Environment Variables

See `.env.example` for the full list. Required:

- `DATABASE_URL` -- PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` -- Clerk publishable key
- `CLERK_SECRET_KEY` -- Clerk secret key
- `ANTHROPIC_API_KEY` -- Claude API key

## Deployment

Deployed on Railway with Docker:

```bash
railway up
```

The app runs migrations automatically on startup via `railway.json`.

---

Built for the Opus 4.6 Hackathon (Feb 11-16, 2026).
