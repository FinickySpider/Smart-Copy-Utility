---
id: FEAT-017
type: feature
status: complete
priority: medium
phase: PHASE-04
sprint: SPRINT-04
owner: ""
depends_on: []
---

# FEAT-017: Enhanced Error Handling

## Description
Improve error state handling and user feedback when operations fail:
- Robocopy job failures (exit codes 8+) with clear messaging
- Scan failures with actionable error messages
- IPC errors with user-friendly explanations
- Error recovery: allow retry after failure

## Acceptance Criteria
- [x] Robocopy failures show error summary at top of logs
- [x] Copy error events display user-friendly message (not raw stack traces)
- [x] Scan failures show error dialog or inline message
- [x] After error, user can retry operation without restarting app
- [x] Error states don't leave UI in broken state
- [x] Console.error used for dev debugging, user sees clean messages

## Files Touched
| File | Change |
|------|--------|
| `src/renderer/components/MainScreen.tsx` | Enhance error handling in event listeners and async handlers |
| `src/main/copier/executor.ts` | Ensure clear error messages in events |
| `src/main/ipc.ts` | Add try/catch with error responses |

## Implementation Notes
- In MainScreen, when `copyStatus === 'error'`, show error summary banner
- After error, allow re-running Preview/Dry Run/Copy (reset state)
- In CopyExecutor, emit `copy:error` with human-readable message field
- Extract error messages from exceptions: `error instanceof Error ? error.message : String(error)`
- Add "Retry" functionality: clear logs, reset status to idle

## Testing
- [x] Trigger robocopy failure (invalid path), verify error shown
- [x] Trigger scan failure (permissions issue), verify error shown
- [x] After error, verify retry works
- [x] No lingering broken state after errors

## Done When
- [x] Acceptance criteria met
- [x] Verified with simulated errors
- [x] Users see helpful messages, not technical stack traces
