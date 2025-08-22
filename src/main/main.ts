import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'

// 设置应用程序的基本配置
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // 创建主窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details: any) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 强制使用开发模式连接到Vite开发服务器
  const rendererUrl = 'http://localhost:5176'
  console.log('🚀 Loading PDF Toolkit Pro app:', rendererUrl)
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ PDF Toolkit Pro loaded successfully!')
    console.log('🎉 完整PDF应用就绪!')
    // 保持开发者工具打开以便调试
    mainWindow?.webContents.openDevTools()
  })
  
  mainWindow.webContents.on('did-fail-load', (event: any, errorCode: any, errorDescription: any, validatedURL: any) => {
    console.error('❌ Failed to load PDF app:', errorCode, errorDescription, validatedURL)
    console.log('🔄 Retrying connection to Vite server...')
    setTimeout(() => {
      mainWindow?.loadURL(rendererUrl)
    }, 2000)
  })
  
  // 加载完整的PDF应用
  mainWindow.loadURL(rendererUrl)
}

// 应用程序准备就绪时创建窗口
app.whenReady().then(() => {
  // 设置应用程序用户模型ID（Windows）
  app.setAppUserModelId('com.pdftoolkit.pro')

  createWindow()

  app.on('activate', function () {
    // macOS上，当点击dock图标并且没有其他窗口打开时，重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 当所有窗口都被关闭时退出应用程序，除了macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC处理程序
ipcMain.handle('app:getVersion', () => {
  return app.getVersion()
})

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return result
})

ipcMain.handle('dialog:saveFile', async (_: any, defaultPath: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath,
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return result
})

// 自动更新
if (process.env.NODE_ENV === 'production') {
  autoUpdater.checkForUpdatesAndNotify()
}