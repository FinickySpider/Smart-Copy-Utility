---
id: FEAT-009
type: feature
status: complete
priority: medium
phase: PHASE-02
sprint: SPRINT-02
owner: ""
depends_on: [FEAT-008]
---

# FEAT-009: Explain Panel

## Description
Implement the Explain panel that displays detailed information about why a selected tree node is included or excluded. Shows the active mode, rule file chain, and all matching pattern lines with their source file path, line number, and pattern text. Includes actions to open rule file folder in Explorer and copy paths.

## Acceptance Criteria
- [x] Selecting a tree node populates the Explain panel
- [x] Panel shows: path, decision (Included/Excluded/Conflict), active mode
- [x] Panel shows rule file chain (list of rule files contributing to context)
- [x] Panel shows all matching patterns with: rule file path, line number, pattern text
- [x] "Open in Explorer" action opens the rule file's containing folder
- [x] "Copy path" action copies the node path to clipboard
- [x] Panel updates when a different node is selected

## Files Touched
| File | Change |
|------|--------|
| `src/renderer/components/ExplainPanel.tsx` | Explain panel component |
| `src/main/ipc.ts` | Register `explain` handler |
| `src/main/scanner/explain.ts` | Explain logic |

## Implementation Notes
- `explain` IPC returns: mode, decision, ruleChain, matchingPatterns
- Use `shell.openPath` for Open in Explorer
- Use `clipboard.writeText` for Copy path

## Testing
- [x] Included file shows correct explain data
- [x] Excluded file shows matching pattern that caused exclusion
- [x] NONE mode node shows no rule files
- [x] Open in Explorer opens correct folder
- [x] Copy path copies correct path

## Done When
- [x] Acceptance criteria met
- [x] Verified manually
