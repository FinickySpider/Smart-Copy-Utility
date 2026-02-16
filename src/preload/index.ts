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

  selectDirectory: (args: { title: string }): Promise<{ path: string | null }> =>
    ipcRenderer.invoke('selectDirectory', args),

  selectFiles: (args: { title: string; multi: boolean }): Promise<{ success: boolean; filePaths: string[]; error?: string }> =>
    ipcRenderer.invoke('selectFiles', args),

  getDefaultRuleFilePath: (args: { folderPath: string; ruleType: 'copyignore' | 'copyinclude' }): Promise<{ filePath: string }> =>
    ipcRenderer.invoke('getDefaultRuleFilePath', args),

  openRuleFileDialog: (): Promise<any> =>
    ipcRenderer.invoke('openRuleFileDialog'),

  showSaveRuleFileDialog: (args: { ruleType: 'copyignore' | 'copyinclude'; defaultDir?: string }): Promise<{ filePath: string | null }> =>
    ipcRenderer.invoke('showSaveRuleFileDialog', args),

  checkRuleFileSave: (args: { targetPath: string; ruleType: 'copyignore' | 'copyinclude' }): Promise<any> =>
    ipcRenderer.invoke('checkRuleFileSave', args),

  writeRuleFile: (args: { targetPath: string; ruleType: 'copyignore' | 'copyinclude'; content: string; overwriteExisting: boolean; allowConflict: boolean }): Promise<any> =>
    ipcRenderer.invoke('writeRuleFile', args),

  hasOpenAIApiKey: (): Promise<{ hasKey: boolean }> =>
    ipcRenderer.invoke('hasOpenAIApiKey'),

  setOpenAIApiKey: (args: { apiKey: string }): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('setOpenAIApiKey', args),

  clearOpenAIApiKey: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('clearOpenAIApiKey'),

  getRobocopyThreads: (): Promise<{ threads: number; error?: string }> =>
    ipcRenderer.invoke('getRobocopyThreads'),

  setRobocopyThreads: (args: { threads: number }): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('setRobocopyThreads', args),

  getScannerThreads: (): Promise<{ threads: number; error?: string }> =>
    ipcRenderer.invoke('getScannerThreads'),

  setScannerThreads: (args: { threads: number }): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('setScannerThreads', args),

  getLastUsedPaths: (): Promise<{ source?: string; dest?: string; error?: string }> =>
    ipcRenderer.invoke('getLastUsedPaths'),

  setLastUsedPaths: (args: { source?: string; dest?: string }): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('setLastUsedPaths', args),

  generateRulesWithOpenAI: (args: { model: string; ruleType: 'copyignore' | 'copyinclude'; instruction: string; currentText: string; filePaths: string[]; includeFileContents: boolean; folderStructure?: string }): Promise<any> =>
    ipcRenderer.invoke('generateRulesWithOpenAI', args),

  scanFolderForAI: (args: { folderPath: string; recursive: boolean }): Promise<any> =>
    ipcRenderer.invoke('scanFolderForAI', args),
  
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

  // Menu action listener
  onMenuAction: (listener: (data: { action: string; message?: string }) => void) => {
    ipcRenderer.on('menu-action', (_event, data) => listener(data));
    return () => ipcRenderer.removeListener('menu-action', listener);
  },
});
