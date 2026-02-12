---
status: pending
priority: p3
issue_id: "013"
tags: [code-review, refactoring, components]
dependencies: []
---

# SkillAccordion Component Size (431 lines)

## Problem Statement

`SkillAccordion.tsx` at 431 lines handles too many concerns: accordion state, topic grouping, completion tracking, animations, and routing. Could benefit from extraction.

## Proposed Solutions

Extract TopicGroup, SprintItem, and CompletionBadge sub-components.

## Acceptance Criteria

- [ ] SkillAccordion.tsx under 200 lines
- [ ] Sub-components properly typed and tested

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
