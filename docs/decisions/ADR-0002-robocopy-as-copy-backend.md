---
id: ADR-0002
type: decision
status: complete
date: 2026-02-13
supersedes: ""
superseded_by: ""
---

# ADR-0002: Robocopy as Copy Backend

## Context
The utility needs to copy large folder trees efficiently on Windows. Options include custom file-by-file copying via Node.js `fs` APIs, or delegating to a system tool. The copy mechanism must support exclusion filters, restartable mode, and efficient large-tree handling.

## Decision
Use **robocopy** (Windows built-in) as the copy backend. Robocopy is spawned as a child process with arguments constructed via `child_process.spawn` (args array, no shell). Multiple robocopy jobs are used to handle different rule subtrees.

## Consequences
### Positive
- Battle-tested Windows tool optimized for large file operations
- Supports `/XD` (exclude dirs) and `/XF` (exclude files) switches for IGNORE mode
- Supports `/L` for listing-only dry runs
- Restartable mode and robust error handling built in
- No need to implement low-level file copy logic

### Negative
- Windows-only (aligns with project scope)
- Not a natural whitelist tool — INCLUDE mode requires file enumeration workarounds
- Exit code interpretation requires bitmask handling (0–7 success, 8+ failure)
- Multiple jobs needed when rule context changes across subtrees

## Links
- Related items:
  - FEAT-011
  - FEAT-012
  - FEAT-013
