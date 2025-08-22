"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const electron_updater_1 = require("electron-updater");
// 设置应用程序的基本配置
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
let mainWindow = null;
function createWindow() {
    // 创建主窗口
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        show: false,
        autoHideMenuBar: true,
        titleBarStyle: 'default',
        webPreferences: {
            preload: (0, path_1.join)(__dirname, 'preload.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    mainWindow.on('ready-to-show', () => {
        mainWindow?.show();
    });
    mainWindow.webContents.setWindowOpenHandler((details) => {
        electron_1.shell.openExternal(details.url);
        return { action: 'deny' };
    });
    // 强制使用开发模式连接到Vite开发服务器
    const rendererUrl = 'http://localhost:5176';
    console.log('🚀 Loading PDF Toolkit Pro app:', rendererUrl);
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('✅ PDF Toolkit Pro loaded successfully!');
        console.log('🎉 完整PDF应用就绪!');
        // 保持开发者工具打开以便调试
        mainWindow?.webContents.openDevTools();
    });
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('❌ Failed to load PDF app:', errorCode, errorDescription, validatedURL);
        console.log('❌ Please check if Vite dev server is running on http://localhost:5176');
    });
    // 加载完整的PDF应用
    mainWindow.loadURL(rendererUrl);
}
// 应用程序准备就绪时创建窗口
electron_1.app.whenReady().then(() => {
    // 设置应用程序用户模型ID（Windows）
    electron_1.app.setAppUserModelId('com.pdftoolkit.pro');
    createWindow();
    electron_1.app.on('activate', function () {
        // macOS上，当点击dock图标并且没有其他窗口打开时，重新创建窗口
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
// 当所有窗口都被关闭时退出应用程序，除了macOS
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// IPC处理程序
electron_1.ipcMain.handle('app:getVersion', () => {
    return electron_1.app.getVersion();
});
electron_1.ipcMain.handle('dialog:openFile', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    return result;
});
electron_1.ipcMain.handle('dialog:saveFile', async (_, defaultPath) => {
    const result = await electron_1.dialog.showSaveDialog(mainWindow, {
        defaultPath,
        filters: [
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    return result;
});
// 自动更新
if (process.env.NODE_ENV === 'production') {
    electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
}
