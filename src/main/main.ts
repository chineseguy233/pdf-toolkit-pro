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
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      enableRemoteModule: false,
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

  // 开发环境：连接到Vite开发服务器
  if (process.env.NODE_ENV === 'development') {
    const rendererUrl = 'http://localhost:5175'
    console.log('🚀 Loading PDF Toolkit Pro app:', rendererUrl)
    
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('✅ PDF Toolkit Pro loaded successfully!')
      console.log('🎉 完整PDF应用就绪!')
      // 保持开发者工具打开以便调试
      mainWindow.webContents.openDevTools()
    })
    
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('❌ Failed to load PDF app:', errorCode, errorDescription, validatedURL)
      console.log('🔄 Falling back to React test...')
      const testPageUrl = 'http://localhost:5174/standalone-react-test.html'
      mainWindow.loadURL(testPageUrl)
    })
    
    // 加载完整的PDF应用
    mainWindow.loadURL(rendererUrl)
  } else {
    // 生产环境：加载构建后的文件
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
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