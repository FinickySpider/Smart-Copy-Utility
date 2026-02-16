---
id: FEAT-024
type: feature
status: complete
priority: medium
phase: PHASE-06
sprint: SPRINT-08
owner: ""
depends_on: []
---

# FEAT-024: Worker Thread Scanning

## Description
Use Node.js worker threads to parallelize directory scanning for large projects, reducing scan time by 2-3x on modern SSDs.

## Acceptance Criteria
- [x] Scanning uses worker threads for parallel traversal
- [x] Works correctly with hierarchical rule evaluation
- [x] Thread count configurable (default: CPU count / 2)
- [x] Falls back to single-threaded on errors
- [x] No regression in scan accuracy
- [x] Faster scan times for projects >5,000 files

## Files Touched
| File | Change |
|------|--------|
| src/main/scanner-worker.ts | New worker thread implementation |
| src/main/scanner.ts | Orchestrate parallel workers |
| src/main/settings.ts | Add scannerThreads setting |

## Implementation Notes
- Use worker_threads module for true parallelism
- Breadth-first decomposition (top-level dirs to workers)
- Main thread aggregates results
- Rule context must be serialized to workers
- Limit parallelism to avoid I/O saturation
- HDDs may not benefit (consider detecting drive type)

## Testing
- [x] Scan 50,000 files faster than before
- [x] All rule evaluations remain correct
- [x] Conflicts detected accurately
- [x] Worker pool cleanup on errors
- [x] Memory usage acceptable

## Done When
- [x] Acceptance criteria met
- [x] Verified 2-3x speedup on large projects
- [x] No accuracy regressions
- [x] Packaged and tested
