"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: (args) => electron.ipcRenderer.invoke("selectFolder", args),
  scan: (args) => electron.ipcRenderer.invoke("scan", args),
  listChildren: (args) => electron.ipcRenderer.invoke("listChildren", args),
  explain: (args) => electron.ipcRenderer.invoke("explain", args),
  openInExplorer: (args) => electron.ipcRenderer.invoke("openInExplorer", args),
  copyToClipboard: (args) => electron.ipcRenderer.invoke("copyToClipboard", args),
  dryRun: (args) => electron.ipcRenderer.invoke("dryRun", args),
  copy: (args) => electron.ipcRenderer.invoke("copy", args),
  cancel: () => electron.ipcRenderer.invoke("cancel"),
  // Event listeners for copy progress
  onCopyStatus: (listener) => {
    electron.ipcRenderer.on("copy:status", (_event, data) => listener(data));
    return () => electron.ipcRenderer.removeListener("copy:status", listener);
  },
  onCopyJobStart: (listener) => {
    electron.ipcRenderer.on("copy:jobStart", (_event, data) => listener(data));
    return () => electron.ipcRenderer.removeListener("copy:jobStart", listener);
  },
  onCopyJobEnd: (listener) => {
    electron.ipcRenderer.on("copy:jobEnd", (_event, data) => listener(data));
    return () => electron.ipcRenderer.removeListener("copy:jobEnd", listener);
  },
  onCopyLogLine: (listener) => {
    electron.ipcRenderer.on("copy:logLine", (_event, data) => listener(data));
    return () => electron.ipcRenderer.removeListener("copy:logLine", listener);
  },
  onCopyDone: (listener) => {
    electron.ipcRenderer.on("copy:done", (_event, data) => listener(data));
    return () => electron.ipcRenderer.removeListener("copy:done", listener);
  },
  onCopyError: (listener) => {
    electron.ipcRenderer.on("copy:error", (_event, data) => listener(data));
    return () => electron.ipcRenderer.removeListener("copy:error", listener);
  }
});
//# sourceMappingURL=index.js.map
