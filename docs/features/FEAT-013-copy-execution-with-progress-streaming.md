---
id: FEAT-013
type: feature
status: complete
priority: high
phase: PHASE-03
sprint: SPRINT-03
owner: ""
depends_on: [FEAT-011, FEAT-012]
---

# FEAT-013: Copy Execution with Progress Streaming

## Description
Execute the robocopy job plan sequentially, spawning robocopy for each job. Stream stdout/stderr line-by-line to the renderer via IPC events. Interpret robocopy exit codes (0–7 success, 8+ failure). Emit job start/end and overall status events. Show a summary when all jobs complete.

## Acceptance Criteria
- [x] `copy({ scanId, options })` executes jobs sequentially via robocopy
- [x] Robocopy stdout/stderr streamed line-by-line via IPC events
- [x] Job start/end events emitted per job
- [x] Status events emitted for phase changes (copying, done, error)
- [x] Exit codes 0–7 treated as success; 8+ treated as failure
- [x] Failed job stops remaining jobs and reports error
- [x] Copy is blocked if conflicts exist
- [x] Correct destination directory structure created (via robocopy)

## Files Touched
| File | Change |
|------|--------|
| `src/main/copier/executor.ts` | Sequential job execution |
| `src/main/copier/robocopy.ts` | Robocopy spawn with streaming |
| `src/main/ipc.ts` | Register `copy` handler |
| `src/renderer/components/LogPanel.tsx` | Log display component |
| `src/renderer/components/ProgressBar.tsx` | Progress display |

## Implementation Notes
- Use `child_process.spawn` with args array (no shell)
- Pipe stdout/stderr line-by-line and emit via IPC
- Track current job process reference for cancel support
- Interpret exit code bitmask after each job

## Testing
- [ ] Copy creates correct destination structure
- [ ] Logs stream to UI in real time
- [ ] Exit code 0–7 → success
- [ ] Exit code 8+ → failure reported
- [ ] Conflict blocks copy

## Done When
- [ ] Acceptance criteria met
- [ ] Verified manually
