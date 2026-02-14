---
id: ADR-0005
type: decision
status: complete
date: 2026-02-13
supersedes: ""
superseded_by: ""
---

# ADR-0005: Lazy Tree Evaluation for Preview

## Context
The source tree may contain a very large number of files and directories. Evaluating the entire tree eagerly for the preview would be slow and could lock the UI. A strategy is needed for responsive preview rendering.

## Decision
Use **lazy tree evaluation**: the preview tree is populated on demand. When the user expands a directory node, `listChildren` is called to evaluate and return child nodes with their include/exclude states. Contexts are memoized by directory path for performance. In INCLUDE mode, directory inclusion may be "unknown" until children are evaluated.

## Consequences
### Positive
- Fast initial scan — only rule files and conflicts need discovery upfront
- UI remains responsive for very large trees
- Context memoization avoids redundant computation
- Memory usage scales with expanded portion, not full tree

### Negative
- Directory state in INCLUDE mode may require deeper evaluation to determine
- First expand of deep directories may have noticeable latency
- UI must handle "unknown" state gracefully during evaluation

## Links
- Related items:
  - FEAT-008
  - FEAT-007
