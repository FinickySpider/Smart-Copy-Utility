---
id: FEAT-022
type: feature
status: complete
priority: medium
phase: ""
sprint: SPRINT-07
owner: ""
depends_on: []
---

# FEAT-022: Electron Application Menu

## Description
Populate the Electron application menu (File, Edit, View, Window, Help) with useful program-related actions.

## Acceptance Criteria
- [x] File menu includes: Open Source Folder, Open Destination Folder, Open Rule File, Save Rule File, Quit
- [x] Edit menu includes: Undo, Redo, Cut, Copy, Paste, Select All (for text editing in Rules tab)
- [x] View menu includes: Switch to Copy Tab, Switch to Rules Tab, Toggle DevTools, Reload
- [x] Help menu includes: View Documentation (opens GitHub), About
- [x] Menu items are enabled/disabled based on context
- [x] Keyboard shortcuts are displayed and functional

## Files Touched
| File | Change |
|------|--------|
| src/main/index.ts | Create and set application menu |
| src/main/ipc.ts | Add handlers for menu-triggered actions if needed |

## Implementation Notes
- Use Electron's Menu API to create application menu
- Include standard keyboard shortcuts (Ctrl+O, Ctrl+S, Ctrl+Q, etc.)
- Menu actions should communicate with renderer via IPC or standard Electron mechanisms
- On macOS would need app menu, but this is Windows-only so focus on Windows menu structure

## Testing
- [x] Menu bar displays correctly
- [x] All menu items trigger correct actions
- [x] Keyboard shortcuts work
- [x] Menu items enable/disable appropriately

## Done When
- [x] Acceptance criteria met
- [x] Verified in packaged build
