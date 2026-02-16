"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: (args) => electron.ipcRenderer.invoke("selectFolder", args),
  selectDirectory: (args) => electron.ipcRenderer.invoke("selectDirectory", args),
  selectFiles: (args) => electron.ipcRenderer.invoke("selectFiles", args),
  getDefaultRuleFilePath: (args) => electron.ipcRenderer.invoke("getDefaultRuleFilePath", args),
  openRuleFileDialog: () => electron.ipcRenderer.invoke("openRuleFileDialog"),
  showSaveRuleFileDialog: (args) => electron.ipcRenderer.invoke("showSaveRuleFileDialog", args),
  checkRuleFileSave: (args) => electron.ipcRenderer.invoke("checkRuleFileSave", args),
  writeRuleFile: (args) => electron.ipcRenderer.invoke("writeRuleFile", args),
  hasOpenAIApiKey: () => electron.ipcRenderer.invoke("hasOpenAIApiKey"),
  setOpenAIApiKey: (args) => electron.ipcRenderer.invoke("setOpenAIApiKey", args),
  clearOpenAIApiKey: () => electron.ipcRenderer.invoke("clearOpenAIApiKey"),
  generateRulesWithOpenAI: (args) => electron.ipcRenderer.invoke("generateRulesWithOpenAI", args),
  scanFolderForAI: (args) => electron.ipcRenderer.invoke("scanFolderForAI", args),
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
  },
  // Menu action listener
  onMenuAction: (listener) => {
    electron.ipcRenderer.on("menu-action", (_event, data) => listener(data));
    return () => electron.ipcRenderer.removeListener("menu-action", listener);
  }
});
//# sourceMappingURL=index.js.map
