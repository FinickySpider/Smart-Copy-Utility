---
id: FEAT-016
type: feature
status: complete
priority: high
phase: PHASE-04
sprint: SPRINT-04
owner: ""
depends_on: []
---

# FEAT-016: Path Safety Checks

## Description
Implement safety checks to prevent dangerous copy scenarios:
1. Destination is inside source (would create infinite recursion)

Same-folder copies (source === destination) are also blocked.

These checks prevent infinite loops and obvious misconfiguration.

## Acceptance Criteria
- [x] Detect when destination path is inside source path
- [x] Display clear error message when destination-inside-source is true
- [x] Block Preview, Dry Run, and Copy buttons when hazard detected
- [x] Error message styled prominently (red/warning)
- [x] Path comparison is case-insensitive on Windows
- [x] Path normalization handles trailing slashes

## Files Touched
| File | Change |
|------|--------|
| `src/renderer/components/MainScreen.tsx` | Add path containment checks, error display, button blocking |

## Implementation Notes
- Create utility function `isPathInside(childPath, parentPath)` using normalized paths
- Check destination-inside-source: `isPathInside(dest, source)`
- Normalize paths using `path.normalize()` and convert to lowercase on Windows
- Handle edge cases: trailing slashes, relative vs absolute paths
- Combine with existing `hasSameFolderError` logic
- Error messages:
  - "Error: Destination cannot be inside source folder (would cause recursion)."

## Testing
- [x] Set source = "C:\Projects", dest = "C:\Projects\backup" → blocked
- [x] Set source = "C:\Projects\backup", dest = "C:\Projects" → allowed
- [x] Set source = "C:\Projects", dest = "D:\Backup" → allowed
- [x] Verify case-insensitive matching (e.g., "c:\projects" vs "C:\Projects")

## Done When
- [x] Acceptance criteria met
- [x] Verified manually with various path combinations
- [x] No false positives or false negatives
