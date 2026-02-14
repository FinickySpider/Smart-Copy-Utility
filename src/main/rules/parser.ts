/**
 * Rule file parser — reads .copyignore and .copyinclude files
 * and produces structured RuleFileRecord objects.
 *
 * Handles:
 * - Blank line skipping
 * - Comment lines (starting with #)
 * - Case-insensitive file name detection
 * - Graceful handling of missing/unreadable files
 */

import fs from 'fs/promises';
import path from 'path';
import {
  RuleType,
  RuleFileRecord,
  PatternEntry,
  COPYIGNORE_NAME,
  COPYINCLUDE_NAME,
} from './types';

/**
 * Determines the rule type based on the file name (case-insensitive).
 * Returns null if the file name is not a recognized rule file.
 */
export function getRuleTypeFromFileName(fileName: string): RuleType | null {
  const lower = fileName.toLowerCase();
  if (lower === COPYIGNORE_NAME) return RuleType.IGNORE_FILE;
  if (lower === COPYINCLUDE_NAME) return RuleType.INCLUDE_FILE;
  return null;
}

/**
 * Parses the raw content of a rule file into PatternEntry objects.
 * Skips blank lines and comment lines (starting with #).
 */
export function parseRuleContent(
  content: string,
  ruleFilePath: string
): PatternEntry[] {
  const lines = content.split(/\r?\n/);
  const patterns: PatternEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip blank lines
    if (line === '') continue;

    // Skip comment lines
    if (line.startsWith('#')) continue;

    patterns.push({
      patternText: line,
      lineNumber: i + 1, // 1-based
      ruleFilePath,
    });
  }

  return patterns;
}

/**
 * Reads and parses a rule file at the given absolute path.
 * Returns null if the file doesn't exist or can't be read.
 */
export async function parseRuleFile(
  filePath: string
): Promise<RuleFileRecord | null> {
  const fileName = path.basename(filePath);
  const ruleType = getRuleTypeFromFileName(fileName);

  if (ruleType === null) {
    return null;
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const patterns = parseRuleContent(content, filePath);

    return {
      path: filePath,
      type: ruleType,
      lines: patterns,
    };
  } catch {
    // File doesn't exist or can't be read — return null gracefully
    return null;
  }
}

/**
 * Scans a directory for rule files (.copyignore / .copyinclude).
 * Returns an array of found rule file records (0, 1, or 2 if conflict).
 * File name matching is case-insensitive.
 */
export async function findRuleFilesInDir(
  dirPath: string
): Promise<RuleFileRecord[]> {
  const results: RuleFileRecord[] = [];

  try {
    const entries = await fs.readdir(dirPath);

    for (const entry of entries) {
      const ruleType = getRuleTypeFromFileName(entry);
      if (ruleType !== null) {
        const fullPath = path.join(dirPath, entry);
        const record = await parseRuleFile(fullPath);
        if (record) {
          results.push(record);
        }
      }
    }
  } catch {
    // Directory unreadable — return empty
  }

  return results;
}
