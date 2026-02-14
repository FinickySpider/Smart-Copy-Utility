---
id: FEAT-011
type: feature
status: planned
priority: high
phase: PHASE-03
sprint: SPRINT-03
owner: ""
depends_on: [FEAT-004, FEAT-007]
---

# FEAT-011: Robocopy Job Plan Builder

## Description
Build a robocopy job plan from the rule engine and scan results. The plan segments the source tree into jobs wherever a rule boundary exists (directory containing a rule file). Each job captures source/dest paths, mode, effective patterns, and origin rule files. INCLUDE mode subtrees with no included content generate no jobs.

## Acceptance Criteria
- [ ] Job plan segments at every rule file boundary
- [ ] Each job includes: jobId, srcRoot, dstRoot, mode, patterns, originRuleFiles
- [ ] NONE mode jobs cover subtrees with no rule files
- [ ] IGNORE mode jobs include effective stacked patterns
- [ ] INCLUDE mode jobs include effective stacked patterns
- [ ] INCLUDE mode subtrees with no matching files generate no jobs (skipped)
- [ ] Root-only mode produces a single job for the entire tree (when enabled)
- [ ] Job plan is serializable for dry run reporting

## Files Touched
| File | Change |
|------|--------|
| `src/main/copier/jobPlan.ts` | Job plan builder |
| `src/main/copier/types.ts` | Job, JobPlan types |
| `tests/copier/jobPlan.test.ts` | Unit tests |

## Implementation Notes
- Walk the tree using context traversal; emit a new job when context changes
- For INCLUDE mode: enumerate included files to determine if job is needed
- Map destination paths relative to dest root

## Testing
- [ ] No rules → single NONE job for entire tree
- [ ] Root `.copyignore` → single IGNORE job
- [ ] Nested rule change → multiple jobs at boundaries
- [ ] Empty INCLUDE subtree → no job generated
- [ ] Root-only mode → single job regardless of nested rules

## Done When
- [ ] Acceptance criteria met
- [ ] Unit tests pass
