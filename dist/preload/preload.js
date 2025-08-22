"use strict";
const electron = require("electron");
const electronAPI = {
  getVersion: () => electron.ipcRenderer.invoke("app:getVersion"),
  openFileDialog: () => electron.ipcRenderer.invoke("dialog:openFile"),
  saveFileDialog: (defaultPath) => electron.ipcRenderer.invoke("dialog:saveFile", defaultPath),
  onMenuAction: (callback) => electron.ipcRenderer.on("menu-action", (_, action) => callback(action)),
  removeAllListeners: (channel) => electron.ipcRenderer.removeAllListeners(channel)
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
//# sourceMappingURL=preload.js.map
