/**
 * Copier types — data structures for robocopy jobs and job plans.
 */

import { RuleMode, PatternEntry } from '../rules/types';

/** A single robocopy job representing a subtree segment. */
export interface RobocopyJob {
  /** Unique identifier for this job */
  jobId: string;
  /** Absolute source directory path */
  srcRoot: string;
  /** Absolute destination directory path */
  dstRoot: string;
  /** Active rule mode for this subtree */
  mode: RuleMode;
  /** Effective stacked patterns (empty for NONE mode) */
  patterns: PatternEntry[];
  /** Rule file paths contributing to this job (for debugging/reporting) */
  originRuleFiles: string[];
}

/** A complete job plan for a copy operation. */
export interface JobPlan {
  /** Unique identifier for the job plan (same as scanId) */
  planId: string;
  /** Source root directory */
  sourceRoot: string;
  /** Destination root directory */
  destRoot: string;
  /** Array of robocopy jobs to execute sequentially */
  jobs: RobocopyJob[];
  /** Total number of jobs in the plan */
  totalJobs: number;
}

/** Options for building a job plan. */
export interface JobPlanOptions {
  /** Scan ID from which to build the plan */
  scanId: string;
  /** If true, ignore nested rule files and use only root rules */
  rootOnly?: boolean;
}

/** Result of a dry run operation. */
export interface DryRunReport {
  /** Job plan that would be executed */
  plan: JobPlan;
  /** Whether the plan is valid (no conflicts) */
  validPlan: boolean;
  /** Array of conflict directory paths */
  conflicts: string[];
  /** Estimated total files (best-effort from robocopy /L) */
  estimatedFiles?: number;
  /** Estimated total bytes (best-effort from robocopy /L) */
  estimatedBytes?: number;
}

/** Status of a copy operation. */
export enum CopyStatus {
  IDLE = 'idle',
  SCANNING = 'scanning',
  READY = 'ready',
  DRYRUN = 'dryrun',
  COPYING = 'copying',
  CANCELLED = 'cancelled',
  DONE = 'done',
  ERROR = 'error',
}
