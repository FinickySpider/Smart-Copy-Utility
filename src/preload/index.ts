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

interface JobPlanOptions {
  scanId: string;
  rootOnly?: boolean;
}

interface RobocopyJob {
  jobId: string;
  srcRoot: string;
  dstRoot: string;
  mode: string;
  patterns: PatternEntry[];
  originRuleFiles: string[];
}

interface JobPlan {
  planId: string;
  sourceRoot: string;
  destRoot: string;
  jobs: RobocopyJob[];
  totalJobs: number;
}

interface DryRunReport {
  plan: JobPlan;
  validPlan: boolean;
  conflicts: string[];
  estimatedFiles?: number;
  estimatedBytes?: number;
}

interface DryRunResponse {
  success: boolean;
  report?: DryRunReport;
  error?: string;
}

interface CopyResponse {
  success: boolean;
  error?: string;
}

interface CancelResponse {
  success: boolean;
  error?: string;
}

type CopyEventListener = (data: any) => void;

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
  
  dryRun: (args: JobPlanOptions): Promise<DryRunResponse> =>
    ipcRenderer.invoke('dryRun', args),
  
  copy: (args: JobPlanOptions): Promise<CopyResponse> =>
    ipcRenderer.invoke('copy', args),
  
  cancel: (): Promise<CancelResponse> =>
    ipcRenderer.invoke('cancel'),
  
  // Event listeners for copy progress
  onCopyStatus: (listener: CopyEventListener) => {
    ipcRenderer.on('copy:status', (_event, data) => listener(data));
    return () => ipcRenderer.removeListener('copy:status', listener);
  },
  
  onCopyJobStart: (listener: CopyEventListener) => {
    ipcRenderer.on('copy:jobStart', (_event, data) => listener(data));
    return () => ipcRenderer.removeListener('copy:jobStart', listener);
  },
  
  onCopyJobEnd: (listener: CopyEventListener) => {
    ipcRenderer.on('copy:jobEnd', (_event, data) => listener(data));
    return () => ipcRenderer.removeListener('copy:jobEnd', listener);
  },
  
  onCopyLogLine: (listener: CopyEventListener) => {
    ipcRenderer.on('copy:logLine', (_event, data) => listener(data));
    return () => ipcRenderer.removeListener('copy:logLine', listener);
  },
  
  onCopyDone: (listener: CopyEventListener) => {
    ipcRenderer.on('copy:done', (_event, data) => listener(data));
    return () => ipcRenderer.removeListener('copy:done', listener);
  },
  
  onCopyError: (listener: CopyEventListener) => {
    ipcRenderer.on('copy:error', (_event, data) => listener(data));
    return () => ipcRenderer.removeListener('copy:error', listener);
  },
});
