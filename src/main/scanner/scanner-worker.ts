/**
 * Worker thread for parallel directory scanning.
 * 
 * Each worker scans a subtree independently and returns indexed rule files and stats.
 */

import { parentPort, workerData } from 'worker_threads';
import fs from 'fs/promises';
import path from 'path';
import { RuleFileRecord } from '../rules/types';
import { findRuleFilesInDir } from '../rules';

/** Message sent from main thread to worker */
interface WorkerInput {
  /** Subtree root path to scan */
  subtreePath: string;
  /** Whether to only scan root directory (ignore nested rule files) */
  rootOnly: boolean;
}

/** Message sent from worker to main thread */
interface WorkerOutput {
  /** Map of directory paths to rule files found */
  ruleFilesByDir: Map<string, RuleFileRecord[]>;
  /** Number of directories scanned */
  directoriesScanned: number;
  /** Number of rule files found */
  ruleFilesFound: number;
  /** Error message if scan failed */
  error?: string;
}

/**
 * Recursively scan a directory subtree and index rule files.
 */
async function scanSubtree(
  dirPath: string,
  ruleFilesByDir: Map<string, RuleFileRecord[]>,
  rootOnly: boolean,
  depth: number = 0
): Promise<{ directoriesScanned: number; ruleFilesFound: number }> {
  let directoriesScanned = 1; // Count this directory
  let ruleFilesFound = 0;

  // Find rule files in this directory (only at root if rootOnly is true)
  if (depth === 0 || !rootOnly) {
    try {
      const ruleFiles = await findRuleFilesInDir(dirPath);
      if (ruleFiles.length > 0) {
        ruleFilesByDir.set(dirPath, ruleFiles);
        ruleFilesFound += ruleFiles.length;
      }
    } catch {
      // Skip unreadable directories
    }
  }

  // Recurse into subdirectories
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const childPath = path.join(dirPath, entry.name);
        const childStats = await scanSubtree(childPath, ruleFilesByDir, rootOnly, depth + 1);
        directoriesScanned += childStats.directoriesScanned;
        ruleFilesFound += childStats.ruleFilesFound;
      }
    }
  } catch {
    // Skip unreadable directories
  }

  return { directoriesScanned, ruleFilesFound };
}

/**
 * Main worker entry point.
 */
async function main() {
  if (!parentPort) {
    throw new Error('This script must be run as a worker thread');
  }

  const input = workerData as WorkerInput;
  const { subtreePath, rootOnly } = input;

  try {
    const ruleFilesByDir = new Map<string, RuleFileRecord[]>();
    const stats = await scanSubtree(subtreePath, ruleFilesByDir, rootOnly);

    const output: WorkerOutput = {
      ruleFilesByDir,
      directoriesScanned: stats.directoriesScanned,
      ruleFilesFound: stats.ruleFilesFound,
    };

    // Convert Map to array of entries for serialization
    const serializedOutput = {
      ruleFilesByDir: Array.from(ruleFilesByDir.entries()),
      directoriesScanned: stats.directoriesScanned,
      ruleFilesFound: stats.ruleFilesFound,
    };

    parentPort.postMessage(serializedOutput);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    parentPort.postMessage({ error: errorMsg });
  }
}

main();
