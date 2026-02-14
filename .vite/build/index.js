"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: (args) => electron.ipcRenderer.invoke("selectFolder", args)
});
//# sourceMappingURL=index.js.map
