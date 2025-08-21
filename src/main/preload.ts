import { contextBridge, ipcRenderer } from 'electron'

// 定义API接口
export interface ElectronAPI {
  getVersion: () => Promise<string>
  openFileDialog: () => Promise<Electron.OpenDialogReturnValue>
  saveFileDialog: (defaultPath: string) => Promise<Electron.SaveDialogReturnValue>
  onMenuAction: (callback: (action: string) => void) => void
  removeAllListeners: (channel: string) => void
}

// 暴露受保护的方法给渲染进程
const electronAPI: ElectronAPI = {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: (defaultPath: string) => ipcRenderer.invoke('dialog:saveFile', defaultPath),
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (_, action) => callback(action)),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
}

// 在window对象上暴露API
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 类型声明
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}