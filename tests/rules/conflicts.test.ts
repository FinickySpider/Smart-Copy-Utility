import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { hasConflict, detectConflicts } from '../../src/main/rules/conflicts';

let tmpDir: string;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scu-conflict-test-'));
});

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('hasConflict', () => {
  it('returns false for directory with no rule files', async () => {
    const dir = path.join(tmpDir, 'no-rules');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'file.txt'), 'hello');

    expect(await hasConflict(dir)).toBe(false);
  });

  it('returns false for directory with only .copyignore', async () => {
    const dir = path.join(tmpDir, 'only-ignore');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, '.copyignore'), 'node_modules/');

    expect(await hasConflict(dir)).toBe(false);
  });

  it('returns false for directory with only .copyinclude', async () => {
    const dir = path.join(tmpDir, 'only-include');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, '.copyinclude'), 'src/');

    expect(await hasConflict(dir)).toBe(false);
  });

  it('returns true when both rule files exist', async () => {
    const dir = path.join(tmpDir, 'conflict');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, '.copyignore'), 'a/');
    await fs.writeFile(path.join(dir, '.copyinclude'), 'b/');

    expect(await hasConflict(dir)).toBe(true);
  });

  it('detects case-insensitively', async () => {
    const dir = path.join(tmpDir, 'conflict-case');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, '.CopyIgnore'), 'a/');
    await fs.writeFile(path.join(dir, '.COPYINCLUDE'), 'b/');

    expect(await hasConflict(dir)).toBe(true);
  });

  it('returns false for nonexistent directory', async () => {
    expect(await hasConflict(path.join(tmpDir, 'nope'))).toBe(false);
  });
});

describe('detectConflicts', () => {
  it('returns empty when no conflicts exist', async () => {
    const root = path.join(tmpDir, 'tree-clean');
    await fs.mkdir(path.join(root, 'sub1'), { recursive: true });
    await fs.mkdir(path.join(root, 'sub2'), { recursive: true });
    await fs.writeFile(path.join(root, '.copyignore'), 'node_modules/');
    await fs.writeFile(path.join(root, 'sub1', '.copyinclude'), 'src/');

    const conflicts = await detectConflicts(root);
    expect(conflicts).toEqual([]);
  });

  it('detects a single conflict', async () => {
    const root = path.join(tmpDir, 'tree-one-conflict');
    await fs.mkdir(path.join(root, 'sub'), { recursive: true });
    await fs.writeFile(path.join(root, 'sub', '.copyignore'), 'a/');
    await fs.writeFile(path.join(root, 'sub', '.copyinclude'), 'b/');

    const conflicts = await detectConflicts(root);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toBe(path.join(root, 'sub'));
  });

  it('detects multiple conflicts across different directories', async () => {
    const root = path.join(tmpDir, 'tree-multi-conflict');
    const dir1 = path.join(root, 'a');
    const dir2 = path.join(root, 'b', 'c');
    await fs.mkdir(dir1, { recursive: true });
    await fs.mkdir(dir2, { recursive: true });

    await fs.writeFile(path.join(dir1, '.copyignore'), 'x/');
    await fs.writeFile(path.join(dir1, '.copyinclude'), 'y/');
    await fs.writeFile(path.join(dir2, '.copyignore'), 'x/');
    await fs.writeFile(path.join(dir2, '.copyinclude'), 'y/');

    const conflicts = await detectConflicts(root);
    expect(conflicts).toHaveLength(2);
    expect(conflicts.sort()).toEqual([dir1, dir2].sort());
  });

  it('does not include clean directories in conflict list', async () => {
    const root = path.join(tmpDir, 'tree-mixed');
    const clean = path.join(root, 'clean');
    const conflict = path.join(root, 'conflict');
    await fs.mkdir(clean, { recursive: true });
    await fs.mkdir(conflict, { recursive: true });

    await fs.writeFile(path.join(clean, '.copyignore'), 'node_modules/');
    await fs.writeFile(path.join(conflict, '.copyignore'), 'a/');
    await fs.writeFile(path.join(conflict, '.copyinclude'), 'b/');

    const conflicts = await detectConflicts(root);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toBe(conflict);
  });
});
