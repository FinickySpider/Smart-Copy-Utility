"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: (args) => electron.ipcRenderer.invoke("selectFolder", args),
  scan: (args) => electron.ipcRenderer.invoke("scan", args),
  listChildren: (args) => electron.ipcRenderer.invoke("listChildren", args),
  explain: (args) => electron.ipcRenderer.invoke("explain", args),
  openInExplorer: (args) => electron.ipcRenderer.invoke("openInExplorer", args),
  copyToClipboard: (args) => electron.ipcRenderer.invoke("copyToClipboard", args)
});
//# sourceMappingURL=index.js.map
