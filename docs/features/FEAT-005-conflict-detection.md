---
id: FEAT-005
type: feature
status: complete
priority: high
phase: PHASE-01
sprint: SPRINT-01
owner: ""
depends_on: [FEAT-002]
---

# FEAT-005: Conflict Detection

## Description
Implement detection of directories that contain both `.copyignore` and `.copyinclude` files. These are fatal conflicts that must block dry run and copy operations. The scanner must collect all conflicts (not stop at first) for user convenience.

## Acceptance Criteria
- [x] Detects directories containing both `.copyignore` and `.copyinclude` (case-insensitive)
- [x] Collects all conflicts across the entire source tree (does not stop at first)
- [x] Returns conflict list as array of directory paths
- [x] Conflict presence blocks dry run and copy operations
- [x] Non-conflict directories are unaffected

## Files Touched
| File | Change |
|------|--------|
| `src/main/rules/conflicts.ts` | Conflict detection implementation |
| `tests/rules/conflicts.test.ts` | Unit tests |

## Implementation Notes
- During scan, for each directory: check if both rule file types exist (case-insensitive name check)
- Accumulate all conflict paths into an array
- Return the full list after scanning completes

## Testing
- [x] No conflicts → empty array, operations not blocked
- [x] Single conflict detected correctly
- [x] Multiple conflicts across different directories all detected
- [x] Case-insensitive detection (`.CopyIgnore` + `.COPYINCLUDE`)

## Done When
- [x] Acceptance criteria met
- [x] Unit tests pass
