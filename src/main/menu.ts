import { app, Menu, shell, BrowserWindow } from 'electron';

export function createApplicationMenu(mainWindow: BrowserWindow): void {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Source Folder',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('menu-action', { action: 'selectSourceFolder' });
          },
        },
        {
          label: 'Open Destination Folder',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => {
            mainWindow.webContents.send('menu-action', { action: 'selectDestFolder' });
          },
        },
        { type: 'separator' },
        {
          label: 'Open Rule File',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-action', { action: 'openRuleFile' });
          },
        },
        {
          label: 'Save Rule File',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-action', { action: 'saveRuleFile' });
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    // View Menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Switch to Copy Tab',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('menu-action', { action: 'switchToCopyTab' });
          },
        },
        {
          label: 'Switch to Rules Tab',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('menu-action', { action: 'switchToRulesTab' });
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
            ]
          : [
              { role: 'close' as const },
            ]),
      ],
    },
    // Help Menu
    {
      role: 'help',
      submenu: [
        {
          label: 'View Documentation',
          click: async () => {
            await shell.openExternal('https://github.com/FinickySpider/Smart-Copy-Utility');
          },
        },
        { type: 'separator' },
        {
          label: 'About Smart Copy Utility',
          click: () => {
            const aboutMessage = `Smart Copy Utility
Version: ${app.getVersion()}
Electron: ${process.versions.electron}
Chrome: ${process.versions.chrome}
Node.js: ${process.versions.node}

A Windows desktop app for copying large folder trees using robocopy with hierarchical rule files.`;

            // Send to renderer to show in a modal/dialog
            mainWindow.webContents.send('menu-action', { 
              action: 'showAbout', 
              message: aboutMessage 
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
