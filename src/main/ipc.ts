import { ipcMain, dialog, BrowserWindow, shell, clipboard } from 'electron';
import { scan } from './scanner';
import { listChildren } from './scanner/listChildren';
import { explain } from './scanner/explain';
import { ScanArgs } from './scanner/types';
import { ListChildrenArgs } from './scanner/listChildren';
import { ExplainArgs } from './scanner/explain';
import path from 'path';

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
}
