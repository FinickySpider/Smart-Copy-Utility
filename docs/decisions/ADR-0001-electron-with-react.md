---
id: ADR-0001
type: decision
status: complete
date: 2026-02-13
supersedes: ""
superseded_by: ""
---

# ADR-0001: Electron with React for Desktop Application

## Context
The Smart Copy Utility needs a Windows desktop application with a rich UI for tree views, explain panels, and streamed log output. It needs access to the filesystem and the ability to spawn child processes (robocopy). A technology stack must be chosen that supports these requirements.

## Decision
Use **Electron** for the desktop runtime (main process in Node.js) and **React** for the renderer UI. IPC between main and renderer uses Electron's built-in `ipcMain`/`ipcRenderer` with `contextBridge` for security.

## Consequences
### Positive
- Full access to Node.js APIs (filesystem, child_process) in main process
- Rich UI capabilities with React component ecosystem
- Well-documented IPC model for secure main/renderer communication
- Large ecosystem and community support

### Negative
- Larger application bundle size compared to native Windows apps
- Higher memory usage due to Chromium runtime
- Requires managing Electron security best practices (contextBridge, no nodeIntegration in renderer)

## Links
- Related items:
  - FEAT-001
