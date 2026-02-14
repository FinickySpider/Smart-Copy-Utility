# Copilot Agent Instructions — Smart Copy Utility

## Project Overview
Smart Copy Utility is a Windows-only Electron + React desktop app that copies large folder trees using robocopy while applying hierarchical `.copyignore`/`.copyinclude` rule files. The canonical design lives in `docs/design/DESIGN.md`.

## Start Procedure (MANDATORY)
1. Read `docs/index/MASTER_INDEX.md` — single source of truth
2. Read `docs/design/DESIGN.md` — the complete design document
3. Read `docs/_system/*` — system rules, conventions, lifecycle

If DESIGN.md is missing or incomplete, request it. Do not invent product direction.

## Work Rules (MOST IMPORTANT)
- **Only work on items listed in the active sprint** — check MASTER_INDEX for the active sprint
- **Do not silently expand scope** — if something isn't in the sprint, don't build it
- **Prefer minimal viable implementation** that satisfies acceptance criteria
- **Keep changes traceable**: acceptance criteria → implementation → verification
- **ALWAYS update tracking documents** after each task:
  - Features, sprints, phases, and MASTER_INDEX must stay current
  - Global: `docs/decisions/DECISION_LOG.md`, `docs/index/MASTER_INDEX.md`, `docs/index/ROADMAP.md`
  - Local: Feature checklists, sprint checklists, phase checklists
- **Always use templates** when creating new files: `docs/templates/*`
- **At the start of every new sprint**, read through all files in `/docs` and create any missing files (features, ADRs, sprints, phases). Ensure the project is correctly mapped out.

## Status Vocabulary (STRICT — no other words allowed)
- `planned`
- `active` (phases and sprints only)
- `in_progress`
- `blocked`
- `review`
- `complete`
- `deprecated`

## Naming Conventions
| Type | Prefix | Example |
|------|--------|---------|
| Phase | `PHASE-XX` | `PHASE-02-preview-and-explain.md` |
| Sprint | `SPRINT-XX` | `SPRINT-03.md` |
| Feature | `FEAT-XXX` | `FEAT-014-cancel-support.md` |
| Bug | `BUG-XXX` | `BUG-007-export-crash.md` |
| Refactor | `REFACTOR-XXX` | `REFACTOR-004-state-cleanup.md` |
| Decision | `ADR-XXXX` | `ADR-0003-hierarchical-rule-file-system.md` |

Rules: zero-padded numbers, kebab-case slugs, never reuse or renumber IDs.

## Cross References
Every work item must reference its phase, sprint, and dependencies by ID using standard markdown links with relative paths.

## Technology Stack
- **Runtime**: Electron (main process: Node.js, renderer: React)
- **Language**: TypeScript
- **Copy backend**: robocopy (Windows built-in)
- **IPC**: Electron ipcMain/ipcRenderer with contextBridge
- **Platform**: Windows only

## Architecture Quick Reference
- Main process: scanning, rule evaluation, job plan building, robocopy spawning
- Renderer: React UI, calls main via IPC, receives streamed events
- Rule engine: `.copyignore` (blacklist), `.copyinclude` (whitelist), hierarchical with stacking/reset
- Copy engine: multiple robocopy jobs segmented at rule boundaries
- Preview: lazy tree evaluation, on-demand child loading

## Key Design Decisions (ADRs)
- ADR-0001: Electron + React desktop framework
- ADR-0002: Robocopy as copy backend
- ADR-0003: Hierarchical rule file system (.copyignore/.copyinclude)
- ADR-0004: Multiple robocopy jobs for subtree rule switching
- ADR-0005: Lazy tree evaluation for preview

## Scope Changes
If scope changes are needed, create an ADR. Do not modify the design without documentation.

## Security
- No network access
- No elevated privileges
- Spawn robocopy with args array (no shell injection)
- Destination must not be inside source or vice versa
