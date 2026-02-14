/**
 * Scanner types — data structures for scan results, caching, and tree operations.
 */

import { TreeNode, RuleFileRecord, RuleContext } from '../rules/types';

/** Statistics collected during a scan. */
export interface ScanStats {
  /** Number of directories scanned */
  directoriesScanned: number;
  /** Number of rule files found */
  ruleFilesFound: number;
  /** Number of conflicts detected */
  conflictsFound: number;
}

/** Result of a filesystem scan operation. */
export interface ScanResult {
  /** Unique identifier for this scan */
  scanId: string;
  /** Absolute path to source root */
  sourceRoot: string;
  /** Absolute path to destination root */
  destRoot: string;
  /** Whether rootOnly mode is enabled (ignore nested rule files) */
  rootOnly: boolean;
  /** Array of directory paths with conflicts (both .copyignore and .copyinclude) */
  conflicts: string[];
  /** Root tree node */
  rootNode: TreeNode;
  /** Scan statistics */
  stats: ScanStats;
  /** Internal: rule files indexed by directory path */
  ruleFilesByDir: Map<string, RuleFileRecord[]>;
  /** Internal: memoized contexts by directory path */
  contextCache: Map<string, RuleContext>;
}

/** Arguments for the scan IPC command. */
export interface ScanArgs {
  source: string;
  dest: string;
  rootOnly: boolean;
}

/** Response from the scan IPC command. */
export interface ScanResponse {
  scanId: string;
  conflicts: string[];
  rootNode: TreeNode;
  stats: ScanStats;
}
