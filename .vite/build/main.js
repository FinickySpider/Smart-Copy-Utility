"use strict";
const electron = require("electron");
const path = require("path");
function registerIpcHandlers() {
  electron.ipcMain.handle("selectFolder", async (_event, args) => {
    const win = electron.BrowserWindow.getFocusedWindow();
    const result = await electron.dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
      title: `Select ${args.kind === "source" ? "Source" : "Destination"} Folder`
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { path: null };
    }
    return { path: result.filePaths[0] };
  });
}
if (require("electron-squirrel-startup")) {
  electron.app.quit();
}
let mainWindow = null;
const createWindow = () => {
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  {
    mainWindow.loadURL("http://localhost:5173");
  }
};
electron.app.on("ready", () => {
  registerIpcHandlers();
  createWindow();
});
electron.app.on("window-all-closed", () => {
  electron.app.quit();
});
//# sourceMappingURL=main.js.map
