---
id: FEAT-010
type: feature
status: complete
priority: high
phase: PHASE-02
sprint: SPRINT-02
owner: ""
depends_on: [FEAT-007]
---

# FEAT-010: Conflict List UI

## Description
Display detected conflicts prominently in the UI. When conflicts exist, show a banner/panel listing all directories with both `.copyignore` and `.copyinclude`. Each conflict entry has "Open in Explorer" and "Copy path" actions. Dry Run and Copy buttons are disabled when conflicts exist.

## Acceptance Criteria
- [x] Conflicts displayed prominently as a banner or panel when present
- [x] Each conflict shows the full directory path
- [x] "Open in Explorer" action opens the conflicting directory
- [x] "Copy path" action copies the directory path to clipboard
- [x] Dry Run and Copy buttons are disabled when conflicts exist
- [x] No conflict banner when no conflicts found

## Files Touched
| File | Change |
|------|--------|
| `src/renderer/components/ConflictBanner.tsx` | Conflict banner/panel component |
| `src/renderer/components/MainScreen.tsx` | Integrate conflict banner |

## Implementation Notes
- Receive conflicts from scan result
- Use `shell.openPath` for Open in Explorer
- Disable action buttons via state when conflicts.length > 0

## Testing
- [x] No conflicts → no banner, buttons enabled
- [x] Conflicts present → banner shown, buttons disabled
- [x] Open in Explorer works for conflict path
- [x] Copy path works for conflict path

## Done When
- [x] Acceptance criteria met
- [x] Verified manually
