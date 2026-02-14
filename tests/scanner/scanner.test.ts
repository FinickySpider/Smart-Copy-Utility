/**
 * Scanner integration tests — validates scanning, listChildren, and explain operations.
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { scan, clearScanCache } from '@main/scanner';
import { listChildren } from '@main/scanner/listChildren';
import { explain } from '@main/scanner/explain';

describe('Scanner Integration', () => {
  let testDir: string;

  beforeAll(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `smart-copy-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Create test structure:
    // testDir/
    //   .copyignore   (node_modules/, *.log)
    //   README.md
    //   src/
    //     main.ts
    //     test.log
    //   node_modules/
    //     package/
    //       index.js

    await fs.writeFile(path.join(testDir, '.copyignore'), 'node_modules/\n*.log\n');
    await fs.writeFile(path.join(testDir, 'README.md'), '# Test');

    await fs.mkdir(path.join(testDir, 'src'));
    await fs.writeFile(path.join(testDir, 'src', 'main.ts'), 'console.log();');
    await fs.writeFile(path.join(testDir, 'src', 'test.log'), 'log data');

    await fs.mkdir(path.join(testDir, 'node_modules', 'package'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'node_modules', 'package', 'index.js'), 'module.exports = {};');
  });

  afterAll(async () => {
    // Clean up
    await fs.rm(testDir, { recursive: true, force: true });
    clearScanCache();
  });

  it('scans directory and discovers rule files', async () => {
    const result = await scan({
      source: testDir,
      dest: path.join(testDir, 'dest'),
      rootOnly: false,
    });

    expect(result.scanId).toBeDefined();
    expect(result.stats.ruleFilesFound).toBe(1);
    expect(result.stats.conflictsFound).toBe(0);
    expect(result.conflicts).toEqual([]);
    expect(result.rootNode.path).toBe(testDir);
    expect(result.rootNode.isDir).toBe(true);
    expect(result.rootNode.state).toBe('INCLUDED');
  });

  it('listChildren returns correct child nodes', async () => {
    const scanResult = await scan({
      source: testDir,
      dest: path.join(testDir, 'dest'),
      rootOnly: false,
    });

    const children = await listChildren({
      scanId: scanResult.scanId,
      dirPath: testDir,
    });

    expect(children.children.length).toBeGreaterThan(0);
    
    // Find specific nodes
    const readme = children.children.find(n => n.name === 'README.md');
    const src = children.children.find(n => n.name === 'src');
    const nodeModules = children.children.find(n => n.name === 'node_modules');

    expect(readme).toBeDefined();
    expect(readme?.state).toBe('INCLUDED');

    expect(src).toBeDefined();
    expect(src?.isDir).toBe(true);
    expect(src?.state).toBe('INCLUDED');

    expect(nodeModules).toBeDefined();
    expect(nodeModules?.state).toBe('EXCLUDED'); // Matched by "node_modules/" pattern
  });

  it('listChildren for src directory shows log file excluded', async () => {
    const scanResult = await scan({
      source: testDir,
      dest: path.join(testDir, 'dest'),
      rootOnly: false,
    });

    const srcPath = path.join(testDir, 'src');
    const children = await listChildren({
      scanId: scanResult.scanId,
      dirPath: srcPath,
    });

    const mainTs = children.children.find(n => n.name === 'main.ts');
    const testLog = children.children.find(n => n.name === 'test.log');

    expect(mainTs?.state).toBe('INCLUDED');
    expect(testLog?.state).toBe('EXCLUDED'); // Matched by "*.log" pattern
  });

  it('explain returns correct data for included file', async () => {
    const scanResult = await scan({
      source: testDir,
      dest: path.join(testDir, 'dest'),
      rootOnly: false,
    });

    const readmePath = path.join(testDir, 'README.md');
    const explainResult = await explain({
      scanId: scanResult.scanId,
      nodePath: readmePath,
    });

    expect(explainResult.explain.path).toBe(readmePath);
    expect(explainResult.explain.decision).toBe('INCLUDED');
    expect(explainResult.explain.mode).toBe('IGNORE');
    expect(explainResult.explain.matchingPatterns).toHaveLength(0); // Not matched by any pattern
  });

  it('explain returns correct data for excluded file', async () => {
    const scanResult = await scan({
      source: testDir,
      dest: path.join(testDir, 'dest'),
      rootOnly: false,
    });

    const logPath = path.join(testDir, 'src', 'test.log');
    const explainResult = await explain({
      scanId: scanResult.scanId,
      nodePath: logPath,
    });

    expect(explainResult.explain.path).toBe(logPath);
    expect(explainResult.explain.decision).toBe('EXCLUDED');
    expect(explainResult.explain.mode).toBe('IGNORE');
    expect(explainResult.explain.matchingPatterns.length).toBeGreaterThan(0);
    expect(explainResult.explain.matchingPatterns[0].patternText).toBe('*.log');
  });

  it('detects conflicts when both rule files exist', async () => {
    // Create a conflict directory
    const conflictDir = path.join(testDir, 'conflict');
    await fs.mkdir(conflictDir);
    await fs.writeFile(path.join(conflictDir, '.copyignore'), '*.txt\n');
    await fs.writeFile(path.join(conflictDir, '.copyinclude'), '*.md\n');
    await fs.writeFile(path.join(conflictDir, 'file.txt'), 'content');

    const scanResult = await scan({
      source: testDir,
      dest: path.join(testDir, 'dest'),
      rootOnly: false,
    });

    expect(scanResult.stats.conflictsFound).toBe(1);
    expect(scanResult.conflicts).toContain(conflictDir);

    // Clean up
    await fs.rm(conflictDir, { recursive: true, force: true });
  });
});
