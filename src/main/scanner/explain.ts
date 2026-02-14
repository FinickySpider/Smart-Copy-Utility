/**
 * Explain operation — returns detailed information about why a node
 * is included or excluded.
 */

import path from 'path';
import { NodeState, RuleMode, PatternEntry } from '../rules/types';
import { matchPatterns, deriveChildContext } from '../rules';
import { getCachedScan } from './index';

/** Arguments for the explain IPC command. */
export interface ExplainArgs {
  scanId: string;
  nodePath: string;
}

/** Explain data for a single node. */
export interface ExplainData {
  path: string;
  name: string;
  decision: NodeState;
  mode: RuleMode;
  ruleChain: string[];
  matchingPatterns: PatternEntry[];
}

/** Response from the explain IPC command. */
export interface ExplainResponse {
  explain: ExplainData;
}

/**
 * Returns explain data for a node.
 */
export async function explain(args: ExplainArgs): Promise<ExplainResponse> {
  const { scanId, nodePath } = args;

  // Retrieve cached scan
  const scan = getCachedScan(scanId);
  if (!scan) {
    throw new Error(`Scan not found: ${scanId}`);
  }

  // Get context for this node's parent directory (or the node itself if it's a directory)
  const parentDir = path.dirname(nodePath);
  let context = scan.contextCache.get(parentDir);
  
  if (!context) {
    // Context not cached - we need to compute it by walking from root
    // This is a fallback; normally context should be cached during listChildren
    const pathParts = parentDir.split(path.sep);
    const rootParts = scan.sourceRoot.split(path.sep);
    
    // Build context by walking from root to parent
    context = scan.contextCache.get(scan.sourceRoot);
    if (!context) {
      throw new Error(`Root context not found`);
    }
    
    // Walk down the path and compute contexts
    let currentPath = scan.sourceRoot;
    for (let i = rootParts.length; i < pathParts.length; i++) {
      currentPath = path.join(currentPath, pathParts[i]);
      let ctx = scan.contextCache.get(currentPath);
      if (!ctx) {
        const ruleFiles = scan.ruleFilesByDir.get(currentPath) || [];
        ctx = deriveChildContext(context, ruleFiles);
        scan.contextCache.set(currentPath, ctx);
      }
      context = ctx;
    }
  }

  // Determine if this is a directory
  const isDir = nodePath === scan.sourceRoot || nodePath.endsWith(path.sep);

  // Determine decision
  let decision: NodeState;
  if (scan.conflicts.includes(nodePath)) {
    decision = NodeState.CONFLICT;
  } else if (context.mode === RuleMode.NONE) {
    decision = NodeState.INCLUDED;
  } else {
    // Get the rule file directory for pattern matching
    const ruleFileDir =
      context.ruleChain.length > 0
        ? path.dirname(context.ruleChain[0])
        : parentDir;

    // Match against patterns
    const matchResult = matchPatterns(
      context.patterns,
      nodePath,
      isDir,
      ruleFileDir
    );

    if (context.mode === RuleMode.IGNORE) {
      decision = matchResult.matched ? NodeState.EXCLUDED : NodeState.INCLUDED;
    } else {
      decision = matchResult.matched ? NodeState.INCLUDED : NodeState.EXCLUDED;
    }
  }

  // Get matching patterns (empty if NONE mode or CONFLICT)
  let matchingPatterns: PatternEntry[] = [];
  if (context.mode !== RuleMode.NONE && decision !== NodeState.CONFLICT) {
    const ruleFileDir =
      context.ruleChain.length > 0
        ? path.dirname(context.ruleChain[0])
        : parentDir;

    const matchResult = matchPatterns(
      context.patterns,
      nodePath,
      isDir,
      ruleFileDir
    );
    matchingPatterns = matchResult.matchingPatterns;
  }

  return {
    explain: {
      path: nodePath,
      name: path.basename(nodePath),
      decision,
      mode: context.mode,
      ruleChain: context.ruleChain,
      matchingPatterns,
    },
  };
}
