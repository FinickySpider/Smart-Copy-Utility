import { describe, it, expect } from 'vitest';
import path from 'path';
import { matchPattern, matchPatterns } from '../../src/main/rules/matcher';
import { PatternEntry } from '../../src/main/rules/types';

// Helper to create a PatternEntry for testing
function mkPattern(text: string, ruleDir: string): PatternEntry {
  return {
    patternText: text,
    lineNumber: 1,
    ruleFilePath: path.join(ruleDir, '.copyignore'),
  };
}

describe('matchPattern — directory name patterns', () => {
  const ruleDir = 'C:\\project';

  it('matches a directory with the given name', () => {
    expect(
      matchPattern('node_modules/', 'C:\\project\\node_modules', true, ruleDir)
    ).toBe(true);
  });

  it('matches a directory nested deeper', () => {
    expect(
      matchPattern('node_modules/', 'C:\\project\\sub\\node_modules', true, ruleDir)
    ).toBe(true);
  });

  it('does not match outside the rule directory', () => {
    expect(
      matchPattern('node_modules/', 'C:\\other\\node_modules', true, ruleDir)
    ).toBe(false);
  });

  it('matches files inside a matching directory', () => {
    expect(
      matchPattern(
        'node_modules/',
        'C:\\project\\node_modules\\package\\index.js',
        false,
        ruleDir
      )
    ).toBe(true);
  });

  it('does not match files whose name contains the dir name', () => {
    expect(
      matchPattern('dist/', 'C:\\project\\distfile.txt', false, ruleDir)
    ).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(
      matchPattern('Node_Modules/', 'C:\\project\\node_modules', true, ruleDir)
    ).toBe(true);
  });
});

describe('matchPattern — glob patterns', () => {
  const ruleDir = 'C:\\project';

  it('matches *.log files', () => {
    expect(matchPattern('*.log', 'C:\\project\\debug.log', false, ruleDir)).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(matchPattern('*.log', 'C:\\project\\errors.LOG', false, ruleDir)).toBe(true);
  });

  it('does not match different extensions', () => {
    expect(matchPattern('*.log', 'C:\\project\\debug.txt', false, ruleDir)).toBe(false);
  });

  it('matches *.min.js', () => {
    expect(
      matchPattern('*.min.js', 'C:\\project\\bundle.min.js', false, ruleDir)
    ).toBe(true);
  });

  it('does not match partial extension', () => {
    expect(
      matchPattern('*.min.js', 'C:\\project\\bundle.js', false, ruleDir)
    ).toBe(false);
  });

  it('matches directories by glob', () => {
    expect(matchPattern('*.tmp', 'C:\\project\\cache.tmp', true, ruleDir)).toBe(true);
  });
});

describe('matchPattern — relative path patterns', () => {
  const ruleDir = 'C:\\project';

  it('matches exact relative path', () => {
    expect(
      matchPattern('src/main.ts', 'C:\\project\\src\\main.ts', false, ruleDir)
    ).toBe(true);
  });

  it('matches with backslash in pattern', () => {
    expect(
      matchPattern('src\\main.ts', 'C:\\project\\src\\main.ts', false, ruleDir)
    ).toBe(true);
  });

  it('does not match different file', () => {
    expect(
      matchPattern('src/main.ts', 'C:\\project\\src\\other.ts', false, ruleDir)
    ).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(
      matchPattern('src/Main.TS', 'C:\\project\\src\\main.ts', false, ruleDir)
    ).toBe(true);
  });

  it('matches simple filename as relative path', () => {
    expect(
      matchPattern('README.md', 'C:\\project\\README.md', false, ruleDir)
    ).toBe(true);
  });

  it('matches files inside a directory specified without trailing slash', () => {
    expect(
      matchPattern('src', 'C:\\project\\src\\index.ts', false, ruleDir)
    ).toBe(true);
  });
});

describe('matchPatterns — returns all matches', () => {
  const ruleDir = 'C:\\project';

  it('returns all matching patterns for explainability', () => {
    const patterns: PatternEntry[] = [
      mkPattern('*.log', ruleDir),
      mkPattern('debug.log', ruleDir),
      mkPattern('*.txt', ruleDir),
    ];

    const result = matchPatterns(
      patterns,
      'C:\\project\\debug.log',
      false,
      ruleDir
    );

    expect(result.matched).toBe(true);
    expect(result.matchingPatterns).toHaveLength(2);
    expect(result.matchingPatterns.map((p) => p.patternText)).toEqual(
      expect.arrayContaining(['*.log', 'debug.log'])
    );
  });

  it('returns empty when nothing matches', () => {
    const patterns: PatternEntry[] = [
      mkPattern('*.log', ruleDir),
      mkPattern('node_modules/', ruleDir),
    ];

    const result = matchPatterns(
      patterns,
      'C:\\project\\src\\index.ts',
      false,
      ruleDir
    );

    expect(result.matched).toBe(false);
    expect(result.matchingPatterns).toHaveLength(0);
  });

  it('handles patterns from different rule file directories', () => {
    const patterns: PatternEntry[] = [
      {
        patternText: 'README.md',
        lineNumber: 1,
        ruleFilePath: 'C:\\project\\.copyignore',
      },
      {
        patternText: 'README.md',
        lineNumber: 1,
        ruleFilePath: 'C:\\project\\sub\\.copyignore',
      },
    ];

    // Only the first pattern should match C:\project\README.md
    const result = matchPatterns(
      patterns,
      'C:\\project\\README.md',
      false,
      ruleDir
    );

    expect(result.matched).toBe(true);
    // The pattern from C:\project matches; the one from C:\project\sub does not
    expect(result.matchingPatterns).toHaveLength(1);
    expect(result.matchingPatterns[0].ruleFilePath).toBe(
      'C:\\project\\.copyignore'
    );
  });
});
