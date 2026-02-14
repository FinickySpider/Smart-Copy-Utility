---
id: PHASE-01
type: phase
status: complete
owner: ""
---

# PHASE-01: Foundation & Rule Engine

## Goal
Stand up the Electron project scaffolding and implement the core rule engine that parses `.copyignore`/`.copyinclude` files, evaluates pattern matching, manages context/mode traversal, and detects conflicts. This phase produces the foundational logic that all later phases depend on.

## In Scope
- Electron + React project scaffolding with IPC skeleton
- Rule file parser (`.copyignore` / `.copyinclude`)
- Pattern matching engine (glob patterns, directory name patterns, relative paths)
- Context/mode traversal system (NONE/IGNORE/INCLUDE with stacking/reset)
- Conflict detection (both rule files in same directory)
- Unit tests for rule engine

## Out of Scope
- UI beyond minimal shell
- Robocopy integration
- Preview tree rendering
- Explain panel

## Sprints
- [SPRINT-01](../sprints/SPRINT-01.md)

## Completion Criteria
- [x] Electron app launches with React renderer
- [x] IPC skeleton wired (at least `selectFolder` works)
- [x] Rule file parser correctly reads `.copyignore` and `.copyinclude`
- [x] Pattern matching handles `name/`, `*.ext`, and `foo/bar.txt` patterns
- [x] Context traversal implements stacking (same mode) and reset (mode switch)
- [x] Conflict detection finds all directories with both rule files
- [x] Unit tests pass for rule engine core
