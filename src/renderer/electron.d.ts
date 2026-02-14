/**
 * Type declarations for the Electron API exposed via contextBridge.
 */
export interface ElectronAPI {
  selectFolder: (args: { kind: string }) => Promise<{ path: string | null }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
