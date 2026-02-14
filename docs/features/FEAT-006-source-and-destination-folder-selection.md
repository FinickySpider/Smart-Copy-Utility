---
id: FEAT-006
type: feature
status: planned
priority: high
phase: PHASE-02
sprint: SPRINT-02
owner: ""
depends_on: [FEAT-001]
---

# FEAT-006: Source and Destination Folder Selection

## Description
Implement the main screen UI with source and destination folder pickers. Each picker uses the native folder dialog via the `selectFolder` IPC command. Display the selected paths and disable actions when source or destination is missing.

## Acceptance Criteria
- [ ] Source folder picker button opens native folder dialog
- [ ] Destination folder picker button opens native folder dialog
- [ ] Selected paths are displayed in the UI
- [ ] Actions (Preview, Dry Run, Copy) are disabled when source or destination is not set
- [ ] Same folder chosen for source and destination shows a warning and blocks operations
- [ ] Inline message shown when source or destination is missing

## Files Touched
| File | Change |
|------|--------|
| `src/renderer/components/FolderPicker.tsx` | Folder picker component |
| `src/renderer/components/MainScreen.tsx` | Main screen layout |
| `src/renderer/state/appState.ts` | Source/dest state management |

## Implementation Notes
- Wire to existing `selectFolder` IPC handler
- Store selected paths in React state
- Validate source !== destination

## Testing
- [ ] Folder picker opens and returns path
- [ ] Both paths displayed after selection
- [ ] Actions disabled when paths missing
- [ ] Same-folder warning shown

## Done When
- [ ] Acceptance criteria met
- [ ] Verified manually
