---
id: BUG-002
type: bug
status: complete  # planned | in_progress | complete | deprecated
severity: major  # critical | major | minor
phase: PHASE-04
sprint: SPRINT-04
owner: ""
---

# BUG-002: Source-inside-destination check blocks valid copy

## Problem
The UI blocked copy operations where the source folder is inside the destination folder.

For robocopy-style directory copying (copying the contents of source into destination), copying from a subfolder to its parent (e.g., `D:\06 Systems` → `D:\`) is a valid operation and does not inherently overwrite the source.

## Reproduction Steps
1. Set Source Folder to `D:\06 Systems`
2. Set Destination Folder to `D:\`
3. Observe error message and disabled actions.

## Expected
Operation is allowed (no recursion risk).

## Actual
Blocked with: "Error: Source cannot be inside destination folder (would overwrite source)."

## Fix Strategy
- Keep blocking only the dangerous containment case: destination inside source (recursion).
- Keep blocking same-folder copies.
- Allow source-inside-destination.

## Verification
- [x] `D:\06 Systems` → `D:\` is allowed
- [x] `D:\` → `D:\06 Systems` remains blocked (recursion)
- [x] Source == Destination remains blocked
