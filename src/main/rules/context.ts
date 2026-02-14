/**
 * Context management and mode traversal system.
 *
 * Maintains a stack-based context during directory tree traversal.
 * Implements:
 * - NONE → IGNORE/INCLUDE: reset to new mode's patterns
 * - Same-mode stacking: append patterns from child rule file
 * - Mode switch reset: replace patterns entirely on mode change
 * - Push/pop for sibling isolation (no leakage)
 * - Memoization of computed contexts by directory path
 */

import path from 'path';
import { RuleMode, RuleContext, RuleType, RuleFileRecord } from './types';
import { findRuleFilesInDir } from './parser';

/** Creates the initial root context (NONE mode, no patterns). */
export function createRootContext(): RuleContext {
  return {
    mode: RuleMode.NONE,
    patterns: [],
    ruleChain: [],
  };
}

/**
 * Derives a new context for a child directory based on the parent context
 * and any rule files found in the child directory.
 *
 * Stacking/reset rules:
 * - If child has .copyignore:
 *   - Parent IGNORE → stack (parent patterns + child patterns)
 *   - Parent INCLUDE or NONE → reset (child patterns only)
 *   - Mode becomes IGNORE
 * - If child has .copyinclude:
 *   - Parent INCLUDE → stack (parent patterns + child patterns)
 *   - Parent IGNORE or NONE → reset (child patterns only)
 *   - Mode becomes INCLUDE
 * - If child has no rule file:
 *   - Inherit parent context unchanged
 *
 * @param parentContext - The parent directory's context
 * @param ruleFiles - Rule files found in the child directory (0 or 1; 2 = conflict handled elsewhere)
 * @returns The new context for the child directory
 */
export function deriveChildContext(
  parentContext: RuleContext,
  ruleFiles: RuleFileRecord[]
): RuleContext {
  // No rule files → inherit parent unchanged
  if (ruleFiles.length === 0) {
    return { ...parentContext };
  }

  // Use the first non-conflict rule file (conflicts are detected separately)
  // If there are 2 files (conflict), we still derive from the first one found,
  // but conflict detection will block operations.
  const ruleFile = ruleFiles[0];

  if (ruleFile.type === RuleType.IGNORE_FILE) {
    // .copyignore found
    if (parentContext.mode === RuleMode.IGNORE) {
      // Stack: parent patterns + new patterns
      return {
        mode: RuleMode.IGNORE,
        patterns: [...parentContext.patterns, ...ruleFile.lines],
        ruleChain: [...parentContext.ruleChain, ruleFile.path],
      };
    } else {
      // Reset: new patterns only (from INCLUDE or NONE)
      return {
        mode: RuleMode.IGNORE,
        patterns: [...ruleFile.lines],
        ruleChain: [ruleFile.path],
      };
    }
  } else {
    // .copyinclude found
    if (parentContext.mode === RuleMode.INCLUDE) {
      // Stack: parent patterns + new patterns
      return {
        mode: RuleMode.INCLUDE,
        patterns: [...parentContext.patterns, ...ruleFile.lines],
        ruleChain: [...parentContext.ruleChain, ruleFile.path],
      };
    } else {
      // Reset: new patterns only (from IGNORE or NONE)
      return {
        mode: RuleMode.INCLUDE,
        patterns: [...ruleFile.lines],
        ruleChain: [ruleFile.path],
      };
    }
  }
}

/**
 * ContextTraverser manages context state during filesystem traversal.
 * Uses a stack to ensure sibling directories don't leak context.
 * Memoizes computed contexts by directory path.
 */
export class ContextTraverser {
  private contextStack: RuleContext[] = [];
  private contextCache: Map<string, RuleContext> = new Map();

  constructor() {
    // Start with root context on the stack
    this.contextStack.push(createRootContext());
  }

  /** Returns the current (top of stack) context. */
  currentContext(): RuleContext {
    return this.contextStack[this.contextStack.length - 1];
  }

  /**
   * Enter a child directory. Computes or retrieves the context for this
   * directory, pushes it onto the stack.
   *
   * @param dirPath - Absolute path of the directory being entered
   * @param ruleFiles - Rule files found in this directory
   * @returns The computed context for this directory
   */
  enterDirectory(dirPath: string, ruleFiles: RuleFileRecord[]): RuleContext {
    // Check cache first
    const cached = this.contextCache.get(dirPath);
    if (cached) {
      this.contextStack.push(cached);
      return cached;
    }

    const parentContext = this.currentContext();
    const childContext = deriveChildContext(parentContext, ruleFiles);

    // Cache and push
    this.contextCache.set(dirPath, childContext);
    this.contextStack.push(childContext);

    return childContext;
  }

  /**
   * Leave the current directory. Pops the context stack, reverting to
   * the parent's context. Ensures no sibling leakage.
   */
  leaveDirectory(): void {
    if (this.contextStack.length > 1) {
      this.contextStack.pop();
    }
  }

  /**
   * Compute the context for a given directory path without modifying the stack.
   * Useful for lazy evaluation of individual nodes.
   *
   * @param dirPath - Absolute path
   * @param ruleFiles - Rule files in this directory
   * @param parentContext - The parent directory's context
   * @returns The context for this directory
   */
  computeContext(
    dirPath: string,
    ruleFiles: RuleFileRecord[],
    parentContext: RuleContext
  ): RuleContext {
    const cached = this.contextCache.get(dirPath);
    if (cached) return cached;

    const context = deriveChildContext(parentContext, ruleFiles);
    this.contextCache.set(dirPath, context);
    return context;
  }

  /** Get a cached context for a directory path, if available. */
  getCachedContext(dirPath: string): RuleContext | undefined {
    return this.contextCache.get(dirPath);
  }

  /** Reset the traverser to initial state. */
  reset(): void {
    this.contextStack = [createRootContext()];
    this.contextCache.clear();
  }
}

/**
 * Convenience function: computes the context for a directory given its
 * parent context and the directory contents. Useful for testing and
 * one-off evaluations.
 */
export async function computeContextForDir(
  dirPath: string,
  parentContext: RuleContext
): Promise<RuleContext> {
  const ruleFiles = await findRuleFilesInDir(dirPath);
  return deriveChildContext(parentContext, ruleFiles);
}
