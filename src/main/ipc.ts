import { ipcMain, dialog, BrowserWindow, shell, clipboard } from 'electron';
import { scan } from './scanner';
import { listChildren } from './scanner/listChildren';
import { explain } from './scanner/explain';
import { ScanArgs } from './scanner/types';
import { ListChildrenArgs } from './scanner/listChildren';
import { ExplainArgs } from './scanner/explain';
import { dryRun } from './copier/dryRun';
import { CopyExecutor } from './copier/executor';
import { JobPlanOptions } from './copier/types';
import path from 'path';
import fs from 'fs/promises';
import { clearOpenAIApiKey, getOpenAIApiKey, hasOpenAIApiKey, setOpenAIApiKey, getRobocopyThreads, setRobocopyThreads, getScannerThreads, setScannerThreads, getLastUsedPaths, setLastUsedPaths } from './settings';
import { generateRulesWithOpenAI, RuleType } from './openai';
import { scanFolder, formatFolderStructure } from './folderScanner';

// Global executor instance for copy operations
let currentExecutor: CopyExecutor | null = null;

function getExpectedRuleFileName(ruleType: RuleType): string {
  return ruleType === 'copyignore' ? '.copyignore' : '.copyinclude';
}

function detectRuleTypeFromPath(filePath: string): RuleType | null {
  const base = path.basename(filePath).toLowerCase();
  if (base === '.copyignore') return 'copyignore';
  if (base === '.copyinclude') return 'copyinclude';
  return null;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function buildFileSummaries(filePaths: string[], includeFileContents: boolean): Promise<string> {
  const maxFiles = 25;
  const maxCharsTotal = 60_000;
  const maxCharsPerFile = 8_000;

  const selected = filePaths.slice(0, maxFiles);
  const lines: string[] = [];
  let used = 0;

  for (const fp of selected) {
    try {
      const stat = await fs.stat(fp);
      const header = `- ${fp} (${stat.size} bytes)`;
      if (used + header.length + 1 > maxCharsTotal) break;
      lines.push(header);
      used += header.length + 1;

      if (includeFileContents && stat.isFile() && stat.size > 0 && stat.size < 200_000) {
        const raw = await fs.readFile(fp);
        // crude binary detection
        if (raw.includes(0)) {
          continue;
        }
        const text = raw.toString('utf8');
        const snippet = text.length > maxCharsPerFile ? text.slice(0, maxCharsPerFile) + '\n…(truncated)…' : text;
        const block = `  content:\n${snippet.replace(/\n/g, '\n  ')}`;
        if (used + block.length + 2 > maxCharsTotal) break;
        lines.push(block);
        used += block.length + 2;
      }
    } catch {
      // ignore unreadable files
    }
  }

  if (filePaths.length > maxFiles) {
    lines.push(`(Only first ${maxFiles} files included)`);
  }

  return lines.join('\n');
}

export function registerIpcHandlers(): void {
  ipcMain.handle('selectFolder', async (_event, args: { kind: string }) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory'],
      title: `Select ${args.kind === 'source' ? 'Source' : 'Destination'} Folder`,
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { path: null };
    }

    return { path: result.filePaths[0] };
  });

  ipcMain.handle('selectDirectory', async (_event, args: { title: string }) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory'],
      title: args.title || 'Select folder',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { path: null };
    }

    return { path: result.filePaths[0] };
  });

  ipcMain.handle('selectFiles', async (_event, args: { title: string; multi: boolean }) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win!, {
      properties: args.multi ? ['openFile', 'multiSelections'] : ['openFile'],
      title: args.title || 'Select files',
    });

    if (result.canceled) {
      return { success: true, filePaths: [] as string[] };
    }

    return { success: true, filePaths: result.filePaths };
  });

  ipcMain.handle('getDefaultRuleFilePath', async (_event, args: { folderPath: string; ruleType: RuleType }) => {
    const fileName = getExpectedRuleFileName(args.ruleType);
    return { filePath: path.join(args.folderPath, fileName) };
  });

  ipcMain.handle('openRuleFileDialog', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile'],
      title: 'Open .copyignore or .copyinclude',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Open cancelled' };
    }

    const filePath = result.filePaths[0];
    const ruleType = detectRuleTypeFromPath(filePath);
    if (!ruleType) {
      return { success: false, error: 'Selected file is not .copyignore or .copyinclude' };
    }

    try {
      const content = await fs.readFile(filePath, 'utf8');
      return { success: true, filePath, ruleType, content };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('showSaveRuleFileDialog', async (_event, args: { ruleType: RuleType; defaultDir?: string }) => {
    const win = BrowserWindow.getFocusedWindow();
    const fileName = getExpectedRuleFileName(args.ruleType);
    const result = await dialog.showSaveDialog(win!, {
      title: `Save ${fileName}`,
      defaultPath: args.defaultDir ? path.join(args.defaultDir, fileName) : fileName,
    });

    if (result.canceled || !result.filePath) {
      return { filePath: null };
    }
    return { filePath: result.filePath };
  });

  ipcMain.handle('checkRuleFileSave', async (_event, args: { targetPath: string; ruleType: RuleType }) => {
    try {
      const expectedName = getExpectedRuleFileName(args.ruleType);
      if (path.basename(args.targetPath).toLowerCase() !== expectedName) {
        return { success: false, error: `File name must be exactly ${expectedName}` };
      }

      const dir = path.dirname(args.targetPath);
      const otherType: RuleType = args.ruleType === 'copyignore' ? 'copyinclude' : 'copyignore';
      const otherPath = path.join(dir, getExpectedRuleFileName(otherType));
      const otherTypeExists = await fileExists(otherPath);
      const targetExists = await fileExists(args.targetPath);

      return {
        success: true,
        targetExists,
        otherTypeExists,
        otherTypePath: otherTypeExists ? otherPath : null,
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(
    'writeRuleFile',
    async (
      _event,
      args: {
        targetPath: string;
        ruleType: RuleType;
        content: string;
        overwriteExisting: boolean;
        allowConflict: boolean;
      }
    ) => {
      try {
        const expectedName = getExpectedRuleFileName(args.ruleType);
        if (path.basename(args.targetPath).toLowerCase() !== expectedName) {
          return { success: false, error: `File name must be exactly ${expectedName}` };
        }

        const dir = path.dirname(args.targetPath);
        const otherType: RuleType = args.ruleType === 'copyignore' ? 'copyinclude' : 'copyignore';
        const otherPath = path.join(dir, getExpectedRuleFileName(otherType));

        const otherExists = await fileExists(otherPath);
        if (otherExists && !args.allowConflict) {
          return { success: false, error: `Conflict: ${otherPath} already exists in this folder` };
        }

        const targetExists = await fileExists(args.targetPath);
        if (targetExists && !args.overwriteExisting) {
          return { success: false, error: 'Target file already exists. Overwrite not allowed.' };
        }

        await fs.writeFile(args.targetPath, args.content ?? '', 'utf8');
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  );

  // OpenAI settings
  ipcMain.handle('hasOpenAIApiKey', async () => {
    try {
      return { hasKey: await hasOpenAIApiKey() };
    } catch {
      return { hasKey: false };
    }
  });

  ipcMain.handle('setOpenAIApiKey', async (_event, args: { apiKey: string }) => {
    try {
      await setOpenAIApiKey(args.apiKey);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('clearOpenAIApiKey', async () => {
    try {
      await clearOpenAIApiKey();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Performance settings
  ipcMain.handle('getRobocopyThreads', async () => {
    try {
      return { threads: await getRobocopyThreads() };
    } catch (error) {
      return { threads: 8, error: String(error) };
    }
  });

  ipcMain.handle('setRobocopyThreads', async (_event, args: { threads: number }) => {
    try {
      await setRobocopyThreads(args.threads);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('getScannerThreads', async () => {
    try {
      return { threads: await getScannerThreads() };
    } catch (error) {
      return { threads: Math.max(1, Math.floor(require('os').cpus().length / 2)), error: String(error) };
    }
  });

  ipcMain.handle('setScannerThreads', async (_event, args: { threads: number }) => {
    try {
      await setScannerThreads(args.threads);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Last used paths
  ipcMain.handle('getLastUsedPaths', async () => {
    try {
      return await getLastUsedPaths();
    } catch (error) {
      return { source: undefined, dest: undefined, error: String(error) };
    }
  });

  ipcMain.handle('setLastUsedPaths', async (_event, args: { source?: string; dest?: string }) => {
    try {
      await setLastUsedPaths(args.source, args.dest);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(
    'generateRulesWithOpenAI',
    async (
      _event,
      args: {
        model: string;
        ruleType: RuleType;
        instruction: string;
        currentText: string;
        filePaths: string[];
        includeFileContents: boolean;
        folderStructure?: string;
      }
    ) => {
      try {
        const apiKey = await getOpenAIApiKey();
        if (!apiKey) {
          return { success: false, error: 'OpenAI API key is not configured.' };
        }

        let fileSummaries = await buildFileSummaries(args.filePaths ?? [], args.includeFileContents);
        
        // Add folder structure if provided
        if (args.folderStructure) {
          if (fileSummaries.length > 0) {
            fileSummaries += '\n\n=== Scanned Folder Structure ===\n' + args.folderStructure;
          } else {
            fileSummaries = '=== Scanned Folder Structure ===\n' + args.folderStructure;
          }
        }

        const generatedText = await generateRulesWithOpenAI({
          apiKey,
          model: args.model,
          ruleType: args.ruleType,
          instruction: args.instruction,
          currentText: args.currentText ?? '',
          fileSummaries,
        });

        return { success: true, generatedText };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  );

  ipcMain.handle('scanFolderForAI', async (_event, args: { folderPath: string; recursive: boolean }) => {
    try {
      const structure = await scanFolder(args.folderPath, args.recursive);
      const formatted = formatFolderStructure(structure);
      return { success: true, structure, formatted };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('scan', async (_event, args: ScanArgs) => {
    return await scan(args);
  });

  ipcMain.handle('listChildren', async (_event, args: ListChildrenArgs) => {
    return await listChildren(args);
  });

  ipcMain.handle('explain', async (_event, args: ExplainArgs) => {
    return await explain(args);
  });

  ipcMain.handle('openInExplorer', async (_event, args: { dirPath: string }) => {
    try {
      await shell.openPath(args.dirPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('copyToClipboard', async (_event, args: { text: string }) => {
    try {
      clipboard.writeText(args.text);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('dryRun', async (_event, args: JobPlanOptions) => {
    try {
      const report = await dryRun(args);
      return { success: true, report };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('copy', async (event, args: JobPlanOptions) => {
    try {
      // Stop any existing copy operation
      if (currentExecutor) {
        currentExecutor.cancel();
      }

      // Create new executor
      currentExecutor = new CopyExecutor();
      const win = BrowserWindow.fromWebContents(event.sender);

      // Wire up event forwarding
      currentExecutor.on('status', (status) => {
        win?.webContents.send('copy:status', { status });
      });

      currentExecutor.on('jobStart', (jobId, srcRoot, dstRoot) => {
        win?.webContents.send('copy:jobStart', { jobId, srcRoot, dstRoot });
      });

      currentExecutor.on('jobEnd', (jobId, success, exitCode) => {
        win?.webContents.send('copy:jobEnd', { jobId, success, exitCode });
      });

      currentExecutor.on('logLine', (line) => {
        win?.webContents.send('copy:logLine', { line });
      });

      currentExecutor.on('done', () => {
        win?.webContents.send('copy:done', {});
        currentExecutor = null;
      });

      currentExecutor.on('error', (error) => {
        win?.webContents.send('copy:error', { error: String(error) });
        currentExecutor = null;
      });

      // Execute the copy
      await currentExecutor.execute(args);
      return { success: true };
    } catch (error) {
      currentExecutor = null;
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('cancel', async () => {
    try {
      if (currentExecutor) {
        currentExecutor.cancel();
        currentExecutor = null;
        return { success: true };
      }
      return { success: false, error: 'No active copy operation' };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
