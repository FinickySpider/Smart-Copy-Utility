# Smart Copy Utility (Windows) — Comprehensive Design Document

## 1. Purpose

A Windows-only desktop utility to copy large folder trees efficiently while avoiding disposable/generated files by applying **hierarchical rule files** embedded throughout the directory tree.

Primary goals:

* **Fast** copying using `robocopy`
* **Simple** rules using two file types:

  * `.copyignore` (blacklist / exclude)
  * `.copyinclude` (whitelist / include)
* **Predictable recursion semantics**: rule context is path-local and scoped to the subtree
* **Preview-first** workflow: show what will be copied
* **Dry-run** workflow: simulate without writing
* **Explainability**: for any file/folder, show *why* included/excluded
* **Strictness**: conflicting rule files are fatal errors blocking copy

Non-goals:

* Cross-platform support
* “Profiles” / template rule builder / auto rule generation
* Git-specific behavior (no special casing `.git` or project types)
* Complex rule metadata headers or inheritance directives

---

## 2. High-Level User Workflow

1. User selects **Source** folder and **Destination** folder.
2. App scans Source for:

   * rule files
   * conflicts (both rule files in same directory)
3. App builds a **preview model** that can be explored via a **lazy tree view**.
4. User can click any node to see **Explain**:

   * active mode at path
   * matched pattern(s)
   * which rule file(s) caused inclusion/exclusion
5. User runs **Dry Run**:

   * builds a robocopy job plan
   * optionally executes robocopy in listing mode (`/L`) per job to estimate totals
6. User runs **Copy**:

   * executes job plan sequentially via robocopy
   * shows streamed logs/progress
7. User can **Cancel** at any time during dry-run/copy.

---

## 3. Technology Stack (Chosen)

* Windows-only
* **Electron** (main process in Node.js)
* **React** (renderer process UI)
* Copy backend: **robocopy**
* IPC: Electron `ipcMain` / `ipcRenderer` with a small explicit API

---

## 4. Core Concepts

### 4.1 Rule Files (Case-Insensitive)

Two rule files, names case-insensitive on Windows:

* `.copyignore` — blacklist behavior
* `.copyinclude` — whitelist behavior

Only one rule file type may exist in a directory.

### 4.2 Rule Modes

* **IGNORE mode** (`.copyignore`): exclude anything matching patterns
* **INCLUDE mode** (`.copyinclude`): include only anything matching patterns
* **NONE mode** (no rules encountered on path): include everything (no filtering)

### 4.3 Context is Path-Local (No Sibling Leakage)

Traversal maintains a **context**:

* `mode`: NONE | IGNORE | INCLUDE
* `patterns`: list of pattern entries applicable for this subtree
* `sources`: list of rule file origins for patterns (for explain)

When entering a directory:

* start with parent context
* if rule file exists, derive a new context for this subtree (see stacking/reset)
  When leaving directory:
* revert to parent context automatically (push/pop behavior)

This ensures:

* Rules added in one subfolder do not affect siblings.

### 4.4 Stacking and Reset Rules

When a directory contains a rule file:

#### If it contains `.copyignore`:

* If parent mode is IGNORE:

  * **stack**: patterns = parent.patterns + patternsFromThisFile
* If parent mode is INCLUDE or NONE:

  * **reset**: patterns = patternsFromThisFile
* mode becomes IGNORE

#### If it contains `.copyinclude`:

* If parent mode is INCLUDE:

  * **stack**: patterns = parent.patterns + patternsFromThisFile
* If parent mode is IGNORE or NONE:

  * **reset**: patterns = patternsFromThisFile
* mode becomes INCLUDE

If a directory has no rule file:

* inherits parent context unchanged.

### 4.5 Strict Whitelist Behavior (Confirmed)

If a directory is in INCLUDE mode and **no files or descendant files match** the effective include patterns:

* **nothing in that subtree is copied**

In the preview tree:

* subtree should appear excluded (grey) once determined (may require lazy evaluation).

