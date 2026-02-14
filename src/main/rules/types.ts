/**
 * Core types for the Smart Copy Utility rule engine.
 *
 * These types define the data model for rule files, patterns, contexts,
 * and tree nodes as described in the design document.
 */

// ── Rule File Types ──────────────────────────────────────────────────

/** The type of rule file found in a directory. */
export enum RuleType {
  IGNORE_FILE = 'IGNORE_FILE',
  INCLUDE_FILE = 'INCLUDE_FILE',
}

/** A single pattern line parsed from a rule file. */
export interface PatternEntry {
  /** The raw pattern text (e.g., "node_modules/", "*.log", "src/main.ts") */
  patternText: string;
  /** 1-based line number in the rule file */
  lineNumber: number;
  /** Absolute path to the rule file this pattern came from */
  ruleFilePath: string;
}

/** A parsed rule file record. */
export interface RuleFileRecord {
  /** Absolute path to the rule file */
  path: string;
  /** Whether this is a .copyignore or .copyinclude file */
  type: RuleType;
  /** Parsed pattern entries (comments and blanks stripped) */
  lines: PatternEntry[];
}

// ── Rule File Constants ──────────────────────────────────────────────

/** Recognized rule file names (case-insensitive matching on Windows). */
export const COPYIGNORE_NAME = '.copyignore';
export const COPYINCLUDE_NAME = '.copyinclude';

// ── Mode & Context ───────────────────────────────────────────────────

/** The active filtering mode at a given directory path. */
export enum RuleMode {
  /** No rule files encountered on the path from root to here. */
  NONE = 'NONE',
  /** Blacklist mode: exclude anything matching patterns. */
  IGNORE = 'IGNORE',
  /** Whitelist mode: include only things matching patterns. */
  INCLUDE = 'INCLUDE',
}

/** The evaluated context at a directory during traversal. */
export interface RuleContext {
  /** Current filtering mode */
  mode: RuleMode;
  /** Effective pattern entries (stacked or reset) */
  patterns: PatternEntry[];
  /** Chain of rule file paths contributing to this context (for explain) */
  ruleChain: string[];
}

// ── Tree Node ────────────────────────────────────────────────────────

/** Possible states for a tree node in the preview. */
export enum NodeState {
  INCLUDED = 'INCLUDED',
  EXCLUDED = 'EXCLUDED',
  CONFLICT = 'CONFLICT',
  UNKNOWN = 'UNKNOWN',
}

/** A node in the preview tree. */
export interface TreeNode {
  /** Absolute path */
  path: string;
  /** Display name (basename) */
  name: string;
  /** True if this is a directory */
  isDir: boolean;
  /** Current include/exclude state */
  state: NodeState;
  /** Whether this directory has children (always false for files) */
  hasChildren: boolean;
  /** The active rule mode at this path */
  modeAtPath: RuleMode;
}

// ── Match Result ─────────────────────────────────────────────────────

/** Result of matching a path against a set of patterns. */
export interface MatchResult {
  /** Whether at least one pattern matched */
  matched: boolean;
  /** All patterns that matched (for explainability) */
  matchingPatterns: PatternEntry[];
}
