/**
 * Copy executor — sequential robocopy job execution with progress streaming.
 *
 * Executes jobs from a job plan sequentially, streaming output via IPC events.
 * Supports cancellation mid-execution.
 */

import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';
import { buildJobPlan } from './jobPlan';
import { buildRobocopyArgs, isRobocopySuccess } from './robocopy';
import { JobPlanOptions, CopyStatus } from './types';

/** Events emitted during copy execution. */
export interface CopyEvents {
  /** Copy status changed */
  status: (status: CopyStatus) => void;
  /** Job started */
  jobStart: (jobId: string, srcRoot: string, dstRoot: string) => void;
  /** Job ended */
  jobEnd: (jobId: string, success: boolean, exitCode: number) => void;
  /** Log line from robocopy */
  logLine: (line: string) => void;
  /** Copy completed (all jobs done) */
  done: () => void;
  /** Error occurred */
  error: (error: Error) => void;
}

/** Copy executor class with event-based progress reporting. */
export class CopyExecutor extends EventEmitter {
  private currentProcess: ChildProcess | null = null;
  private cancelled: boolean = false;
  private status: CopyStatus = CopyStatus.IDLE;

  /**
   * Executes a copy operation.
   *
   * @param options - Job plan options (scanId, rootOnly)
   */
  async execute(options: JobPlanOptions): Promise<void> {
    try {
      this.cancelled = false;
      this.setStatus(CopyStatus.SCANNING);

      // Build the job plan
      const plan = await buildJobPlan(options);
      this.emit('logLine', `Job plan built: ${plan.totalJobs} jobs`);

      // Check for conflicts
      const { getCachedScan } = await import('../scanner');
      const scan = getCachedScan(options.scanId);
      if (!scan) {
        throw new Error(`Scan not found: ${options.scanId}`);
      }

      if (scan.conflicts.length > 0) {
        throw new Error(
          `Copy blocked: ${scan.conflicts.length} conflict(s) detected`
        );
      }

      this.setStatus(CopyStatus.COPYING);

      // Execute each job sequentially
      for (let i = 0; i < plan.jobs.length; i++) {
        if (this.cancelled) {
          this.setStatus(CopyStatus.CANCELLED);
          this.emit('logLine', 'Copy cancelled by user');
          return;
        }

        const job = plan.jobs[i];
        this.emit('logLine', `\n=== Job ${i + 1}/${plan.totalJobs} ===`);
        this.emit('jobStart', job.jobId, job.srcRoot, job.dstRoot);

        const exitCode = await this.executeJob(job);
        const success = isRobocopySuccess(exitCode);

        this.emit('jobEnd', job.jobId, success, exitCode);

        if (!success) {
          throw new Error(
            `Job ${job.jobId} failed with exit code ${exitCode}`
          );
        }
      }

      this.setStatus(CopyStatus.DONE);
      this.emit('logLine', '\n=== Copy completed successfully ===');
      this.emit('done');
    } catch (error) {
      this.setStatus(CopyStatus.ERROR);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Cancels the current copy operation.
   */
  cancel(): void {
    this.cancelled = true;
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
    }
  }

  /**
   * Gets the current copy status.
   */
  getStatus(): CopyStatus {
    return this.status;
  }

  /**
   * Executes a single robocopy job and returns the exit code.
   */
  private async executeJob(job: any): Promise<number> {
    return new Promise((resolve, reject) => {
      const args = buildRobocopyArgs(job, false);

      this.emit('logLine', `Executing: robocopy ${args.join(' ')}`);

      this.currentProcess = spawn('robocopy.exe', args, {
        windowsHide: true,
      });

      this.currentProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach((line: string) => {
          if (line.trim()) {
            this.emit('logLine', line);
          }
        });
      });

      this.currentProcess.stderr?.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach((line: string) => {
          if (line.trim()) {
            this.emit('logLine', `[ERROR] ${line}`);
          }
        });
      });

      this.currentProcess.on('close', (code) => {
        this.currentProcess = null;
        resolve(code || 0);
      });

      this.currentProcess.on('error', (err) => {
        this.currentProcess = null;
        reject(err);
      });
    });
  }

  /**
   * Sets the current status and emits a status event.
   */
  private setStatus(status: CopyStatus): void {
    this.status = status;
    this.emit('status', status);
  }
}
