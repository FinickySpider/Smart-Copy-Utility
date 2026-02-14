---
id: FEAT-015
type: feature
status: complete
priority: high
phase: PHASE-04
sprint: SPRINT-04
owner: ""
depends_on: []
---

# FEAT-015: Root-Rules-Only Mode Toggle

## Description
Add a checkbox/toggle in the UI that enables "root-rules-only" mode, which ignores nested rule files and only applies `.copyignore`/`.copyinclude` files found at the source root. Backend support already exists; this feature exposes it to users.

## Acceptance Criteria
- [x] UI checkbox added to MainScreen labeled "Root rules only"
- [x] Checkbox state stored in React state
- [x] `rootOnly` value passed to `scan()`, `dryRun()`, and `copy()` IPC calls
- [x] When enabled, nested rule files are ignored during scan and copy
- [x] Default state is `false` (unchecked)
- [x] Tooltip or help text explains the feature

## Files Touched
| File | Change |
|------|--------|
| `src/renderer/components/MainScreen.tsx` | Add `rootOnly` state, checkbox UI, pass to IPC calls |

## Implementation Notes
- Add `const [rootOnly, setRootOnly] = useState(false)`
- Add checkbox between folder pickers and action buttons
- Update `handlePreview()`, `handleDryRun()`, `handleCopy()` to pass `rootOnly` value
- Use simple checkbox with label and optional title attribute for tooltip

## Testing
- [x] Check box, scan, verify nested rules ignored
- [x] Uncheck box, scan, verify nested rules applied
- [x] Dry run and copy respect the toggle value

## Done When
- [x] Acceptance criteria met
- [x] Verified manually with test folder structure containing nested rules
