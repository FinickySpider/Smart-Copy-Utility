import { contextBridge, ipcRenderer } from 'electron';

/**
 * Type definitions for IPC arguments and responses.
 */
interface ScanArgs {
  source: string;
  dest: string;
  rootOnly: boolean;
}

interface TreeNode {
  path: string;
  name: string;
  isDir: boolean;
  state: string;
  hasChildren: boolean;
  modeAtPath: string;
}

interface ScanStats {
  directoriesScanned: number;
  ruleFilesFound: number;
  conflictsFound: number;
}

interface ScanResponse {
  scanId: string;
  conflicts: string[];
  rootNode: TreeNode;
  stats: ScanStats;
}

interface ListChildrenArgs {
  scanId: string;
  dirPath: string;
}

interface ListChildrenResponse {
  children: TreeNode[];
}

interface ExplainArgs {
  scanId: string;
  nodePath: string;
}

interface PatternEntry {
  patternText: string;
  lineNumber: number;
  ruleFilePath: string;
}

interface ExplainData {
  path: string;
  name: string;
  decision: string;
  mode: string;
  ruleChain: string[];
  matchingPatterns: PatternEntry[];
}

interface ExplainResponse {
  explain: ExplainData;
}

/**
 * Exposes a safe API to the renderer process via contextBridge.
 * The renderer accesses these methods via `window.electronAPI`.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: (args: { kind: string }): Promise<{ path: string | null }> =>
    ipcRenderer.invoke('selectFolder', args),
  
  scan: (args: ScanArgs): Promise<ScanResponse> =>
    ipcRenderer.invoke('scan', args),
  
  listChildren: (args: ListChildrenArgs): Promise<ListChildrenResponse> =>
    ipcRenderer.invoke('listChildren', args),
  
  explain: (args: ExplainArgs): Promise<ExplainResponse> =>
    ipcRenderer.invoke('explain', args),
  
  openInExplorer: (args: { dirPath: string }): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('openInExplorer', args),
  
  copyToClipboard: (args: { text: string }): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('copyToClipboard', args),
});
