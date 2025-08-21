
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 这里将来添加 IPC 通信接口
  platform: process.platform,
  version: process.versions.electron
});
