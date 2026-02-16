---
id: FEAT-023
type: feature
status: complete
priority: high
phase: PHASE-06
sprint: SPRINT-08
owner: ""
depends_on: []
---

# FEAT-023: Multi-threaded Robocopy

## Description
Enable robocopy's multi-threading capability using the /MT:n flag to dramatically speed up copy operations, especially for projects with many small files.

## Acceptance Criteria
- [x] Robocopy jobs use `/MT:8` flag by default
- [x] Multi-threading is configurable in settings (1-128 threads)
- [x] Default value of 8 threads provides optimal balance
- [x] Performance improvement visible in copy speed
- [x] No regressions in copy accuracy or reliability

## Files Touched
| File | Change |
|------|--------|
| src/main/copier.ts | Add /MT flag to robocopy args |
| src/main/settings.ts | Add robocopyThreads setting |

## Implementation Notes
- /MT:8 is sweet spot for most workloads (2-4x speedup)
- /MT:16 for high-core systems with fast SSDs
- /MT:1 disables (for HDDs or troubleshooting)
- More threads = more CPU and memory usage
- Logs will be interleaved (expected behavior)

## Testing
- [x] Copy 10,000 small files faster than before
- [x] Copy 10 large files shows modest improvement
- [x] No file corruption or data loss
- [x] Setting persists across restarts

## Done When
- [x] Acceptance criteria met
- [x] Verified 2-4x speedup on typical workloads
- [x] Packaged and tested
