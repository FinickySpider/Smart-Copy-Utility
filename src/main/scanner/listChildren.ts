/**
 * List children operation — evaluates and returns child nodes for a directory
 * in the preview tree.
 */

import fs from 'fs/promises';
import path from 'path';
import {
  TreeNode,
  NodeState,
  RuleMode,
  RuleFileRecord,
  RuleContext,
} from '../rules/types';
import { deriveChildContext, matchPatterns } from '../rules';
import { getCachedScan } from './index';

/** Arguments for the listChildren IPC command. */
export interface ListChildrenArgs {
  scanId: string;
  dirPath: string;
}

/** Response from the listChildren IPC command. */
export interface ListChildrenResponse {
  children: TreeNode[];
}

/**
 * Evaluates node state based on context and pattern matching.
 */
function evaluateNodeState(
  nodePath: string,
  isDir: boolean,
  context: RuleContext,
  conflicts: string[]
): NodeState {
  // Check for conflict first
  if (isDir && conflicts.includes(nodePath)) {
    return NodeState.CONFLICT;
  }

  // NONE mode: everything is included
  if (context.mode === RuleMode.NONE) {
    return NodeState.INCLUDED;
  }

  // Get the rule file directory for pattern matching (use the dir of the first rule in chain)
  const ruleFileDir =
    context.ruleChain.length > 0
      ? path.dirname(context.ruleChain[0])
      : path.dirname(nodePath);

  // Match against patterns
  const matchResult = matchPatterns(
    context.patterns,
    nodePath,
    isDir,
    ruleFileDir
  );

  // IGNORE mode: matched = excluded, not matched = included
  if (context.mode === RuleMode.IGNORE) {
    return matchResult.matched ? NodeState.EXCLUDED : NodeState.INCLUDED;
  }

  // INCLUDE mode: matched = included, not matched = excluded
  if (context.mode === RuleMode.INCLUDE) {
    return matchResult.matched ? NodeState.INCLUDED : NodeState.EXCLUDED;
  }

  return NodeState.UNKNOWN;
}

/**
 * Lists and evaluates children of a directory node.
 */
export async function listChildren(
  args: ListChildrenArgs
): Promise<ListChildrenResponse> {
  const { scanId, dirPath } = args;

  // Retrieve cached scan
  const scan = getCachedScan(scanId);
  if (!scan) {
    throw new Error(`Scan not found: ${scanId}`);
  }

  // Get parent context (should be cached)
  let parentContext = scan.contextCache.get(dirPath);
  
  if (!parentContext) {
    // Context not cached yet - compute it from parent
    const grandparentDir = path.dirname(dirPath);
    const grandparentContext = scan.contextCache.get(grandparentDir);
    
    if (!grandparentContext && dirPath !== scan.sourceRoot) {
      throw new Error(`Context not found for directory: ${dirPath}`);
    }
    
    // Compute context for this directory
    const ruleFiles = scan.ruleFilesByDir.get(dirPath) || [];
    if (dirPath === scan.sourceRoot) {
      // This is the root - derive from empty context
      const rootContext = {
        mode: RuleMode.NONE,
        patterns: [],
        ruleChain: [],
      };
      parentContext = deriveChildContext(rootContext, ruleFiles);
    } else {
      parentContext = deriveChildContext(grandparentContext!, ruleFiles);
    }
    
    // Cache it
    scan.contextCache.set(dirPath, parentContext);
  }

  // Read directory entries
  let entries: { name: string; isDir: boolean }[];
  try {
    const dirents = await fs.readdir(dirPath, { withFileTypes: true });
    entries = dirents.map((d) => ({
      name: d.name,
      isDir: d.isDirectory(),
    }));
  } catch {
    return { children: [] };
  }

  // Evaluate each child
  const children: TreeNode[] = [];
  for (const entry of entries) {
    const childPath = path.join(dirPath, entry.name);
    let childContext: RuleContext;

    if (entry.isDir) {
      // For directories, derive child context
      const ruleFiles = scan.ruleFilesByDir.get(childPath) || [];
      childContext = deriveChildContext(parentContext, ruleFiles);
      scan.contextCache.set(childPath, childContext);
    } else {
      // For files, use parent context
      childContext = parentContext;
    }

    // Evaluate state
    const state = evaluateNodeState(
      childPath,
      entry.isDir,
      childContext,
      scan.conflicts
    );

    // Check if directory has children
    let hasChildren = false;
    if (entry.isDir) {
      try {
        const subEntries = await fs.readdir(childPath, { withFileTypes: true });
        hasChildren = subEntries.some((e) => e.isDirectory());
      } catch {
        // Ignore
      }
    }

    children.push({
      path: childPath,
      name: entry.name,
      isDir: entry.isDir,
      state,
      hasChildren,
      modeAtPath: childContext.mode,
    });
  }

  return { children };
}
