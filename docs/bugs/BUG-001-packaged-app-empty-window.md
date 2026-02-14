---
id: BUG-001
type: bug
status: complete  # planned | in_progress | complete | deprecated
severity: major  # critical | major | minor
phase: PHASE-04
sprint: SPRINT-05
owner: ""
---

# BUG-001: Packaged app shows empty window

## Problem
Packaged builds launched with a blank/white window (menu bar visible) because the renderer’s preload script was not being loaded, causing the renderer to fail when accessing `window.electronAPI`.

## Reproduction Steps
1. Build a distributable (`npm run make`).
2. Launch the packaged EXE from the ZIP or installer.
3. Observe the window content area is empty.

## Expected
The main UI renders (folder pickers, preview, explain, copy controls).

## Actual
Window content area is blank/white.

## Fix Strategy
- Point `BrowserWindow` preload path to the actual preload bundle emitted by the build (currently `.vite/build/index.js`).

## Verification
- [x] Not reproducible
- [x] No regressions
