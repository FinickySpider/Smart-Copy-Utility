/**
 * Dry run executor.
 *
 * Executes a job plan in dry run mode (robocopy /L) to estimate the
 * impact of a copy operation without actually copying files.
 */

import { spawn } from 'child_process';
import { buildJobPlan } from './jobPlan';
import { buildRobocopyArgs, isRobocopySuccess } from './robocopy';
import { DryRunReport, JobPlanOptions } from './types';
import { getRobocopyThreads } from '../settings';

/**
 * Executes a dry run of a copy operation.
 *
 * Builds a job plan and executes each job with robocopy /L to estimate
 * the number of files and bytes that would be copied. Returns a report
 * with the job plan, validity status, and conflicts.
 *
 * @param options - Job plan options (scanId, rootOnly)
 * @returns DryRunReport with plan, validity, conflicts, and estimates
 */
export async function dryRun(
  options: JobPlanOptions
): Promise<DryRunReport> {
  // Build the job plan
  const plan = await buildJobPlan(options);

  // Get the scan result to check for conflicts
  const { getCachedScan } = await import('../scanner');
  const scan = getCachedScan(options.scanId);
  if (!scan) {
    throw new Error(`Scan not found: ${options.scanId}`);
  }

  const conflicts = scan.conflicts;
  const validPlan = conflicts.length === 0;

  // If there are conflicts, return early without running robocopy
  if (!validPlan) {
    return {
      plan,
      validPlan: false,
      conflicts,
    };
  }

  // Run dry run for each job to get estimates
  let totalFiles = 0;
  let totalBytes = 0;

  const threads = await getRobocopyThreads();

  for (const job of plan.jobs) {
    try {
      const args = buildRobocopyArgs(job, true, threads);
      const output = await executeRobocopy(args);

      // Parse robocopy output for file/byte counts
      const estimates = parseRobocopyOutput(output);
      totalFiles += estimates.files;
      totalBytes += estimates.bytes;
    } catch (error) {
      // If a job fails in dry run, skip estimates for that job
      console.warn(`Dry run failed for job ${job.jobId}:`, error);
    }
  }

  return {
    plan,
    validPlan: true,
    conflicts: [],
    estimatedFiles: totalFiles,
    estimatedBytes: totalBytes,
  };
}

/**
 * Executes robocopy and returns the combined stdout/stderr output.
 */
async function executeRobocopy(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('robocopy.exe', args, {
      windowsHide: true,
    });

    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== null && isRobocopySuccess(code)) {
        resolve(output);
      } else {
        reject(new Error(`Robocopy failed with exit code: ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Parses robocopy output to extract file/byte estimates.
 *
 * Looks for lines like:
 *   Files :     12345
 *   Bytes :     1234567 KB
 */
function parseRobocopyOutput(output: string): { files: number; bytes: number } {
  const filesMatch = output.match(/Files\s*:\s*(\d+)/);
  const bytesMatch = output.match(/Bytes\s*:\s*([\d.]+)\s*([kKmMgG][bB]?)?/);

  const files = filesMatch ? parseInt(filesMatch[1], 10) : 0;

  let bytes = 0;
  if (bytesMatch) {
    const value = parseFloat(bytesMatch[1]);
    const unit = bytesMatch[2]?.toLowerCase() || '';

    if (unit.startsWith('k')) {
      bytes = value * 1024;
    } else if (unit.startsWith('m')) {
      bytes = value * 1024 * 1024;
    } else if (unit.startsWith('g')) {
      bytes = value * 1024 * 1024 * 1024;
    } else {
      bytes = value; // Already in bytes
    }
  }

  return { files, bytes };
}
