---
id: FEAT-009
type: feature
status: planned
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
- [ ] Selecting a tree node populates the Explain panel
- [ ] Panel shows: path, decision (Included/Excluded/Conflict), active mode
- [ ] Panel shows rule file chain (list of rule files contributing to context)
- [ ] Panel shows all matching patterns with: rule file path, line number, pattern text
- [ ] "Open in Explorer" action opens the rule file's containing folder
- [ ] "Copy path" action copies the node path to clipboard
- [ ] Panel updates when a different node is selected

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
- [ ] Included file shows correct explain data
- [ ] Excluded file shows matching pattern that caused exclusion
- [ ] NONE mode node shows no rule files
- [ ] Open in Explorer opens correct folder
- [ ] Copy path copies correct path

## Done When
- [ ] Acceptance criteria met
- [ ] Verified manually
