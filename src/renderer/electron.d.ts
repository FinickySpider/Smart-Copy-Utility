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

export interface ElectronAPI {
  selectFolder: (args: { kind: string }) => Promise<{ path: string | null }>;
  scan: (args: ScanArgs) => Promise<ScanResponse>;
  listChildren: (args: ListChildrenArgs) => Promise<ListChildrenResponse>;
  explain: (args: ExplainArgs) => Promise<ExplainResponse>;
  openInExplorer: (args: { dirPath: string }) => Promise<{ success: boolean }>;
  copyToClipboard: (args: { text: string }) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
