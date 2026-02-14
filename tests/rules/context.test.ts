import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  createRootContext,
  deriveChildContext,
  ContextTraverser,
} from '../../src/main/rules/context';
import { RuleMode, RuleType, RuleFileRecord } from '../../src/main/rules/types';

let tmpDir: string;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scu-context-test-'));
});

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// Helper to create a rule file record for testing
function mkRuleFile(
  filePath: string,
  type: RuleType,
  patterns: string[]
): RuleFileRecord {
  return {
    path: filePath,
    type,
    lines: patterns.map((p, i) => ({
      patternText: p,
      lineNumber: i + 1,
      ruleFilePath: filePath,
    })),
  };
}

describe('createRootContext', () => {
  it('starts with NONE mode, empty patterns, empty chain', () => {
    const ctx = createRootContext();
    expect(ctx.mode).toBe(RuleMode.NONE);
    expect(ctx.patterns).toEqual([]);
    expect(ctx.ruleChain).toEqual([]);
  });
});

describe('deriveChildContext', () => {
  it('inherits parent unchanged when no rule files', () => {
    const parent = createRootContext();
    const child = deriveChildContext(parent, []);
    expect(child.mode).toBe(RuleMode.NONE);
    expect(child.patterns).toEqual([]);
  });

  // NONE → IGNORE: reset
  it('transitions NONE → IGNORE (reset)', () => {
    const parent = createRootContext();
    const rf = mkRuleFile('/root/.copyignore', RuleType.IGNORE_FILE, [
      'node_modules/',
      '*.log',
    ]);

    const child = deriveChildContext(parent, [rf]);
    expect(child.mode).toBe(RuleMode.IGNORE);
    expect(child.patterns).toHaveLength(2);
    expect(child.ruleChain).toEqual(['/root/.copyignore']);
  });

  // NONE → INCLUDE: reset
  it('transitions NONE → INCLUDE (reset)', () => {
    const parent = createRootContext();
    const rf = mkRuleFile('/root/.copyinclude', RuleType.INCLUDE_FILE, [
      'src/',
      'README.md',
    ]);

    const child = deriveChildContext(parent, [rf]);
    expect(child.mode).toBe(RuleMode.INCLUDE);
    expect(child.patterns).toHaveLength(2);
    expect(child.ruleChain).toEqual(['/root/.copyinclude']);
  });

  // IGNORE → IGNORE: stack
  it('stacks IGNORE → IGNORE (append patterns)', () => {
    const parent = {
      mode: RuleMode.IGNORE,
      patterns: [
        {
          patternText: 'node_modules/',
          lineNumber: 1,
          ruleFilePath: '/root/.copyignore',
        },
      ],
      ruleChain: ['/root/.copyignore'],
    };

    const rf = mkRuleFile('/root/sub/.copyignore', RuleType.IGNORE_FILE, [
      'dist/',
    ]);

    const child = deriveChildContext(parent, [rf]);
    expect(child.mode).toBe(RuleMode.IGNORE);
    expect(child.patterns).toHaveLength(2);
    expect(child.patterns[0].patternText).toBe('node_modules/');
    expect(child.patterns[1].patternText).toBe('dist/');
    expect(child.ruleChain).toEqual([
      '/root/.copyignore',
      '/root/sub/.copyignore',
    ]);
  });

  // INCLUDE → INCLUDE: stack
  it('stacks INCLUDE → INCLUDE (append patterns)', () => {
    const parent = {
      mode: RuleMode.INCLUDE,
      patterns: [
        {
          patternText: 'src/',
          lineNumber: 1,
          ruleFilePath: '/root/.copyinclude',
        },
      ],
      ruleChain: ['/root/.copyinclude'],
    };

    const rf = mkRuleFile('/root/sub/.copyinclude', RuleType.INCLUDE_FILE, [
      '*.ts',
    ]);

    const child = deriveChildContext(parent, [rf]);
    expect(child.mode).toBe(RuleMode.INCLUDE);
    expect(child.patterns).toHaveLength(2);
    expect(child.ruleChain).toEqual([
      '/root/.copyinclude',
      '/root/sub/.copyinclude',
    ]);
  });

  // IGNORE → INCLUDE: reset
  it('resets IGNORE → INCLUDE (replace patterns)', () => {
    const parent = {
      mode: RuleMode.IGNORE,
      patterns: [
        {
          patternText: 'node_modules/',
          lineNumber: 1,
          ruleFilePath: '/root/.copyignore',
        },
      ],
      ruleChain: ['/root/.copyignore'],
    };

    const rf = mkRuleFile('/root/sub/.copyinclude', RuleType.INCLUDE_FILE, [
      'important.ts',
    ]);

    const child = deriveChildContext(parent, [rf]);
    expect(child.mode).toBe(RuleMode.INCLUDE);
    expect(child.patterns).toHaveLength(1);
    expect(child.patterns[0].patternText).toBe('important.ts');
    expect(child.ruleChain).toEqual(['/root/sub/.copyinclude']);
  });

  // INCLUDE → IGNORE: reset
  it('resets INCLUDE → IGNORE (replace patterns)', () => {
    const parent = {
      mode: RuleMode.INCLUDE,
      patterns: [
        {
          patternText: 'src/',
          lineNumber: 1,
          ruleFilePath: '/root/.copyinclude',
        },
      ],
      ruleChain: ['/root/.copyinclude'],
    };

    const rf = mkRuleFile('/root/sub/.copyignore', RuleType.IGNORE_FILE, [
      '*.bak',
    ]);

    const child = deriveChildContext(parent, [rf]);
    expect(child.mode).toBe(RuleMode.IGNORE);
    expect(child.patterns).toHaveLength(1);
    expect(child.patterns[0].patternText).toBe('*.bak');
    expect(child.ruleChain).toEqual(['/root/sub/.copyignore']);
  });
});

