---
id: FEAT-019
type: feature
status: in_progress  # planned | in_progress | blocked | review | complete | deprecated
priority: medium # high | medium | low
phase: PHASE-05
sprint: SPRINT-06
owner: ""
depends_on: []
---

# FEAT-019: Rule File Editor + Snippet Library

## Description
Add a second tab that lets users open, create, edit, and save `.copyignore` / `.copyinclude` files anywhere on disk. Provide a built-in library of common patterns/snippets that can be inserted into the active editor.

## Acceptance Criteria
- [ ] UI has a "Rules" tab alongside the existing copy/preview UI.
- [ ] User can open an existing `.copyignore` or `.copyinclude` file and edit its text.
- [ ] User can create a new `.copyignore` or `.copyinclude` file via a folder picker.
- [ ] Save/Save As warns before overwrite when the target file already exists.
- [ ] Save/Save As warns before creating a conflict when the sibling rule file exists in the same folder (both `.copyignore` and `.copyinclude`).
- [ ] Snippet library shows common examples and can insert selected snippets into the editor.
- [ ] Existing preview/copy workflow remains unchanged.

## Files Touched
| File | Change |
|------|--------|
| src/renderer/components/MainScreen.tsx | Add tab switch between Copy and Rules |
| src/renderer/components/RulesScreen.tsx | New rules editor UI |
| src/main/ipc.ts | Add file open/save/check handlers |
| src/preload/index.ts | Expose new safe APIs to renderer |
| src/renderer/patternLibrary.json | Built-in snippet library |

## Implementation Notes
- Use IPC for all filesystem reads/writes.
- Enforce saving rule files with correct names (`.copyignore` / `.copyinclude`).
- Present warnings inline in the Rules tab with explicit user confirmation.

## Testing
- [ ] Open/edit/save `.copyignore` works
- [ ] Open/edit/save `.copyinclude` works
- [ ] Conflict warning triggers when sibling rule file exists
- [ ] Overwrite warning triggers when target exists

## Done When
- [ ] Acceptance criteria met
- [ ] Verified manually in dev build
