---
status: pending
priority: p3
issue_id: "012"
tags: [code-review, performance, database]
dependencies: []
---

# Sequential Seed Operations

## Problem Statement

`prisma/seed.ts` processes all 72 sprint files sequentially with individual upserts. This makes seeding slow. Could use `createMany` or batch transactions.

## Proposed Solutions

Batch sprint+interaction creation in a `prisma.$transaction` per file, or use `createMany` for interactions.

## Acceptance Criteria

- [ ] Seed completes in under 30 seconds
- [ ] All data integrity preserved

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
