---
id: FEAT-008
type: feature
status: complete
priority: high
phase: PHASE-02
sprint: SPRINT-02
owner: ""
depends_on: [FEAT-007]
---

# FEAT-008: Lazy Preview Tree View

## Description
Implement the lazy tree view UI that displays the source folder structure with include/exclude states. Nodes are populated on demand when expanded via the `listChildren` IPC command. Each node shows its name and included/excluded/conflict state. A "Show excluded" toggle controls visibility of excluded nodes.

## Acceptance Criteria
- [x] Tree view renders root node after scan
- [x] Expanding a directory node calls `listChildren` and renders children
- [x] Each node displays included/excluded/conflict state visually (color/icon)
- [x] "Show excluded" toggle hides or shows excluded nodes
- [x] Directory nodes show expand indicator when they have children
- [x] INCLUDE mode subtrees with no matches show as excluded
- [x] Large trees remain responsive (lazy loading)

## Files Touched
| File | Change |
|------|--------|
| `src/renderer/components/TreeView.tsx` | Lazy tree view component |
| `src/renderer/components/TreeNode.tsx` | Individual tree node component |
| `src/main/ipc.ts` | Register `listChildren` handler |
| `src/main/scanner/listChildren.ts` | List children with state evaluation |

## Implementation Notes
- Use virtualized list if tree is very large
- `listChildren` evaluates context for each child and returns node state
- Memoize context computation per directory path

## Testing
- [x] Root node renders after scan
- [x] Expanding node loads children
- [x] Include/exclude states display correctly
- [x] Show excluded toggle works
- [x] No UI lockup on large trees

## Done When
- [x] Acceptance criteria met
- [x] Verified manually