describe('ContextTraverser', () => {
  it('starts with NONE root context', () => {
    const t = new ContextTraverser();
    expect(t.currentContext().mode).toBe(RuleMode.NONE);
  });

  it('enters and leaves directories correctly (no sibling leakage)', () => {
    const t = new ContextTraverser();

    // Enter dirA with .copyignore
    const rfA = mkRuleFile('/root/dirA/.copyignore', RuleType.IGNORE_FILE, [
      'node_modules/',
    ]);
    const ctxA = t.enterDirectory('/root/dirA', [rfA]);
    expect(ctxA.mode).toBe(RuleMode.IGNORE);
    expect(ctxA.patterns).toHaveLength(1);

    // Leave dirA
    t.leaveDirectory();

    // Enter dirB (no rule files) — should NOT have dirA's patterns
    const ctxB = t.enterDirectory('/root/dirB', []);
    expect(ctxB.mode).toBe(RuleMode.NONE);
    expect(ctxB.patterns).toHaveLength(0);

    t.leaveDirectory();
  });

  it('stacks correctly in nested directories', () => {
    const t = new ContextTraverser();

    // Root → IGNORE
    const rfRoot = mkRuleFile('/root/.copyignore', RuleType.IGNORE_FILE, [
      'node_modules/',
    ]);
    t.enterDirectory('/root', [rfRoot]);

    // Root/sub → IGNORE (stacks)
    const rfSub = mkRuleFile('/root/sub/.copyignore', RuleType.IGNORE_FILE, [
      'dist/',
    ]);
    const ctxSub = t.enterDirectory('/root/sub', [rfSub]);

    expect(ctxSub.mode).toBe(RuleMode.IGNORE);
    expect(ctxSub.patterns).toHaveLength(2);
    expect(ctxSub.patterns[0].patternText).toBe('node_modules/');
    expect(ctxSub.patterns[1].patternText).toBe('dist/');

    // Leave sub
    t.leaveDirectory();

    // Back at root — should have only root patterns
    expect(t.currentContext().patterns).toHaveLength(1);
    expect(t.currentContext().patterns[0].patternText).toBe('node_modules/');
  });

  it('resets on mode switch in nested directories', () => {
    const t = new ContextTraverser();

    // Root → IGNORE
    const rfRoot = mkRuleFile('/root/.copyignore', RuleType.IGNORE_FILE, [
      'node_modules/',
    ]);
    t.enterDirectory('/root', [rfRoot]);

    // Root/sub → INCLUDE (reset)
    const rfSub = mkRuleFile('/root/sub/.copyinclude', RuleType.INCLUDE_FILE, [
      'important.ts',
    ]);
    const ctxSub = t.enterDirectory('/root/sub', [rfSub]);

    expect(ctxSub.mode).toBe(RuleMode.INCLUDE);
    expect(ctxSub.patterns).toHaveLength(1);
    expect(ctxSub.patterns[0].patternText).toBe('important.ts');

    // Leave sub — back to IGNORE
    t.leaveDirectory();
    expect(t.currentContext().mode).toBe(RuleMode.IGNORE);
  });

  it('caches contexts by directory path', () => {
    const t = new ContextTraverser();

    const rf = mkRuleFile('/root/.copyignore', RuleType.IGNORE_FILE, [
      'node_modules/',
    ]);
    t.enterDirectory('/root', [rf]);
    t.leaveDirectory();

    // Second entry should use cache
    const cached = t.getCachedContext('/root');
    expect(cached).toBeDefined();
    expect(cached!.mode).toBe(RuleMode.IGNORE);
  });

  it('handles deep nesting with multiple mode switches', () => {
    const t = new ContextTraverser();

    // Level 1: IGNORE
    t.enterDirectory('/root', [
      mkRuleFile('/root/.copyignore', RuleType.IGNORE_FILE, ['*.log']),
    ]);
    expect(t.currentContext().mode).toBe(RuleMode.IGNORE);

    // Level 2: INCLUDE (reset from IGNORE)
    t.enterDirectory('/root/a', [
      mkRuleFile('/root/a/.copyinclude', RuleType.INCLUDE_FILE, ['src/']),
    ]);
    expect(t.currentContext().mode).toBe(RuleMode.INCLUDE);
    expect(t.currentContext().patterns).toHaveLength(1);

    // Level 3: IGNORE (reset from INCLUDE)
    t.enterDirectory('/root/a/b', [
      mkRuleFile('/root/a/b/.copyignore', RuleType.IGNORE_FILE, ['temp/']),
    ]);
    expect(t.currentContext().mode).toBe(RuleMode.IGNORE);
    expect(t.currentContext().patterns).toHaveLength(1);
    expect(t.currentContext().patterns[0].patternText).toBe('temp/');

    // Leave level 3 → back to INCLUDE
    t.leaveDirectory();
    expect(t.currentContext().mode).toBe(RuleMode.INCLUDE);

    // Leave level 2 → back to IGNORE
    t.leaveDirectory();
    expect(t.currentContext().mode).toBe(RuleMode.IGNORE);

    // Leave level 1 → back to NONE
    t.leaveDirectory();
    expect(t.currentContext().mode).toBe(RuleMode.NONE);
  });
});
