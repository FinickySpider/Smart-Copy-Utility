/**
 * Type declarations for the Electron API exposed via contextBridge.
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

export interface ElectronAPI {
  selectFolder: (args: { kind: string }) => Promise<{ path: string | null }>;
  selectDirectory: (args: { title: string }) => Promise<{ path: string | null }>;
  selectFiles: (args: { title: string; multi: boolean }) => Promise<{ success: boolean; filePaths: string[]; error?: string }>;
  getDefaultRuleFilePath: (args: { folderPath: string; ruleType: 'copyignore' | 'copyinclude' }) => Promise<{ filePath: string }>;
  openRuleFileDialog: () => Promise<{ success: boolean; filePath?: string; ruleType?: 'copyignore' | 'copyinclude'; content?: string; error?: string }>;
  showSaveRuleFileDialog: (args: { ruleType: 'copyignore' | 'copyinclude'; defaultDir?: string }) => Promise<{ filePath: string | null }>;
  checkRuleFileSave: (args: { targetPath: string; ruleType: 'copyignore' | 'copyinclude' }) => Promise<{ success: boolean; targetExists?: boolean; otherTypeExists?: boolean; otherTypePath?: string | null; error?: string }>;
  writeRuleFile: (args: { targetPath: string; ruleType: 'copyignore' | 'copyinclude'; content: string; overwriteExisting: boolean; allowConflict: boolean }) => Promise<{ success: boolean; error?: string }>;
  hasOpenAIApiKey: () => Promise<{ hasKey: boolean }>;
  setOpenAIApiKey: (args: { apiKey: string }) => Promise<{ success: boolean; error?: string }>;
  clearOpenAIApiKey: () => Promise<{ success: boolean; error?: string }>;
  generateRulesWithOpenAI: (args: { model: string; ruleType: 'copyignore' | 'copyinclude'; instruction: string; currentText: string; filePaths: string[]; includeFileContents: boolean; folderStructure?: string }) => Promise<{ success: boolean; generatedText?: string; error?: string }>;
  scanFolderForAI: (args: { folderPath: string; recursive: boolean }) => Promise<{ success: boolean; formatted?: string; error?: string }>;
  scan: (args: ScanArgs) => Promise<ScanResponse>;
  listChildren: (args: ListChildrenArgs) => Promise<ListChildrenResponse>;
  explain: (args: ExplainArgs) => Promise<ExplainResponse>;
  openInExplorer: (args: { dirPath: string }) => Promise<{ success: boolean }>;
  copyToClipboard: (args: { text: string }) => Promise<{ success: boolean }>;
  dryRun: (args: JobPlanOptions) => Promise<DryRunResponse>;
  copy: (args: JobPlanOptions) => Promise<CopyResponse>;
  cancel: () => Promise<CancelResponse>;
  onCopyStatus: (listener: CopyEventListener) => () => void;
  onCopyJobStart: (listener: CopyEventListener) => () => void;
  onCopyJobEnd: (listener: CopyEventListener) => () => void;
  onCopyLogLine: (listener: CopyEventListener) => () => void;
  onCopyDone: (listener: CopyEventListener) => () => void;
  onCopyError: (listener: CopyEventListener) => () => void;
  onMenuAction: (listener: (data: { action: string; message?: string }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
