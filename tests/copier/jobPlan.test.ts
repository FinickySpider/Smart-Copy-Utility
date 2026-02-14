/**
 * Tests for robocopy job plan builder.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { scan } from '../../src/main/scanner';
import { buildJobPlan } from '../../src/main/copier/jobPlan';
import { RuleMode } from '../../src/main/rules/types';

describe('Job Plan Builder', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jobplan-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should create a single job for directory with no rules', async () => {
    // Create test structure: src/file.txt
    const srcPath = path.join(tempDir, 'src');
    await fs.mkdir(srcPath);
    await fs.writeFile(path.join(srcPath, 'file.txt'), 'content');

    // Scan the directory
    const scanResult = await scan({
      source: srcPath,
      dest: path.join(tempDir, 'dst'),
      rootOnly: false,
    });

    // Build job plan
    const plan = await buildJobPlan({ scanId: scanResult.scanId });

    expect(plan.sourceRoot).toBe(srcPath);
    expect(plan.destRoot).toBe(path.join(tempDir, 'dst'));
    expect(plan.totalJobs).toBe(1);
    expect(plan.jobs).toHaveLength(1);

    const job = plan.jobs[0];
    expect(job.srcRoot).toBe(srcPath);
    expect(job.mode).toBe(RuleMode.NONE);
    expect(job.patterns).toEqual([]);
    expect(job.originRuleFiles).toEqual([]);
  });

  it('should create a single job for directory with root .copyignore', async () => {
    // Create test structure:
    // src/.copyignore (*.log)
    // src/file.txt
    // src/debug.log
    const srcPath = path.join(tempDir, 'src');
    await fs.mkdir(srcPath);
    await fs.writeFile(path.join(srcPath, '.copyignore'), '*.log\n');
    await fs.writeFile(path.join(srcPath, 'file.txt'), 'content');
    await fs.writeFile(path.join(srcPath, 'debug.log'), 'logs');

    // Scan the directory
    const scanResult = await scan({
      source: srcPath,
      dest: path.join(tempDir, 'dst'),
      rootOnly: false,
    });

    // Build job plan
    const plan = await buildJobPlan({ scanId: scanResult.scanId });

    expect(plan.totalJobs).toBe(1);
    expect(plan.jobs).toHaveLength(1);

    const job = plan.jobs[0];
    expect(job.srcRoot).toBe(srcPath);
    expect(job.mode).toBe(RuleMode.IGNORE);
    expect(job.patterns).toHaveLength(1);
    expect(job.patterns[0].patternText).toBe('*.log');
    expect(job.originRuleFiles).toHaveLength(1);
    expect(job.originRuleFiles[0]).toBe(path.join(srcPath, '.copyignore'));
  });

  it('should create multiple jobs for nested rule files', async () => {
    // Create test structure:
    // src/.copyignore (*.log)
    // src/file.txt
    // src/subdir/.copyignore (*.tmp)
    // src/subdir/data.txt
    const srcPath = path.join(tempDir, 'src');
    const subdirPath = path.join(srcPath, 'subdir');

    await fs.mkdir(srcPath);
    await fs.mkdir(subdirPath);
    await fs.writeFile(path.join(srcPath, '.copyignore'), '*.log\n');
    await fs.writeFile(path.join(srcPath, 'file.txt'), 'content');
    await fs.writeFile(path.join(subdirPath, '.copyignore'), '*.tmp\n');
    await fs.writeFile(path.join(subdirPath, 'data.txt'), 'data');

    // Scan the directory
    const scanResult = await scan({
      source: srcPath,
      dest: path.join(tempDir, 'dst'),
      rootOnly: false,
    });

    // Build job plan
    const plan = await buildJobPlan({ scanId: scanResult.scanId });

    expect(plan.totalJobs).toBe(2);
    expect(plan.jobs).toHaveLength(2);

    // First job: root with *.log ignore
    const job1 = plan.jobs[0];
    expect(job1.srcRoot).toBe(srcPath);
    expect(job1.mode).toBe(RuleMode.IGNORE);
    expect(job1.patterns).toHaveLength(1);
    expect(job1.patterns[0].patternText).toBe('*.log');

    // Second job: subdir with *.tmp ignore (stacking *.log + *.tmp)
    const job2 = plan.jobs[1];
    expect(job2.srcRoot).toBe(subdirPath);
    expect(job2.mode).toBe(RuleMode.IGNORE);
    expect(job2.patterns).toHaveLength(2); // Stacked patterns
    expect(job2.patterns.map((p) => p.patternText)).toContain('*.log');
    expect(job2.patterns.map((p) => p.patternText)).toContain('*.tmp');
  });

  it('should create job for INCLUDE mode only if files match', async () => {
    // Create test structure:
    // src/.copyinclude (*.txt)
    // src/file.txt (matches)
    // src/image.png (does not match)
    const srcPath = path.join(tempDir, 'src');
    await fs.mkdir(srcPath);
    await fs.writeFile(path.join(srcPath, '.copyinclude'), '*.txt\n');
    await fs.writeFile(path.join(srcPath, 'file.txt'), 'content');
    await fs.writeFile(path.join(srcPath, 'image.png'), 'image');

    // Scan the directory
    const scanResult = await scan({
      source: srcPath,
      dest: path.join(tempDir, 'dst'),
      rootOnly: false,
    });

    // Build job plan
    const plan = await buildJobPlan({ scanId: scanResult.scanId });

    // Should create job because file.txt matches
    expect(plan.totalJobs).toBe(1);
    expect(plan.jobs[0].mode).toBe(RuleMode.INCLUDE);
    expect(plan.jobs[0].patterns[0].patternText).toBe('*.txt');
  });

  it('should skip INCLUDE job if no files match', async () => {
    // Create test structure:
    // src/.copyinclude (*.txt)
    // src/image.png (does not match)
    const srcPath = path.join(tempDir, 'src');
    await fs.mkdir(srcPath);
    await fs.writeFile(path.join(srcPath, '.copyinclude'), '*.txt\n');
    await fs.writeFile(path.join(srcPath, 'image.png'), 'image');

    // Scan the directory
    const scanResult = await scan({
      source: srcPath,
      dest: path.join(tempDir, 'dst'),
      rootOnly: false,
    });

    // Build job plan
    const plan = await buildJobPlan({ scanId: scanResult.scanId });

    // Should NOT create job because no files match *.txt
    expect(plan.totalJobs).toBe(0);
    expect(plan.jobs).toHaveLength(0);
  });

  it('should handle mode reset (IGNORE -> INCLUDE)', async () => {
    // Create test structure:
    // src/.copyignore (*.log)
    // src/file.txt
    // src/subdir/.copyinclude (*.txt)
    // src/subdir/data.txt
    const srcPath = path.join(tempDir, 'src');
    const subdirPath = path.join(srcPath, 'subdir');

    await fs.mkdir(srcPath);
    await fs.mkdir(subdirPath);
    await fs.writeFile(path.join(srcPath, '.copyignore'), '*.log\n');
    await fs.writeFile(path.join(srcPath, 'file.txt'), 'content');
    await fs.writeFile(path.join(subdirPath, '.copyinclude'), '*.txt\n');
    await fs.writeFile(path.join(subdirPath, 'data.txt'), 'data');

    // Scan the directory
    const scanResult = await scan({
      source: srcPath,
      dest: path.join(tempDir, 'dst'),
      rootOnly: false,
    });

    // Build job plan
    const plan = await buildJobPlan({ scanId: scanResult.scanId });

    expect(plan.totalJobs).toBe(2);

    // First job: root IGNORE mode
    const job1 = plan.jobs[0];
    expect(job1.srcRoot).toBe(srcPath);
    expect(job1.mode).toBe(RuleMode.IGNORE);

    // Second job: subdir INCLUDE mode (reset)
    const job2 = plan.jobs[1];
    expect(job2.srcRoot).toBe(subdirPath);
    expect(job2.mode).toBe(RuleMode.INCLUDE);
    expect(job2.patterns).toHaveLength(1); // Reset, not stacked
    expect(job2.patterns[0].patternText).toBe('*.txt');
  });

  it('should use rootOnly option to create single job with root rules', async () => {
    // Create test structure:
    // src/.copyignore (*.log)
    // src/file.txt
    // src/subdir/.copyignore (*.tmp)
    // src/subdir/data.txt
    const srcPath = path.join(tempDir, 'src');
    const subdirPath = path.join(srcPath, 'subdir');

    await fs.mkdir(srcPath);
    await fs.mkdir(subdirPath);
    await fs.writeFile(path.join(srcPath, '.copyignore'), '*.log\n');
    await fs.writeFile(path.join(srcPath, 'file.txt'), 'content');
    await fs.writeFile(path.join(subdirPath, '.copyignore'), '*.tmp\n');
    await fs.writeFile(path.join(subdirPath, 'data.txt'), 'data');

    // Scan the directory
    const scanResult = await scan({
      source: srcPath,
      dest: path.join(tempDir, 'dst'),
      rootOnly: false,
    });

    // Build job plan with rootOnly option
    const plan = await buildJobPlan({
      scanId: scanResult.scanId,
      rootOnly: true,
    });

    // Should create only one job with root rules
    expect(plan.totalJobs).toBe(1);
    expect(plan.jobs).toHaveLength(1);

    const job = plan.jobs[0];
    expect(job.srcRoot).toBe(srcPath);
    expect(job.mode).toBe(RuleMode.IGNORE);
    expect(job.patterns).toHaveLength(1);
    expect(job.patterns[0].patternText).toBe('*.log');
  });

  it('should throw error if scan not found', async () => {
    await expect(buildJobPlan({ scanId: 'nonexistent' })).rejects.toThrow(
      'Scan not found: nonexistent'
    );
  });
});
