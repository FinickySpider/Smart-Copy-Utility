import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  parseRuleContent,
  parseRuleFile,
  getRuleTypeFromFileName,
  findRuleFilesInDir,
} from '../../src/main/rules/parser';
import { RuleType } from '../../src/main/rules/types';

// Temp directory for test files
let tmpDir: string;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scu-parser-test-'));
});

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('getRuleTypeFromFileName', () => {
  it('recognizes .copyignore', () => {
    expect(getRuleTypeFromFileName('.copyignore')).toBe(RuleType.IGNORE_FILE);
  });

  it('recognizes .copyinclude', () => {
    expect(getRuleTypeFromFileName('.copyinclude')).toBe(RuleType.INCLUDE_FILE);
  });

  it('is case-insensitive', () => {
    expect(getRuleTypeFromFileName('.CopyIgnore')).toBe(RuleType.IGNORE_FILE);
    expect(getRuleTypeFromFileName('.COPYINCLUDE')).toBe(RuleType.INCLUDE_FILE);
    expect(getRuleTypeFromFileName('.CoPyIgNoRe')).toBe(RuleType.IGNORE_FILE);
  });

  it('returns null for unrelated files', () => {
    expect(getRuleTypeFromFileName('.gitignore')).toBeNull();
    expect(getRuleTypeFromFileName('README.md')).toBeNull();
    expect(getRuleTypeFromFileName('.copyignore.bak')).toBeNull();
  });
});

describe('parseRuleContent', () => {
  it('parses patterns with line numbers', () => {
    const content = 'node_modules/\n*.log\nsrc/main.ts';
    const result = parseRuleContent(content, '/test/.copyignore');

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      patternText: 'node_modules/',
      lineNumber: 1,
      ruleFilePath: '/test/.copyignore',
    });
    expect(result[1]).toEqual({
      patternText: '*.log',
      lineNumber: 2,
      ruleFilePath: '/test/.copyignore',
    });
    expect(result[2]).toEqual({
      patternText: 'src/main.ts',
      lineNumber: 3,
      ruleFilePath: '/test/.copyignore',
    });
  });

  it('skips blank lines', () => {
    const content = 'a/\n\n\nb/\n';
    const result = parseRuleContent(content, '/test/.copyignore');

    expect(result).toHaveLength(2);
    expect(result[0].patternText).toBe('a/');
    expect(result[0].lineNumber).toBe(1);
    expect(result[1].patternText).toBe('b/');
    expect(result[1].lineNumber).toBe(4);
  });

  it('skips comment lines starting with #', () => {
    const content = '# This is a comment\nnode_modules/\n# Another comment\n*.log';
    const result = parseRuleContent(content, '/test/.copyignore');

    expect(result).toHaveLength(2);
    expect(result[0].patternText).toBe('node_modules/');
    expect(result[0].lineNumber).toBe(2);
    expect(result[1].patternText).toBe('*.log');
    expect(result[1].lineNumber).toBe(4);
  });

  it('trims whitespace from patterns', () => {
    const content = '  node_modules/  \n  *.log  ';
    const result = parseRuleContent(content, '/test/.copyignore');

    expect(result).toHaveLength(2);
    expect(result[0].patternText).toBe('node_modules/');
    expect(result[1].patternText).toBe('*.log');
  });

  it('handles empty content', () => {
    expect(parseRuleContent('', '/test/.copyignore')).toEqual([]);
  });

  it('handles content with only comments and blank lines', () => {
    const content = '# comment\n\n# another\n\n';
    expect(parseRuleContent(content, '/test/.copyignore')).toEqual([]);
  });

  it('handles Windows line endings (CRLF)', () => {
    const content = 'a/\r\nb/\r\nc/';
    const result = parseRuleContent(content, '/test/.copyignore');
    expect(result).toHaveLength(3);
  });
});

describe('parseRuleFile', () => {
  it('parses a .copyignore file', async () => {
    const filePath = path.join(tmpDir, '.copyignore');
    await fs.writeFile(filePath, '# Ignore generated\nnode_modules/\ndist/\n*.log');

    const result = await parseRuleFile(filePath);

    expect(result).not.toBeNull();
    expect(result!.type).toBe(RuleType.IGNORE_FILE);
    expect(result!.path).toBe(filePath);
    expect(result!.lines).toHaveLength(3);
    expect(result!.lines[0].patternText).toBe('node_modules/');
    expect(result!.lines[1].patternText).toBe('dist/');
    expect(result!.lines[2].patternText).toBe('*.log');
  });

  it('parses a .copyinclude file', async () => {
    const subDir = path.join(tmpDir, 'include-test');
    await fs.mkdir(subDir, { recursive: true });
    const filePath = path.join(subDir, '.copyinclude');
    await fs.writeFile(filePath, 'src/\nREADME.md\npackage.json');

    const result = await parseRuleFile(filePath);

    expect(result).not.toBeNull();
    expect(result!.type).toBe(RuleType.INCLUDE_FILE);
    expect(result!.lines).toHaveLength(3);
  });

  it('returns null for non-rule files', async () => {
    const filePath = path.join(tmpDir, 'README.md');
    await fs.writeFile(filePath, '# Hello');

    expect(await parseRuleFile(filePath)).toBeNull();
  });

  it('returns null for missing files', async () => {
    expect(await parseRuleFile(path.join(tmpDir, 'nonexistent'))).toBeNull();
  });

  it('handles empty rule file', async () => {
    const filePath = path.join(tmpDir, 'empty-test', '.copyignore');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, '');

    const result = await parseRuleFile(filePath);
    expect(result).not.toBeNull();
    expect(result!.lines).toHaveLength(0);
  });
});

describe('findRuleFilesInDir', () => {
  it('finds .copyignore in a directory', async () => {
    const dir = path.join(tmpDir, 'find-ignore');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, '.copyignore'), 'node_modules/');
    await fs.writeFile(path.join(dir, 'other.txt'), 'not a rule file');

    const results = await findRuleFilesInDir(dir);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe(RuleType.IGNORE_FILE);
  });

  it('finds .copyinclude in a directory', async () => {
    const dir = path.join(tmpDir, 'find-include');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, '.copyinclude'), 'src/');

    const results = await findRuleFilesInDir(dir);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe(RuleType.INCLUDE_FILE);
  });

  it('finds both rule files (conflict scenario)', async () => {
    const dir = path.join(tmpDir, 'find-conflict');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, '.copyignore'), 'a/');
    await fs.writeFile(path.join(dir, '.copyinclude'), 'b/');

    const results = await findRuleFilesInDir(dir);
    expect(results).toHaveLength(2);
    const types = results.map((r) => r.type).sort();
    expect(types).toEqual([RuleType.IGNORE_FILE, RuleType.INCLUDE_FILE]);
  });

  it('returns empty for directory with no rule files', async () => {
    const dir = path.join(tmpDir, 'find-none');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'file.txt'), 'hello');

    expect(await findRuleFilesInDir(dir)).toHaveLength(0);
  });

  it('returns empty for nonexistent directory', async () => {
    expect(await findRuleFilesInDir(path.join(tmpDir, 'nope'))).toHaveLength(0);
  });

  it('detects case-insensitive rule file names', async () => {
    const dir = path.join(tmpDir, 'find-case');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, '.CopyIgnore'), 'node_modules/');

    const results = await findRuleFilesInDir(dir);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe(RuleType.IGNORE_FILE);
  });
});
