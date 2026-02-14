---
id: FEAT-001
type: feature
status: complete
priority: high
phase: PHASE-01
sprint: SPRINT-01
owner: ""
depends_on: []
---

# FEAT-001: Electron Project Scaffolding

## Description
Initialize the Electron + React project with a working main process, renderer process, and IPC skeleton. The app should launch, display a minimal React UI, and have the IPC bridge wired so that renderer can call main process handlers.

## Acceptance Criteria
- [x] Electron app launches and displays a React renderer window
- [x] Main process and renderer process are separated correctly
- [x] IPC bridge is wired with at least one working handler (`selectFolder`)
- [x] `selectFolder` opens a native folder picker dialog and returns the selected path
- [x] Project uses a standard build tool (e.g., electron-forge, electron-builder, or vite)
- [x] `npm install` and `npm start` work from a clean clone

## Files Touched
| File | Change |
|------|--------|
| `package.json` | Project metadata, dependencies, scripts |
| `src/main/index.ts` | Electron main process entry point |
| `src/renderer/index.tsx` | React renderer entry point |
| `src/main/ipc.ts` | IPC handler registration |
| `src/preload/index.ts` | Preload script exposing IPC to renderer |

## Implementation Notes
- Use TypeScript for both main and renderer
- Use contextBridge in preload for secure IPC
- Minimal UI: just a title and a "Select Folder" button that invokes `selectFolder`

## Testing
- [x] App launches without errors
- [x] Select Folder dialog opens and returns a path
- [x] No console errors in renderer DevTools

## Done When
- [x] Acceptance criteria met
- [x] Verified manually
