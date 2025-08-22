"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 暴露受保护的方法给渲染进程
const electronAPI = {
    getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
    openFileDialog: () => electron_1.ipcRenderer.invoke('dialog:openFile'),
    saveFileDialog: (defaultPath) => electron_1.ipcRenderer.invoke('dialog:saveFile', defaultPath),
    onMenuAction: (callback) => electron_1.ipcRenderer.on('menu-action', (_, action) => callback(action)),
    removeAllListeners: (channel) => electron_1.ipcRenderer.removeAllListeners(channel)
};
// 在window对象上暴露API
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
