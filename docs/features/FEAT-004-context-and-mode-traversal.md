---
id: FEAT-004
type: feature
status: complete
priority: high
phase: PHASE-01
sprint: SPRINT-01
owner: ""
depends_on: [FEAT-002, FEAT-003]
---

# FEAT-004: Context and Mode Traversal

## Description
Implement the context/mode traversal system that walks a directory tree and maintains a stack-based context. The context tracks the current mode (NONE/IGNORE/INCLUDE), effective patterns, and rule chain. Implements stacking (same mode adds patterns) and reset (mode switch replaces patterns) semantics. Ensures no sibling leakage via push/pop behavior.

## Acceptance Criteria
- [x] Starting context is NONE mode with empty patterns
- [x] Entering a directory with `.copyignore` sets mode to IGNORE
- [x] Entering a directory with `.copyinclude` sets mode to INCLUDE
- [x] Same-mode stacking: IGNORE → child IGNORE appends patterns
- [x] Same-mode stacking: INCLUDE → child INCLUDE appends patterns
- [x] Mode switch resets: IGNORE → child INCLUDE replaces patterns entirely
- [x] Mode switch resets: INCLUDE → child IGNORE replaces patterns entirely
- [x] NONE → any rule file resets to that mode's patterns
- [x] Leaving a directory reverts to parent context (no sibling leakage)
- [x] Context includes rule chain (list of rule file paths) for explain support

## Files Touched
| File | Change |
|------|--------|
| `src/main/rules/context.ts` | Context management and traversal logic |
| `src/main/rules/types.ts` | Context type definition |
| `tests/rules/context.test.ts` | Unit tests |

## Implementation Notes
- Use a stack (push on enter, pop on leave) for context management
- When entering a directory: check for rule files, derive new context or inherit parent
- Memoize computed contexts by directory path for performance

## Testing
- [x] No rules anywhere → NONE mode, everything included
- [x] Root `.copyignore` → IGNORE mode with root patterns
- [x] Stacked `.copyignore` in child adds patterns, sibling doesn't inherit
- [x] Mode switch from IGNORE to INCLUDE resets patterns
- [x] Mode switch from INCLUDE to IGNORE resets patterns
- [x] Deep nesting with multiple mode switches

## Done When
- [x] Acceptance criteria met
- [x] Unit tests pass
