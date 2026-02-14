---
id: ADR-0003
type: decision
status: complete
date: 2026-02-13
supersedes: ""
superseded_by: ""
---

# ADR-0003: Hierarchical Rule File System

## Context
The utility needs a way for users to control which files are copied. The mechanism must be simple, predictable, and work across nested directory structures without unexpected side effects. Options include a single global config, gitignore-style cascading, or a custom hierarchical approach.

## Decision
Use a two-file hierarchical rule system: `.copyignore` (blacklist/exclude) and `.copyinclude` (whitelist/include). Rules are **path-local** with push/pop context semantics — a rule file affects only its subtree and never leaks to siblings. Same-mode encounters **stack** patterns; mode-switch encounters **reset** patterns. Both files in the same directory is a fatal conflict.

## Consequences
### Positive
- Simple mental model: two file types with clear semantics
- Path-local scoping prevents surprising side effects
- Stacking allows incremental refinement within a mode
- Reset on mode switch gives clean boundaries
- Fatal conflicts prevent ambiguous configurations

### Negative
- No negation patterns (limits flexibility but keeps things simple)
- No inheritance directives (by design)
- Users must understand stacking vs. reset behavior

## Links
- Related items:
  - FEAT-002
  - FEAT-003
  - FEAT-004
  - FEAT-005
