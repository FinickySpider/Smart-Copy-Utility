import { ipcMain, dialog, BrowserWindow } from 'electron';

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
}
