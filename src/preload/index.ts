import { contextBridge, ipcRenderer } from 'electron';

/**
 * Exposes a safe API to the renderer process via contextBridge.
 * The renderer accesses these methods via `window.electronAPI`.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: (args: { kind: string }): Promise<{ path: string | null }> =>
    ipcRenderer.invoke('selectFolder', args),
});
