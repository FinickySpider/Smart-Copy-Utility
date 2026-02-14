/**
 * Robocopy command builder and executor.
 *
 * Builds robocopy command arguments from job specifications and handles
 * command execution for both dry run (/L) and actual copy operations.
 */

import { RobocopyJob } from './types';
import { RuleMode } from '../rules/types';

/**
 * Builds robocopy command arguments for a job.
 *
 * @param job - The job to convert to robocopy arguments
 * @param dryRun - If true, adds /L flag for list-only mode
 * @returns Array of command arguments for robocopy.exe
 */
export function buildRobocopyArgs(
  job: RobocopyJob,
  dryRun: boolean = false
): string[] {
  const args: string[] = [];

  // Source and destination
  args.push(job.srcRoot);
  args.push(job.dstRoot);

  // Mode-specific switches
  switch (job.mode) {
    case RuleMode.NONE:
      // Copy everything - just use /E for subdirectories
      args.push('/E');
      break;

    case RuleMode.IGNORE:
      // Copy everything except excluded patterns
      args.push('/E');

      // Add exclusions from patterns
      const directories = job.patterns.filter((p) =>
        p.patternText.endsWith('/')
      );
      const files = job.patterns.filter((p) => !p.patternText.endsWith('/'));

      // Exclude directories
      if (directories.length > 0) {
        args.push('/XD');
        directories.forEach((p) => {
          const dirPattern = p.patternText.slice(0, -1); // Remove trailing slash
          args.push(dirPattern);
        });
      }

      // Exclude files
      if (files.length > 0) {
        args.push('/XF');
        files.forEach((p) => {
          args.push(p.patternText);
        });
      }
      break;

    case RuleMode.INCLUDE:
      // For INCLUDE mode, we would need to build a file list
      // This is more complex and will be handled in FEAT-013
      // For now, throw an error
      throw new Error(
        'INCLUDE mode not yet implemented for robocopy command building'
      );
  }

  // Common switches
  args.push('/R:3'); // Retry 3 times on failure
  args.push('/W:2'); // Wait 2 seconds between retries
  args.push('/MT:8'); // Multi-threaded (8 threads)
  args.push('/NP'); // No progress (percentage)
  args.push('/NDL'); // No directory list
  args.push('/NS'); // No size
  args.push('/NC'); // No class
  args.push('/BYTES'); // Show sizes in bytes
  args.push('/TS'); // Include source timestamps

  // Dry run flag
  if (dryRun) {
    args.push('/L'); // List only, don't copy
  }

  return args;
}

/**
 * Parses robocopy exit code to determine success/failure.
 *
 * Robocopy exit codes:
 * 0-7: Success (various levels of changes)
 * 8+: Error
 *
 * @param exitCode - The exit code from robocopy
 * @returns True if successful, false if error
 */
export function isRobocopySuccess(exitCode: number): boolean {
  return exitCode < 8;
}
