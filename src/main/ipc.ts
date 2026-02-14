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

// Global executor instance for copy operations
let currentExecutor: CopyExecutor | null = null;

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
