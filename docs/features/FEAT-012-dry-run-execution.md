---
id: FEAT-012
type: feature
status: planned
priority: high
phase: PHASE-03
sprint: SPRINT-03
owner: ""
depends_on: [FEAT-011]
---

# FEAT-012: Dry Run Execution

## Description
Implement the dry run workflow that builds a job plan and optionally executes each robocopy job with the `/L` (listing-only) flag to gather realistic file/byte counts without writing. Returns a dry run report including jobs list, estimated totals, conflicts, and validity status.

## Acceptance Criteria
- [ ] `dryRun({ scanId, options })` builds job plan and returns report
- [ ] Each job can be executed with robocopy `/L` flag (listing mode)
- [ ] Report includes: jobs list, total estimated files, total estimated bytes (best-effort)
- [ ] Report includes conflicts list and `validPlan` boolean (false if conflicts exist)
- [ ] Dry run is blocked if conflicts exist (returns invalid plan)
- [ ] No files are written to destination during dry run
- [ ] Status events emitted via IPC (`op:status` with `dryrun` phase)

## Files Touched
| File | Change |
|------|--------|
| `src/main/copier/dryRun.ts` | Dry run execution logic |
| `src/main/copier/robocopy.ts` | Robocopy command builder and spawner |
| `src/main/ipc.ts` | Register `dryRun` handler |

## Implementation Notes
- Build robocopy command args per job with `/L` appended
- Spawn robocopy and parse minimal output for file/byte counts
- Aggregate counts across all jobs
- Emit `op:status` events for progress

## Testing
- [ ] Dry run produces report without writing files
- [ ] File/byte estimates are reasonable
- [ ] Conflicted scan returns invalid plan
- [ ] Status events emitted correctly

## Done When
- [ ] Acceptance criteria met
- [ ] Unit tests pass
