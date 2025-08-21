const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    title: 'PDF工具专业版 - 预览版',
    show: false
  });

  // 加载预览页面
  const previewPath = path.join(__dirname, '../../preview.html');
  mainWindow.loadFile(previewPath);

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('PDF工具预览版已启动！');
  });

  // 开发模式下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  console.log('Electron应用已准备就绪');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 模拟IPC处理
ipcMain.handle('import-files', async () => {
  return ['示例文件1.pdf', '示例文件2.pdf'];
});

ipcMain.handle('process-ocr', async (event, data) => {
  return { text: '这是OCR识别的示例文本', confidence: 0.95 };
});

console.log('PDF工具预览版主进程已加载');