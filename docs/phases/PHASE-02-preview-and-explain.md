---
id: PHASE-02
type: phase
status: complete
owner: ""
---

# PHASE-02: Preview & Explain

## Goal
Implement the filesystem scanning pipeline and the lazy preview tree UI so users can explore what will be copied. Add the Explain panel so users can understand why any node is included or excluded. Surface conflict errors prominently in the UI.

## In Scope
- Source/destination folder selection UI
- Filesystem scanning with rule file discovery
- Lazy tree view with included/excluded/conflict/unknown states
- Show-excluded toggle
- Explain panel (mode, rule chain, matching patterns with line numbers)
- Conflict list panel with "Open in Explorer" and "Copy path" actions
- Summary counts (included files, excluded files, estimated bytes)

## Out of Scope
- Robocopy execution
- Dry run / copy operations
- Root-rules-only mode

## Sprints
- [SPRINT-02](../sprints/SPRINT-02.md)

## Completion Criteria
- [x] User can select source and destination folders
- [x] Scanning discovers all rule files and builds preview model
- [x] Lazy tree view renders with correct include/exclude states
- [x] Show-excluded toggle works
- [x] Explain panel displays mode, rule chain, and matching patterns
- [x] Conflicts displayed prominently with Open in Explorer / Copy path
- [x] Large trees do not lock the UI
