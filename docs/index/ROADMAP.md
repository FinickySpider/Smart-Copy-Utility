
# Roadmap

Keep this file lightweight. Details live in phases and sprints.

## Milestones
- **PHASE-01: Foundation & Rule Engine** — Electron scaffolding, rule parser, pattern matcher, context traversal, conflict detection
- **PHASE-02: Preview & Explain** — Folder selection UI, scanning, lazy tree view, explain panel, conflict UI
- **PHASE-03: Copy Engine & Execution** — Robocopy job plan, dry run, copy with streaming, cancel
- **PHASE-04: Polish & Hardening** — Root-only mode, safety checks, error states, full test matrix, README

## Notes
- Strategic changes should be recorded as ADRs.
- Windows-only. Copy backend is robocopy.
- Hierarchical .copyignore/.copyinclude rule system.
