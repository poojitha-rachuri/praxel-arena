---
status: pending
priority: p3
issue_id: "018"
tags: [code-review, data-quality]
dependencies: []
---

# Topic Description Field Unused in UI

## Problem Statement

Topics in `topics.json` have description fields that are stored in the database but never displayed in the SkillAccordion or anywhere else in the UI.

## Proposed Solutions

Show topic descriptions as subtitle text in the accordion headers.

## Acceptance Criteria

- [ ] Topic descriptions visible in SkillAccordion

## Resources

- PR: https://github.com/poojitha-rachuri/praxel-arena/pull/2
