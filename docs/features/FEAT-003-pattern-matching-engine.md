---
id: FEAT-003
type: feature
status: complete
priority: high
phase: PHASE-01
sprint: SPRINT-01
owner: ""
depends_on: [FEAT-002]
---

# FEAT-003: Pattern Matching Engine

## Description
Implement the pattern matching engine that evaluates whether a given file or directory path matches a set of patterns. Supports three pattern types: directory name patterns (`name/`), glob patterns (`*.ext`), and relative path patterns (`foo/bar.txt`). All matching is case-insensitive on Windows.

## Acceptance Criteria
- [x] `name/` patterns match directories with that name at any depth beneath the rule file
- [x] `*.ext` patterns match files by extension
- [x] `foo/bar.txt` relative path patterns match against normalized relative path from rule file directory
- [x] Matching is case-insensitive
- [x] Both `/` and `\` path separators are handled
- [x] Returns all matching patterns (not just first match) for explainability
- [x] Non-matching paths return empty match list

## Files Touched
| File | Change |
|------|--------|
| `src/main/rules/matcher.ts` | Pattern matching implementation |
| `tests/rules/matcher.test.ts` | Unit tests |

## Implementation Notes
- Normalize all paths to use `\` internally
- For `name/` patterns: check if any path segment matches the directory name
- For `*.ext` patterns: check file extension (or simple glob match)
- For relative path patterns: compare against relative path from rule file directory
- Return array of matching `PatternEntry` objects for explain support

## Testing
- [x] `node_modules/` matches `src\project\node_modules\package.json`
- [x] `*.log` matches `debug.log` and `errors.LOG`
- [x] `src/main.ts` matches the exact relative path
- [x] No false positives on non-matching paths
- [x] Case-insensitive matching verified

## Done When
- [x] Acceptance criteria met
- [x] Unit tests pass
