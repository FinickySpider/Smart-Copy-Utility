---
id: FEAT-007
type: feature
status: planned
priority: high
phase: PHASE-02
sprint: SPRINT-02
owner: ""
depends_on: [FEAT-004, FEAT-005, FEAT-006]
---

# FEAT-007: Filesystem Scanning with Rule Discovery

## Description
Implement the `scan` IPC command that walks the source directory tree, discovers all rule files, detects conflicts, and builds the initial scan result with a root node and statistics. The scan result is cached by `scanId` for subsequent lazy tree operations.

## Acceptance Criteria
- [ ] `scan({ source, dest, rootOnly })` returns `{ scanId, conflicts, rootNode, stats }`
- [ ] All rule files (`.copyignore` / `.copyinclude`) discovered during scan
- [ ] All conflicts collected and returned
- [ ] Root node returned with initial state
- [ ] Stats include basic counts (directories scanned, rule files found, conflicts found)
- [ ] Scan result cached by `scanId` for use by `listChildren` and `explain`
- [ ] Async scanning does not block the UI

## Files Touched
| File | Change |
|------|--------|
| `src/main/scanner/index.ts` | Scanning pipeline |
| `src/main/scanner/types.ts` | ScanResult type |
| `src/main/ipc.ts` | Register `scan` handler |

## Implementation Notes
- Walk directory tree using async filesystem calls
- Index rule file locations by directory path
- Build conflict list during walk
- Cache scan result keyed by generated `scanId`

## Testing
- [ ] Scan of directory with no rules returns clean result
- [ ] Scan discovers nested rule files
- [ ] Conflicts detected and returned
- [ ] ScanId is unique per scan invocation

## Done When
- [ ] Acceptance criteria met
- [ ] Unit tests pass
