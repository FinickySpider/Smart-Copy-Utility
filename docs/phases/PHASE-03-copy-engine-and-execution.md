---
id: PHASE-03
type: phase
status: complete
owner: ""
---

# PHASE-03: Copy Engine & Execution

## Goal
Build the robocopy job plan from the rule engine output, implement dry run (robocopy `/L`), execute sequential copy jobs with streamed progress/logs, and support cancel. This phase delivers the core copy functionality.

## In Scope
- Robocopy job plan builder (segment at rule boundaries)
- Job definition: srcRoot, dstRoot, mode, patterns, origin rule files
- NONE mode jobs (copy everything)
- IGNORE mode jobs (robocopy `/XD` and `/XF` switches)
- INCLUDE mode jobs (enumerate included files, use robocopy with file lists)
- Dry run execution (robocopy `/L` per job)
- Copy execution with streamed stdout/stderr log lines
- Exit code interpretation (0–7 success, 8+ failure)
- Cancel: terminate current robocopy, stop future jobs
- Progress/status events via IPC

## Out of Scope
- Root-rules-only mode (Phase 4)
- Advanced robocopy output parsing beyond basic metrics
- Log file persistence

## Sprints
- [SPRINT-03](../sprints/SPRINT-03.md)

## Completion Criteria
- [x] Job plan correctly segments at rule boundaries
- [x] NONE, IGNORE, and INCLUDE mode jobs produce correct robocopy commands
- [x] Dry run simulates without writing files
- [x] Copy creates correct destination directory structure
- [x] Robocopy logs stream to UI in real time
- [x] Exit codes interpreted correctly
- [x] Cancel terminates current job and stops remaining jobs
- [x] Conflicts block dry run and copy
