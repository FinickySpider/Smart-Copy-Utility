
# Design Document — Smart Copy Utility

## Summary
A Windows-only desktop utility (Electron + React) that copies large folder trees efficiently using `robocopy`, while avoiding disposable/generated files through hierarchical `.copyignore` and `.copyinclude` rule files embedded in the directory tree. It provides a preview-first workflow with an explainability layer so users understand exactly why each file is included or excluded.

## Goals
- Fast copying of large folder trees using `robocopy`
- Simple two-file rule system: `.copyignore` (blacklist) and `.copyinclude` (whitelist)
- Predictable path-local recursion semantics with no sibling leakage
- Preview-first workflow: show what will be copied before copying
- Dry-run workflow: simulate without writing
- Explainability: for any file/folder, show why it was included or excluded
- Strictness: conflicting rule files are fatal errors blocking copy

## Non Goals
- Cross-platform support
- Profiles, template rule builder, or auto rule generation
- Git-specific behavior (no special casing `.git` or project types)
- Complex rule metadata headers or inheritance directives
- Network access or elevated privileges

## Users
Windows power users and developers who need to copy large project trees while excluding generated/disposable content (node_modules, build outputs, caches, etc.). Used in a local desktop context with no network requirement.

## Core User Flows

### Flow A — Standard Copy
1. User selects Source folder and Destination folder
2. App scans Source for rule files and conflicts
3. App builds a preview model displayed as a lazy tree view
4. User reviews included/excluded files, optionally uses Explain on individual nodes
5. User runs Dry Run to simulate and review job plan
6. User runs Copy to execute robocopy jobs sequentially
7. App streams logs and progress; user can Cancel at any time

### Flow B — Explain a Decision
1. User clicks any node in the preview tree
2. Explain panel shows: path, decision (included/excluded/conflict), active mode, rule file chain, matching pattern lines with file path, line number, and pattern text
3. User can open rule file folder in Explorer or copy paths

### Flow C — Conflict Resolution
1. App detects directories with both `.copyignore` and `.copyinclude`
2. All conflicts are collected and displayed prominently
3. Dry Run and Copy are blocked until conflicts are resolved
4. User can "Open in Explorer" or "Copy path" for each conflict

## Requirements

### Functional
- Parse `.copyignore` and `.copyinclude` rule files (case-insensitive names)
- Implement IGNORE, INCLUDE, and NONE modes with stacking/reset semantics
- Detect and report all conflicts (both rule files in same directory) as fatal errors
- Build lazy preview tree with included/excluded/conflict/unknown states
- Explain panel showing mode, rule chain, and matching patterns with line numbers
- Build robocopy job plan segmented at rule boundaries
- Execute robocopy jobs sequentially with streamed log output
- Dry run via robocopy `/L` flag
- Cancel terminates current robocopy and stops future jobs
- Root-rules-only toggle ignores nested rule files
- Pattern language: `name/` (directory match), `*.ext` (glob), `foo/bar.txt` (relative path)
- Case-insensitive pattern matching on Windows
- No negation patterns

### Constraints
- Windows-only
- Electron main process + React renderer
- Copy backend is `robocopy` (spawned with args array, no shell injection)
- Destination must not be inside source (or vice versa)
- Robocopy exit codes 0–7 are success; 8+ are failure
- Must handle very large file trees without UI lockup (lazy tree, async FS calls)

### Out of Scope
- Cross-platform support
- Profile management / template rule builder
- Git-aware behavior
- Rule metadata headers or inheritance directives
- Log file persistence beyond session
- Robocopy output parsing beyond basic metrics (MVP accepts raw logs)

## Data Model

### Rule File Record
- `path`: absolute path to rule file
- `type`: IGNORE_FILE | INCLUDE_FILE
- `lines`: array of `PatternEntry`

### Pattern Entry
- `patternText`: the pattern string
- `lineNumber`: 1-based line number in rule file
- `ruleFilePath`: path to the owning rule file

### Context (per directory during traversal)
- `mode`: NONE | IGNORE | INCLUDE
- `patterns`: PatternEntry[]
- `ruleChain`: string[] (paths of rule files contributing to current context)

### Tree Node
- `path`: absolute path
- `name`: display name
- `isDir`: boolean
- `state`: INCLUDED | EXCLUDED | CONFLICT | UNKNOWN
- `hasChildren`: boolean
- `modeAtPath`: NONE | IGNORE | INCLUDE

### Scan Result
- `scanId`: unique identifier
- `sourceRoot`: absolute source path
- `destRoot`: absolute destination path
- `rootOnly`: boolean
- `conflicts`: string[] (directory paths with both rule files)
- Internal caches: rule file locations by dir, memoized contexts by dir path

### Robocopy Job
- `jobId`: unique identifier
- `srcRoot`: absolute source subtree path
- `dstRoot`: absolute destination subtree path
- `mode`: IGNORE | INCLUDE | NONE
- `patterns`: effective stacked patterns
- `originRuleFiles`: string[] (for debugging/reporting)

## APIs

### IPC Commands (renderer → main)
1. `selectFolder({ kind }) → { path | null }`
2. `scan({ source, dest, rootOnly }) → { scanId, conflicts, rootNode, stats }`
3. `listChildren({ scanId, dirPath }) → { children }`
4. `explain({ scanId, path }) → { explain }`
5. `dryRun({ scanId, options }) → { report }`
6. `copy({ scanId, options }) → { started: true }`
7. `cancel({ scanId }) → { cancelled: true }`

### IPC Events (main → renderer)
- `op:status` — phase changes: scanning, ready, dryrun, copying, cancelled, done, error
- `op:logLine` — raw robocopy output lines
- `op:jobStart` / `op:jobEnd` — job lifecycle
- `op:progress` — optional parsed metrics
- `op:error` — fatal errors with details

## Security and Privacy
- No network access required
- No elevated privileges expected
- Destination must not be inside source (or vice versa) to prevent recursion
- Robocopy arguments constructed via `spawn` with args array (no shell injection)
- No sensitive user data collected or stored
- Rule files are plain text with no executable content

## Rollout Plan
- **Phase 1**: Foundation & Rule Engine — project scaffolding, rule parsing, pattern matching, context system
- **Phase 2**: Preview & Explain — scanning, lazy tree view, explain panel, conflict UI
- **Phase 3**: Copy Engine & Execution — robocopy job planning, dry run, copy execution, progress, cancel
- **Phase 4**: Polish & Hardening — root-only mode, error states, safety checks, UI polish, full test matrix

## Open Questions
- (none — design document is comprehensive)
