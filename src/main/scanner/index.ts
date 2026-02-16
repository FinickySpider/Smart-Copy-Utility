/**
 * Filesystem scanning pipeline.
 *
 * Walks the source directory tree, discovers all rule files, detects conflicts,
 * and builds a cached scan result for subsequent lazy tree operations.
 */

import fs from 'fs/promises';
import path from 'path';
import { Worker } from 'worker_threads';
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
import { getScannerThreads } from '../settings';

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

  // Get scanner thread count from settings
  const scannerThreads = await getScannerThreads();

  // Walk the tree and discover all rule files (using parallel workers)
  await walkAndIndexParallel(source, ruleFilesByDir, stats, rootOnly, scannerThreads);

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
 * Walks the directory tree in parallel using worker threads.
 * Partitions the root directory's immediate children among workers.
 */
async function walkAndIndexParallel(
  dirPath: string,
  ruleFilesByDir: Map<string, RuleFileRecord[]>,
  stats: ScanStats,
  rootOnly: boolean,
  maxWorkers: number
): Promise<void> {
  // Scan root directory first (synchronously)
  stats.directoriesScanned++;
  const rootRuleFiles = await findRuleFilesInDir(dirPath);
  if (rootRuleFiles.length > 0) {
    ruleFilesByDir.set(dirPath, rootRuleFiles);
    stats.ruleFilesFound += rootRuleFiles.length;
  }

  // Get immediate subdirectories
  let subdirs: string[] = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    subdirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => path.join(dirPath, e.name));
  } catch {
    // No subdirectories or unreadable
    return;
  }

  if (subdirs.length === 0) {
    return;
  }

  // If only one subdir or in test mode, fall back to sequential
  if (subdirs.length === 1 || process.env.NODE_ENV === 'test' || process.env.VITEST) {
    for (const subdir of subdirs) {
      await walkAndIndexSequential(subdir, ruleFilesByDir, stats, rootOnly, 1);
    }
    return;
  }

  // Process subdirectories in batches using worker pool
  const workerPath = path.join(__dirname, 'scanner-worker.js');
  const batchSize = maxWorkers;

  for (let i = 0; i < subdirs.length; i += batchSize) {
    const batch = subdirs.slice(i, i + batchSize);
    const promises = batch.map((subtreePath) => runWorker(workerPath, subtreePath, rootOnly));
    const results = await Promise.all(promises);

    // Merge results
    for (const result of results) {
      if (result.error) {
        // Log error but continue (partial scan is better than nothing)
        console.error(`Scanner worker error for ${result.subtreePath}: ${result.error}`);
        continue;
      }

      for (const [dirPathKey, ruleFiles] of result.ruleFilesByDir) {
        ruleFilesByDir.set(dirPathKey, ruleFiles);
      }
      stats.directoriesScanned += result.directoriesScanned;
      stats.ruleFilesFound += result.ruleFilesFound;
    }
  }
}

/**
 * Run a single worker thread to scan a subtree.
 */
function runWorker(
  workerPath: string,
  subtreePath: string,
  rootOnly: boolean
): Promise<{
  subtreePath: string;
  ruleFilesByDir: [string, RuleFileRecord[]][];
  directoriesScanned: number;
  ruleFilesFound: number;
  error?: string;
}> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: { subtreePath, rootOnly },
    });

    worker.on('message', (message: any) => {
      resolve({ ...message, subtreePath });
    });

    worker.on('error', (error) => {
      resolve({
        subtreePath,
        ruleFilesByDir: [],
        directoriesScanned: 0,
        ruleFilesFound: 0,
        error: error.message,
      });
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        resolve({
          subtreePath,
          ruleFilesByDir: [],
          directoriesScanned: 0,
          ruleFilesFound: 0,
          error: `Worker stopped with exit code ${code}`,
        });
      }
    });
  });
}

/**
 * Walks the directory tree sequentially (fallback or small trees).
 */
async function walkAndIndexSequential(
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
        await walkAndIndexSequential(childPath, ruleFilesByDir, stats, rootOnly, depth + 1);
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
