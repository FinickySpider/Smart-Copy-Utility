---
id: PHASE-04
type: phase
status: planned
owner: ""
---

# PHASE-04: Polish & Hardening

## Goal
Implement remaining features (root-rules-only mode), add safety checks, polish the UI, and execute the full test matrix from the design document. Ensure the app is robust and ready for use.

## In Scope
- Root-rules-only mode toggle
- Safety checks: destination not inside source (and vice versa)
- Same-folder source/dest warning/block
- Missing source/destination inline messaging
- Error state handling (robocopy failure summary with logs)
- UI polish: drag-and-drop folder selection (optional), layout refinements
- Full test matrix execution (rule semantics, conflicts, root-only, robocopy integration)
- README.md with usage instructions and rule examples

## Out of Scope
- Cross-platform support
- Profile management
- Auto rule generation

## Sprints
- (created when Phase 4 becomes active)

## Completion Criteria
- [ ] Root-rules-only toggle ignores nested rule files
- [ ] Source/destination safety checks prevent recursion hazards
- [ ] All error states handled gracefully with user-facing messages
- [ ] Full test matrix from design document passes
- [ ] README.md complete with usage instructions and rule file examples
