---
id: FEAT-008
type: feature
status: planned
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
- [ ] Tree view renders root node after scan
- [ ] Expanding a directory node calls `listChildren` and renders children
- [ ] Each node displays included/excluded/conflict state visually (color/icon)
- [ ] "Show excluded" toggle hides or shows excluded nodes
- [ ] Directory nodes show expand indicator when they have children
- [ ] INCLUDE mode subtrees with no matches show as excluded
- [ ] Large trees remain responsive (lazy loading)

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
- [ ] Root node renders after scan
- [ ] Expanding node loads children
- [ ] Include/exclude states display correctly
- [ ] Show excluded toggle works
- [ ] No UI lockup on large trees

## Done When
- [ ] Acceptance criteria met
- [ ] Verified manually
