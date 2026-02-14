/**
 * Conflict detection — finds directories that contain both
 * .copyignore and .copyinclude files (fatal conflicts).
 *
 * Scans the entire tree and collects ALL conflicts (does not stop at first).
 */

import fs from 'fs/promises';
import path from 'path';
import { COPYIGNORE_NAME, COPYINCLUDE_NAME } from './types';

/**
 * Checks if a single directory contains both .copyignore and .copyinclude
 * (case-insensitive file name matching).
 *
 * @param dirPath - Absolute path to the directory
 * @returns true if both rule files are present (conflict)
 */
export async function hasConflict(dirPath: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dirPath);
    const lowerEntries = entries.map((e) => e.toLowerCase());
    return (
      lowerEntries.includes(COPYIGNORE_NAME) &&
      lowerEntries.includes(COPYINCLUDE_NAME)
    );
  } catch {
    return false;
  }
}

/**
 * Recursively scans a directory tree and collects all directories
 * that contain both .copyignore and .copyinclude files.
 *
 * Collects ALL conflicts across the entire tree (does not stop at first).
 *
 * @param rootPath - Absolute path to the root directory to scan
 * @returns Array of absolute directory paths that have conflicts
 */
export async function detectConflicts(rootPath: string): Promise<string[]> {
  const conflicts: string[] = [];

  async function walk(dirPath: string): Promise<void> {
    // Check this directory for conflict
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const lowerNames = entries.map((e) => e.name.toLowerCase());

      if (
        lowerNames.includes(COPYIGNORE_NAME) &&
        lowerNames.includes(COPYINCLUDE_NAME)
      ) {
        conflicts.push(dirPath);
      }

      // Recurse into subdirectories
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await walk(path.join(dirPath, entry.name));
        }
      }
    } catch {
      // Skip unreadable directories
    }
  }

  await walk(rootPath);
  return conflicts;
}
