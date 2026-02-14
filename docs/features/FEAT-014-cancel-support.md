---
id: FEAT-014
type: feature
status: planned
priority: medium
phase: PHASE-03
sprint: SPRINT-03
owner: ""
depends_on: [FEAT-013]
---

# FEAT-014: Cancel Support

## Description
Implement cancel functionality that terminates the currently running robocopy process, stops future jobs in the plan, updates the UI state to "cancelled", and preserves logs up to the cancellation point.

## Acceptance Criteria
- [ ] `cancel({ scanId })` terminates the current robocopy child process
- [ ] Remaining jobs in the plan are not started
- [ ] UI state transitions to "cancelled" via `op:status` event
- [ ] Logs captured up to cancellation point are preserved and visible
- [ ] Cancel button is enabled during dry run and copy operations
- [ ] Cancel during dry run stops the dry run

## Files Touched
| File | Change |
|------|--------|
| `src/main/copier/executor.ts` | Cancel flag and process termination |
| `src/main/ipc.ts` | Register `cancel` handler |
| `src/renderer/components/MainScreen.tsx` | Cancel button state management |

## Implementation Notes
- Store reference to current child process in executor
- On cancel: kill process, set cancelled flag, emit status event
- Executor loop checks cancelled flag before starting next job

## Testing
- [ ] Cancel during copy terminates robocopy process
- [ ] No further jobs execute after cancel
- [ ] UI shows cancelled state
- [ ] Logs preserved up to cancel point

## Done When
- [ ] Acceptance criteria met
- [ ] Verified manually
