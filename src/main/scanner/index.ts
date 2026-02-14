/**
 * Filesystem scanning pipeline.
 *
 * Walks the source directory tree, discovers all rule files, detects conflicts,
 * and builds a cached scan result for subsequent lazy tree operations.
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  TreeNode,
  NodeState,
  RuleMode,
  RuleFileRecord,
  RuleContext,
} from '../rules/types';
import {
  findRuleFilesInDir,
  detectConflicts,
  createRootContext,
  deriveChildContext,
} from '../rules';
import { ScanResult, ScanStats, ScanArgs, ScanResponse } from './types';

// Global cache of scan results keyed by scanId
const scanCache = new Map<string, ScanResult>();

/**
 * Get a cached scan result by scanId.
 */
export function getCachedScan(scanId: string): ScanResult | undefined {
  return scanCache.get(scanId);
}

/**
 * Main scan function. Walks the source directory tree, discovers all rule files,
 * detects conflicts, and returns a scan result with a root node and statistics.
 *
 * @param args - Source, destination, and rootOnly flag
 * @returns ScanResponse with scanId, conflicts, rootNode, and stats
 */
export async function scan(args: ScanArgs): Promise<ScanResponse> {
  const { source, dest, rootOnly } = args;
  const scanId = uuidv4();

  // Initialize stats
  const stats: ScanStats = {
    directoriesScanned: 0,
    ruleFilesFound: 0,
    conflictsFound: 0,
  };

  // Detect conflicts across the entire tree
  const conflicts = await detectConflicts(source);
  stats.conflictsFound = conflicts.length;

  // Build rule file index by directory path
  const ruleFilesByDir = new Map<string, RuleFileRecord[]>();
  const contextCache = new Map<string, RuleContext>();

  // Walk the tree and discover all rule files
  await walkAndIndex(source, ruleFilesByDir, stats, rootOnly);

  // Build the root node
  const rootNode = await buildRootNode(
    source,
    ruleFilesByDir,
    contextCache,
    rootOnly
  );

  // Cache the scan result
  const scanResult: ScanResult = {
    scanId,
    sourceRoot: source,
    destRoot: dest,
    rootOnly,
    conflicts,
    rootNode,
    stats,
    ruleFilesByDir,
    contextCache,
  };

  scanCache.set(scanId, scanResult);

  // Return response
  return {
    scanId,
    conflicts,
    rootNode,
    stats,
  };
}

/**
 * Walks the directory tree and indexes all rule files by directory path.
 */
async function walkAndIndex(
  dirPath: string,
  ruleFilesByDir: Map<string, RuleFileRecord[]>,
  stats: ScanStats,
  rootOnly: boolean,
  depth: number = 0
): Promise<void> {
  stats.directoriesScanned++;

  // Find rule files in this directory (only at root if rootOnly is true)
  if (depth === 0 || !rootOnly) {
    const ruleFiles = await findRuleFilesInDir(dirPath);
    if (ruleFiles.length > 0) {
      ruleFilesByDir.set(dirPath, ruleFiles);
      stats.ruleFilesFound += ruleFiles.length;
    }
  }

  // Recurse into subdirectories
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const childPath = path.join(dirPath, entry.name);
        await walkAndIndex(childPath, ruleFilesByDir, stats, rootOnly, depth + 1);
      }
    }
  } catch {
    // Skip unreadable directories
  }
}

/**
 * Builds the root TreeNode for the scan result.
 */
async function buildRootNode(
  rootPath: string,
  ruleFilesByDir: Map<string, RuleFileRecord[]>,
  contextCache: Map<string, RuleContext>,
  rootOnly: boolean
): Promise<TreeNode> {
  const rootContext = createRootContext();
  const ruleFiles = ruleFilesByDir.get(rootPath) || [];
  const context = deriveChildContext(rootContext, ruleFiles);
  contextCache.set(rootPath, context);

  // Check if root has children
  let hasChildren = false;
  try {
    const entries = await fs.readdir(rootPath, { withFileTypes: true });
    hasChildren = entries.some((e) => e.isDirectory());
  } catch {
    // Ignore
  }

  return {
    path: rootPath,
    name: path.basename(rootPath),
    isDir: true,
    state: NodeState.INCLUDED, // Root is always included
    hasChildren,
    modeAtPath: context.mode,
  };
}

/**
 * Clear the scan cache (useful for testing).
 */
export function clearScanCache(): void {
  scanCache.clear();
}
