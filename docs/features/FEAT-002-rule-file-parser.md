---
id: FEAT-002
type: feature
status: complete
priority: high
phase: PHASE-01
sprint: SPRINT-01
owner: ""
depends_on: [FEAT-001]
---

# FEAT-002: Rule File Parser

## Description
Implement a parser that reads `.copyignore` and `.copyinclude` files and produces structured rule file records. The parser handles comments (`#`), blank lines, and produces an array of `PatternEntry` objects with pattern text, line number, and source file path. File names are matched case-insensitively.

## Acceptance Criteria
- [x] Reads `.copyignore` files and returns type `IGNORE_FILE` with parsed patterns
- [x] Reads `.copyinclude` files and returns type `INCLUDE_FILE` with parsed patterns
- [x] Blank lines are skipped
- [x] Lines starting with `#` are skipped (comments)
- [x] Each pattern entry includes `patternText`, `lineNumber` (1-based), and `ruleFilePath`
- [x] File name matching is case-insensitive (`.CopyIgnore` == `.copyignore`)
- [x] Gracefully handles missing or unreadable rule files

## Files Touched
| File | Change |
|------|--------|
| `src/main/rules/parser.ts` | Rule file parser implementation |
| `src/main/rules/types.ts` | RuleFileRecord, PatternEntry, RuleType types |
| `tests/rules/parser.test.ts` | Unit tests |

## Implementation Notes
- Use `fs.promises.readFile` for async reading
- Split on newlines, trim, filter blanks and comments
- Return structured `RuleFileRecord`

## Testing
- [x] Parses a standard `.copyignore` with mixed content
- [x] Parses a `.copyinclude` with mixed content
- [x] Handles empty rule file (returns empty patterns array)
- [x] Handles file with only comments
- [x] Case-insensitive file name detection

## Done When
- [x] Acceptance criteria met
- [x] Unit tests pass
