---
title: "Phase 0: Foundation Setup"
type: feat
date: 2026-02-11
depends_on: none
blocks: [01, 02, 03, 04, 05]
owner: YOU (manual)
estimated_time: 3-4 hours
---

# Phase 0: Foundation Setup

**Do this TONIGHT (Feb 11). Do NOT delegate to agents.**

## Pre-requisites
- [ ] Node.js 20.9+ installed
- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Clerk account created at clerk.com
- [ ] Claude API key (hackathon credits)
- [ ] GitHub repo created

## Step 1: Project Scaffolding (30 min)

```bash
cd /Users/pushpak/Documents/GitHub/praxel-arena

# Create Next.js 16 project
npx create-next-app@latest . --typescript --tailwind --app --src=false

# Verify Next.js version (must be 16.x)
npm view next version

# Install ALL dependencies in one shot
npm install @clerk/nextjs @prisma/client @anthropic-ai/sdk motion recharts svix swr @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install -D prisma tsx @types/node

# Init shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card badge progress tabs avatar dialog separator

# Init Prisma
npx prisma init --datasource-provider postgresql
```

## Step 2: Version Verification (5 min)

```bash
npm view next version          # Must be 16.x
npm view @clerk/nextjs version # Note for proxy.ts support
npm view prisma version        # Note if 6.x or 7.x
npm view motion version        # Confirm motion/react path
npm view recharts version      # Note v2 vs v3
node --version                 # Must be 20.9+
```

**Record these versions in CLAUDE.md.**

## Step 3: Environment Variables (15 min)

Create `.env.local`:
```
# Railway PostgreSQL
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Claude AI
ANTHROPIC_API_KEY=sk-ant-...
```

## Step 4: Railway Setup (20 min)

```bash
railway login
railway init
railway add --database postgres
# Copy DATABASE_URL and DIRECT_URL to .env.local
```

## Step 5: Clerk Setup (15 min)

1. Go to clerk.com, create "Praxel Arena" project
2. Enable Google + GitHub social login
3. Copy keys to `.env.local`
4. Set up webhook endpoint: `https://your-railway-url.up.railway.app/api/webhooks/clerk`
5. Subscribe to `user.created` event
6. Copy webhook signing secret

## Step 6: Write CLAUDE.md (15 min)

Copy the Project Bible from the master plan. Add verified version numbers from Step 2.

## Step 7: Write Prisma Schema (15 min)

Copy from master plan with corrected generator config:
```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}
```

## Step 8: Write prisma.config.ts (5 min)

## Step 9: Create File Scaffolding (15 min)

Run the scaffolding script to create ALL placeholder files with `// TODO` comments.
This prevents agents from creating conflicting files.

## Step 10: Migrate + Git (10 min)

```bash
npx prisma migrate dev --name init
git init && git add . && git commit -m "foundation: scaffolding complete"
git remote add origin <github-url>
git push -u origin main
```

## Done When
- [ ] `npm run dev` starts without errors
- [ ] Prisma Studio opens (`npx prisma studio`)
- [ ] All placeholder files exist
- [ ] CLAUDE.md is committed
- [ ] Git repo pushed to GitHub
