---
id: PHASE-02
type: phase
status: planned
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
- [ ] User can select source and destination folders
- [ ] Scanning discovers all rule files and builds preview model
- [ ] Lazy tree view renders with correct include/exclude states
- [ ] Show-excluded toggle works
- [ ] Explain panel displays mode, rule chain, and matching patterns
- [ ] Conflicts displayed prominently with Open in Explorer / Copy path
- [ ] Large trees do not lock the UI
