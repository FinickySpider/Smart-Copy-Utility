/**
 * Pattern matching engine — evaluates whether a given file or directory path
 * matches a set of patterns from rule files.
 *
 * Supported pattern types:
 * - `name/`       — matches directories with that name at any depth
 * - `*.ext`       — matches files by extension (simple glob)
 * - `foo/bar.txt` — matches relative path segments from rule file directory
 *
 * All matching is case-insensitive on Windows.
 * Returns all matching patterns (not just first) for explainability.
 */

import path from 'path';
import { PatternEntry, MatchResult } from './types';

/**
 * Normalizes a path to use backslashes and lowercase for consistent matching.
 */
function normalizePath(p: string): string {
  return p.replace(/\//g, '\\').toLowerCase();
}

/**
 * Classifies a pattern into one of three types.
 */
function classifyPattern(patternText: string): 'dir' | 'glob' | 'relative' {
  // Directory name pattern: ends with /
  if (patternText.endsWith('/')) return 'dir';

  // Glob pattern: starts with * or contains * in the filename portion
  // e.g., *.log, *.txt, *.min.js
  if (patternText.startsWith('*') || patternText.startsWith('?')) return 'glob';

  // Check if it's a simple glob like *.ext (no path separators)
  const hasPathSep = patternText.includes('/') || patternText.includes('\\');
  if (!hasPathSep && patternText.includes('*')) return 'glob';

  // Relative path pattern
  if (hasPathSep) return 'relative';

  // Simple filename or glob (e.g., "*.log" or "README.md")
  if (patternText.includes('*') || patternText.includes('?')) return 'glob';

  // Exact filename match — treat as relative path
  return 'relative';
}

/**
 * Tests if a simple glob pattern (like *.ext) matches a file name.
 * Supports:
 * - `*` matches any sequence of characters (no path separator)
 * - `?` matches any single character
 */
function matchGlob(pattern: string, fileName: string): boolean {
  // Convert glob to regex
  let regex = '^';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    switch (c) {
      case '*':
        regex += '[^\\\\]*';
        break;
      case '?':
        regex += '[^\\\\]';
        break;
      case '.':
        regex += '\\.';
        break;
      default:
        regex += c;
    }
  }
  regex += '$';

  return new RegExp(regex, 'i').test(fileName);
}

/**
 * Matches a single pattern against a target path.
 *
 * @param patternText - The pattern text to match
 * @param targetPath - The absolute path of the file/directory being tested
 * @param isDir - Whether the target is a directory
 * @param ruleFileDir - The directory containing the rule file (for relative path resolution)
 * @returns true if the pattern matches
 */
export function matchPattern(
  patternText: string,
  targetPath: string,
  isDir: boolean,
  ruleFileDir: string
): boolean {
  const kind = classifyPattern(patternText);
  const normalizedTarget = normalizePath(targetPath);

  switch (kind) {
    case 'dir': {
      // Directory name pattern: "name/" matches any directory with that name
      // at any depth beneath the rule file directory.
      if (!isDir) {
        // Also match if the target file is *inside* a directory with that name
        const dirName = normalizePath(patternText.slice(0, -1)); // remove trailing /
        const segments = normalizedTarget.split('\\');
        const ruleSegments = normalizePath(ruleFileDir).split('\\');

        // Only match segments beneath the rule file directory
        for (let i = ruleSegments.length; i < segments.length; i++) {
          if (segments[i] === dirName) return true;
        }
        return false;
      }

      // For directories: check if the directory name matches
      const dirName = normalizePath(patternText.slice(0, -1));
      const targetName = path.basename(normalizedTarget);

      if (targetName === dirName) {
        // Verify target is at or beneath rule file directory
        const normalizedRuleDir = normalizePath(ruleFileDir);
        return normalizedTarget.startsWith(normalizedRuleDir);
      }
      return false;
    }

    case 'glob': {
      // Glob pattern: match against the file/directory name only
      const targetName = path.basename(targetPath);
      return matchGlob(patternText, targetName);
    }

    case 'relative': {
      // Relative path: compare against relative path from rule file directory
      const normalizedRuleDir = normalizePath(ruleFileDir);
      const normalizedPattern = normalizePath(patternText);

      // Build the expected absolute path
      const expectedPath = normalizedRuleDir + '\\' + normalizedPattern;

      // Exact match
      if (normalizedTarget === expectedPath) return true;

      // Also check as a prefix (for dirs specified without trailing slash)
      if (!patternText.includes('*') && !patternText.includes('?')) {
        // Check if target is under the specified relative path
        if (normalizedTarget.startsWith(expectedPath + '\\')) return true;
      }

      return false;
    }
  }
}

/**
 * Matches a target path against an array of patterns.
 * Returns all matching patterns for explainability.
 *
 * @param patterns - Array of pattern entries to test
 * @param targetPath - Absolute path of the file/directory being tested
 * @param isDir - Whether the target is a directory
 * @param ruleFileDir - The directory containing the rule file
 * @returns MatchResult with `matched` boolean and `matchingPatterns` array
 */
export function matchPatterns(
  patterns: PatternEntry[],
  targetPath: string,
  isDir: boolean,
  ruleFileDir: string
): MatchResult {
  const matchingPatterns: PatternEntry[] = [];

  for (const pattern of patterns) {
    // Each pattern may come from a different rule file, so resolve the
    // rule file directory per-pattern.
    const patternRuleDir = path.dirname(pattern.ruleFilePath);
    if (matchPattern(pattern.patternText, targetPath, isDir, patternRuleDir)) {
      matchingPatterns.push(pattern);
    }
  }

  return {
    matched: matchingPatterns.length > 0,
    matchingPatterns,
  };
}