---

## 5. Conflict Handling (Fatal)

### 5.1 Conflict Definition

A directory contains **both** `.copyignore` and `.copyinclude` (any casing).

### 5.2 Required Behavior

* Mark as **fatal error**.
* Scan should collect **all conflicts** (not stop at first) for convenience.
* Dry Run and Copy are **blocked** if conflicts exist.
* Preview should display conflicts prominently.

### 5.3 UX Requirements

For each conflict, show:

* full directory path
  Actions:
* “Open in Explorer” (opens the folder)
* “Copy path”

---

## 6. Rule File Format

### 6.1 Line Format

Each non-empty, non-comment line is a **pattern**.

* Blank lines ignored
* Lines starting with `#` ignored (comment)

### 6.2 Pattern Language (Simple Glob)

Supported patterns:

* `name/` — matches directories with that name under the current subtree (any depth)
* `*.ext` — matches files by extension/name
* `foo/bar.txt` — matches relative path segments
* `**` MAY be supported optionally; if unsupported, use simple matching rules.

**Design choice to keep simple:** treat patterns as matching against a normalized *relative path from the rule file directory*. However, for `name/` directory patterns, match by directory name anywhere beneath.

Normalization:

* Convert paths to use `\` internally but match with both `/` and `\` in patterns.
* Case-insensitive matching on Windows.

### 6.3 Pattern Precedence

* In this system there are **no negations**.
* If multiple patterns match, outcome is the same (excluded in IGNORE mode; included in INCLUDE mode).
* For explain, record all matching patterns (or first match; prefer “all matches” for clarity).

---

## 7. Determining Include/Exclude

### 7.1 In IGNORE Mode

Default is **included**, unless excluded by any matching pattern.

* Include if no pattern matches
* Exclude if any pattern matches

### 7.2 In INCLUDE Mode

Default is **excluded**, unless included by a matching pattern.

* Exclude if no pattern matches
* Include if any pattern matches

### 7.3 Directory Decisions

Directories in INCLUDE mode should be treated as:

* Included if they contain at least one included descendant (or match directly, if you choose to allow directory patterns to include whole dir)
* Excluded if they contain no included descendants

For simplicity and strictness:

* A directory is considered “copy-relevant” if it contains included files or included directories.

Implementation note for lazy tree:

* directory inclusion may be “unknown” until children are evaluated; UI can represent unknown state lightly or compute a quick check.

---

## 8. Root Rules Only Mode

UI toggle: **Root rules only**

When enabled:

* Only the highest-level rule file found at source root (or in root itself) is used.
* All nested rule files are ignored.
* Mode and patterns never change during traversal.

If no root rule file exists:

* mode NONE → copy everything.

---

## 9. Preview and Explain Requirements

### 9.1 Preview Tree (Lazy)

* Tree is populated **on demand** (expand node → request children)
* Each node shows:

  * name
  * included/excluded (and conflict if applicable)
  * if directory: expandable indicator

UI should have:

* toggle: “Show excluded”
* counts/summary area:

  * included file count (best effort)
  * excluded file count (best effort)
  * optional included bytes estimate

### 9.2 Explain Panel

When a node is selected, show:

* Path
* Decision: Included / Excluded / Conflict
* Active mode at this path
* Rule file(s) currently in effect (chain)
* Matching pattern lines with:

  * rule file path
  * line number
  * pattern text

Actions:

* Open rule file folder in Explorer
* Copy path(s)

---

## 10. Copy Plan and Robocopy Strategy

### 10.1 Why Multiple Robocopy Jobs

Robocopy cannot naturally switch rule sets per subtree in a single call while matching your hierarchical mode switching.

Therefore:

* Build a **job plan** where each job covers a subtree with a stable effective ruleset.

### 10.2 Job Definition

A job contains:

* `jobId`
* `srcRoot`: absolute source subtree path
* `dstRoot`: absolute destination subtree path
* `mode`: IGNORE | INCLUDE | NONE
* `patterns`: effective stacked patterns for this job
* `originRuleFiles`: for debugging/reporting

### 10.3 Job Segmentation Rules

Create a new job whenever:

* a directory contains `.copyignore` or `.copyinclude` (rule boundary), OR
* rootOnly toggled (single job for entire tree)

In addition:

* In INCLUDE mode, if a subtree has no included content, it generates **no jobs** (skip).

### 10.4 Robocopy Invocation Principles

General:

* Always preserve directory structure relative to job root.
* Use restartable mode and reasonable defaults.

#### NONE mode job

* Copy everything under `srcRoot` to `dstRoot`.

#### IGNORE mode job

* Copy everything except excluded patterns.
* Map patterns into robocopy exclusions:

  * directory name patterns → `/XD` entries (as applicable)
  * file patterns → `/XF` entries

If pattern is a relative path (e.g., `foo\bar.txt`), implement exclusion by:

* Prefer to exclude via robocopy switches when possible
* Otherwise fall back to filtering plan-side (enumerate) and use robocopy with file list (see below) or skip unsupported exclusions

#### INCLUDE mode job (strict whitelist)

Robocopy is not a natural whitelist tool. Strategy:

* Enumerate included files in this subtree using the rule engine.
* Generate a temporary file list for robocopy using `/IF` (include files) if viable, or use `/XF` to exclude everything else is not feasible.

Recommended approach for correctness:

* For each INCLUDE job:

  * Build explicit list of files to copy (relative paths).
  * Use robocopy capability to copy specific files from list:

    * If `/IF` supports it as desired, use it.
    * If not, run robocopy per top-level included directory/file groups or use a staging directory tree.
  * This is acceptable because INCLUDE jobs should be relatively smaller than full-tree copies.

**Important**: the implementation must maintain speed where possible but correctness is priority.

### 10.5 Logging and Output

Capture robocopy stdout/stderr line-by-line and stream to UI.

Parse minimal metrics if desired:

* “Files : …”
* “Bytes : …”
* “Times : …”
* “Ended : …”
  but parsing is optional for MVP; raw logs are acceptable.

### 10.6 Exit Codes

Robocopy exit codes are bitmasks; treat success as:

* 0–7 are generally “success with some differences”
* 8+ indicates failure
  Implementation must interpret correctly and show in UI summary.

---

## 11. Dry Run Mode

Dry run must:

* Produce the job plan
* Optionally run robocopy with listing-only (e.g., `/L`) per job to gather realistic counts without writing

Dry run output:

* jobs list
* total estimated files/bytes (best-effort)
* conflicts list (if any)
* “valid plan” boolean (false if conflicts exist)

---

## 12. Cancel Behavior

Cancel must:

* Terminate current robocopy process
* Stop future jobs
* Update UI state to “cancelled”
* Keep logs up to cancellation point

---

## 13. Electron/React Architecture

### 13.1 Processes

* Electron **main process**:

  * scanning, rule evaluation, job plan building
  * robocopy spawning
  * filesystem operations
* React **renderer**:

  * UI
  * calls main via IPC
  * receives streamed events

### 13.2 IPC API (Required)

**Commands (renderer → main)**

1. `selectFolder({ kind }) -> { path | null }`
2. `scan({ source, dest, rootOnly }) -> { scanId, conflicts, rootNode, stats }`
3. `listChildren({ scanId, dirPath }) -> { children }`
4. `explain({ scanId, path }) -> { explain }`
5. `dryRun({ scanId, options }) -> { report }`
6. `copy({ scanId, options }) -> { started: true }`
7. `cancel({ scanId }) -> { cancelled: true }`

**Events (main → renderer)**

* `op:status` (phase changes: scanning, ready, dryrun, copying, cancelled, done, error)
* `op:logLine` (raw robocopy output lines)
* `op:jobStart` / `op:jobEnd`
* `op:progress` (optional parsed metrics)
* `op:error` (fatal errors with details)

---

## 14. UI Requirements

### 14.1 Main Screen

* Source picker (button + drag/drop optional)
* Destination picker
* Toggle: Root rules only
* Buttons: Preview, Dry Run, Copy, Cancel
* Tree view + show excluded toggle
* Details/explain panel
* Conflicts list panel/banner (when present)

### 14.2 Error States

* Missing source/destination → disable actions, show inline message
* Same folder chosen for both → warn/block
* Conflicts found → block Dry Run and Copy
* Robocopy failure → show summary and keep logs

---

## 15. Data Structures (Suggested)

### 15.1 Rule File Record

* `path`
* `type`: IGNORE_FILE | INCLUDE_FILE
* `lines`: array of parsed patterns with line numbers

### 15.2 Pattern Entry

* `patternText`
* `lineNumber`
* `ruleFilePath`

### 15.3 Context

* `mode`
* `patterns`: PatternEntry[]
* `ruleChain`: string[] (paths)

### 15.4 Node

* `path`
* `name`
* `isDir`
* `state`: INCLUDED | EXCLUDED | CONFLICT | UNKNOWN
* `hasChildren`
* `modeAtPath`

### 15.5 Scan Result

* `scanId`
* `sourceRoot`
* `destRoot`
* `rootOnly`
* `conflicts`: string[]
* caches/maps as needed for lazy evaluation:

  * rule file locations by dir
  * computed contexts optionally memoized by dir path

---

## 16. Performance Requirements

* Must handle trees with very large file counts without UI lockup.
* Tree is **lazy**:

  * only list children when expanded
* Scanning should:

  * identify rule files and conflicts quickly
  * avoid enumerating all files unless required (include-mode evaluation may require deeper checking, but do it on demand)

Recommended:

* Use async filesystem calls
* Use caching/memoization for contexts per directory path

---

## 17. Security / Safety

* No network access required
* No elevated privileges expected
* Ensure destination is not inside source (or vice versa) to avoid recursion hazards
* Ensure robocopy command args are safely constructed (no shell injection; use spawn with args array)

---

## 18. Acceptance Criteria (MVP)

1. Select Source and Destination folders.
2. App scans and detects all rule conflicts.
3. Preview tree shows included/excluded nodes correctly per rules.
4. `.copyinclude` strict behavior:

   * if nothing matches, nothing copies from that subtree.
5. Nested mode switching works:

   * include-world can be overridden by a deeper ignore-world and vice versa.
6. Sibling non-leakage verified:

   * adding rules in one subtree does not affect siblings.
7. Explain view shows exact matching rule line(s) and rule file(s).
8. Dry run generates a job plan and blocks if conflicts exist.
9. Copy executes robocopy jobs sequentially, streams logs, interprets exit codes, and can cancel.

---

## 19. Test Matrix (Must Implement)

### Rule Semantics

* No rules anywhere → everything included
* Root `.copyignore` excludes `node_modules/`
* `.copyignore` stacked in child adds more excludes; sibling doesn’t inherit child excludes
* Root `.copyignore` + subtree `.copyinclude` resets to include-world
* Include-world subtree with no matches excludes entire subtree
* Include-world with matches includes only those
* Include-world deeper `.copyignore` switches back to ignore-world for that sub-subtree

### Conflicts

* Both files in same folder → fatal conflict listing, open-in-explorer action, copy blocked

### Root-only mode

* Nested rule files ignored

### Robocopy integration

* Dry run runs without writing
* Copy creates correct destination structure
* Exit code interpretation correct (0–7 success, 8+ failure)

---

## 20. Deliverables

* Electron app
* React UI
* Rule engine in main process
* Robocopy executor
* Logs/progress streaming
* `DESIGN.md` (this file)
* `README.md` with usage instructions and rule examples

---

## 21. Example Rule Files

### Example `.copyignore`

```
# Ignore generated stuff
node_modules/
dist/
build/
*.log
__pycache__/
.venv/
```

### Example `.copyinclude`

```
# Only copy these
src/
README.md
package.json
```

