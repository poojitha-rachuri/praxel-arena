# Praxel Arena - Project Bible

> Learn. Practice. Compete. Credential.
> A skill credentialing platform for business professionals powered by Claude AI.

## Verified Stack Versions (Feb 11, 2026)

| Package | Version |
|---|---|
| Next.js | 16.1.6 |
| React | 19.2.3 |
| @clerk/nextjs | 6.37.3 |
| Prisma | 7.4.0 |
| motion | 12.34.0 |
| recharts | 3.7.0 |
| @anthropic-ai/sdk | 0.74.0 |
| Tailwind CSS | 4.1.18 |
| @dnd-kit/core | 6.3.1 |
| Node.js | 20.20.0 |

## Critical Patterns

### Next.js 16
- `middleware.ts` for auth (Clerk may not support `proxy.ts` yet)
- ALL `params`, `searchParams` are **async** -- must `await` everywhere
- `cookies()`, `headers()` are **async**
- Turbopack is the default bundler
- Tailwind v4 uses CSS config (`@import "tailwindcss"` in globals.css)
- React 19.2 with React Compiler enabled

### Prisma 7
- Generator: `prisma-client` with `output = "../app/generated/prisma"`
- Import from: `@/app/generated/prisma/client`
- Uses `PrismaPg` adapter from `@prisma/adapter-pg`
- Config in `prisma.config.ts` (connection URL in both config and adapter)
- Seed: `tsx prisma/seed.ts`

### Motion (formerly Framer Motion)
- Package: `motion` (NOT `framer-motion`)
- Import: `import { motion, AnimatePresence } from 'motion/react'`
- Card spring physics: `stiffness: 300, damping: 25`

### Clerk + Tailwind v4
- Add `cssLayerName: 'clerk'` to ClerkProvider appearance
- Keep `middleware.ts` (not proxy.ts) until Clerk confirms support

### shadcn/ui
- Init: `npx shadcn@latest init`
- Components in `components/ui/`
- Uses Tailwind v4 CSS variables

## File Ownership (Agent Army)

| Directory | Owner |
|---|---|
| `components/interactions/*` | Agent 1: INTERACTION-ENGINE |
| `lib/ai/*`, `lib/scoring/*` | Agent 2: AI-ENGINE |
| `prisma/*`, `app/api/*`, `lib/db.ts` | Agent 3: DATA-BACKEND |
| `components/skill-graph/*`, `components/arena/*` | Agent 4: SKILLGRAPH-PROFILE |
| `app/*` (pages), `components/layout/*`, `components/onboarding/*` | Agent 5: PAGES-FLOWS |

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Build for production
npx prisma studio    # Database GUI
npx prisma migrate dev --name <name>  # Create migration
npx prisma db seed   # Seed database
```

## Design Principles

- **30-second rule**: every screen requires interaction within 30s
- **Mobile-first**: 375px min width, 44px touch targets
- **Dark mode default**: `className="dark"` on `<html>`
- **Card spring physics**: stiffness 300, damping 25, < 200ms feel

## 6 Scoring Dimensions

1. Analytical Thinking
2. Strategic Reasoning
3. Quantitative Reasoning
4. Communication Clarity
5. Decision Quality
6. Creative Problem Solving

## API Route Patterns

- All routes use `await auth()` from `@clerk/nextjs/server`
- All `params` and `searchParams` must be awaited
- Rate limit sprint generation: 5/user/hour
- AI model for generation: `claude-opus-4-6`
- AI model for evaluation: `claude-sonnet-4-5-20250929`

## Interaction Types

| Type | Time Target | Description |
|---|---|---|
| SpotTheSignal | 10s | Data/metrics with 4 options |
| ForcedTradeoff | 15-20s | Strategic choice with tradeoffs |
| FillTheGap | 10s | Fill-in-blank with 4 options |
| RankAndPrioritize | 15-25s | Drag-to-reorder 4 items |
| Curveball | 15-20s | ForcedTradeoff with context change |
| TeachAndTest | 20-30s | Teaching preamble + test |
