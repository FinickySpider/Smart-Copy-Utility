/**
 * Robocopy job plan builder.
 *
 * Walks the directory tree using context traversal and segments the tree
 * into robocopy jobs at rule file boundaries. Each job represents a subtree
 * with a consistent rule mode and pattern set.
 *
 * Key behaviors:
 * - NONE mode: copy everything in the subtree
 * - IGNORE mode: use robocopy /XD and /XF to exclude matching patterns
 * - INCLUDE mode: enumerate included files and use robocopy with file list
 *   (if no files match, skip the job entirely)
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { RuleMode, NodeState } from '../rules/types';
import { deriveChildContext } from '../rules';
import { getCachedScan } from '../scanner';
import { RobocopyJob, JobPlan, JobPlanOptions } from './types';

/**
 * Builds a robocopy job plan from a scan result.
 *
 * Walks the directory tree and creates jobs at rule boundaries.
 * Each job captures the effective context (mode + patterns) for its subtree.
 */
export async function buildJobPlan(options: JobPlanOptions): Promise<JobPlan> {
  const { scanId, rootOnly = false } = options;

  // Retrieve cached scan
  const scan = getCachedScan(scanId);
  if (!scan) {
    throw new Error(`Scan not found: ${scanId}`);
  }

  const jobs: RobocopyJob[] = [];

  // Start walking from root (no parent context)
  await walkAndBuildJobs(
    scan.sourceRoot,
    scan.destRoot,
    scan.sourceRoot,
    scan,
    jobs,
    rootOnly,
    undefined
  );

  return {
    planId: scanId,
    sourceRoot: scan.sourceRoot,
    destRoot: scan.destRoot,
    jobs,
    totalJobs: jobs.length,
  };
}

/**
 * Recursively walks the directory tree and builds jobs at rule boundaries.
 */
async function walkAndBuildJobs(
  currentPath: string,
  destRoot: string,
  sourceRoot: string,
  scan: any,
  jobs: RobocopyJob[],
  rootOnly: boolean,
  parentContext?: any
): Promise<void> {
  // Get or derive context for this directory
  let context = scan.contextCache.get(currentPath);
  if (!context) {
    // Derive context from parent
    if (!parentContext) {
      // No parent context - this shouldn't happen unless we're at root
      return;
    }
    const ruleFiles = scan.ruleFilesByDir.get(currentPath) || [];
    context = deriveChildContext(parentContext, ruleFiles);
    scan.contextCache.set(currentPath, context);
  }

  // Check if this directory has rule files (indicates a boundary)
  const hasRuleFiles = scan.ruleFilesByDir.has(currentPath);
  const isRoot = currentPath === sourceRoot;

  // Determine if we should create a job here
  // - Always create a job at the root
  // - Create a job when we encounter a rule file boundary (unless rootOnly mode)
  // - In rootOnly mode, only create one job at root
  const shouldCreateJob = isRoot || (hasRuleFiles && !rootOnly);

  if (shouldCreateJob) {
    // Build the destination path
    const relativePath = path.relative(sourceRoot, currentPath);
    const dstPath = relativePath
      ? path.join(destRoot, relativePath)
      : destRoot;

    // Create a job for this subtree
    const job: RobocopyJob = {
      jobId: uuidv4(),
      srcRoot: currentPath,
      dstRoot: dstPath,
      mode: context.mode,
      patterns: [...context.patterns],
      originRuleFiles: [...context.ruleChain],
    };

    // For INCLUDE mode, check if there are any included files
    // If not, skip this job
    if (context.mode === RuleMode.INCLUDE) {
      const hasIncludedFiles = await checkIncludedFiles(
        currentPath,
        context,
        scan
      );
      if (!hasIncludedFiles) {
        // Skip this job - no files to copy
        return;
      }
    }

    jobs.push(job);

    // In rootOnly mode, we're done after creating the root job
    if (rootOnly && isRoot) {
      return;
    }

    // If we created a job at a non-root boundary, stop recursing
    // because this job will handle the entire subtree
    if (shouldCreateJob && !isRoot) {
      return;
    }
  }

  // Recurse into subdirectories to find more rule boundaries
  try {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const childPath = path.join(currentPath, entry.name);
        await walkAndBuildJobs(
          childPath,
          destRoot,
          sourceRoot,
          scan,
          jobs,
          rootOnly,
          context
        );
      }
    }
  } catch {
    // Skip unreadable directories
  }
}

/**
 * Checks if a directory (in INCLUDE mode) has any included files in its subtree.
 * Returns true if at least one file would be included, false otherwise.
 */
async function checkIncludedFiles(
  dirPath: string,
  context: any,
  scan: any
): Promise<boolean> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Check if directory matches include patterns
        // If it does, recurse into it
        // For now, we'll recursively check all directories
        const hasFiles = await checkIncludedFiles(entryPath, context, scan);
        if (hasFiles) return true;
      } else {
        // Check if file matches include patterns
        // Use the pattern matching from the scanner
        const ruleFileDir =
          context.ruleChain.length > 0
            ? path.dirname(context.ruleChain[0])
            : dirPath;

        // Import matchPatterns
        const { matchPatterns } = await import('../rules');
        const matchResult = matchPatterns(
          context.patterns,
          entryPath,
          false,
          ruleFileDir
        );

        if (matchResult.matched) {
          return true; // Found at least one included file
        }
      }
    }

    return false; // No included files found
  } catch {
    return false;
  }
}
