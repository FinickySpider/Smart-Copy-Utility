---
id: ADR-0004
type: decision
status: complete
date: 2026-02-13
supersedes: ""
superseded_by: ""
---

# ADR-0004: Multiple Robocopy Jobs for Subtree Rule Switching

## Context
Robocopy cannot natively switch exclusion/inclusion rule sets per subtree within a single invocation. The hierarchical rule system allows mode and pattern changes at any directory boundary. A strategy is needed to translate the rule tree into robocopy operations.

## Decision
Build a **job plan** where each job covers a subtree with a stable effective ruleset. A new job is created whenever a directory contains a rule file (rule boundary). Each job maps its patterns to robocopy switches (`/XD`, `/XF` for IGNORE mode) or explicit file lists (for INCLUDE mode). Jobs execute sequentially.

## Consequences
### Positive
- Correct translation of hierarchical rules to robocopy invocations
- Each job has a consistent rule context — no mid-job rule changes
- INCLUDE mode jobs use explicit file enumeration for correctness
- Job plan is inspectable for dry run reporting

### Negative
- More robocopy invocations than a single-pass copy
- INCLUDE mode jobs require pre-enumeration of included files
- Job plan complexity increases with number of rule boundaries

## Links
- Related items:
  - FEAT-011
  - ADR-0002
