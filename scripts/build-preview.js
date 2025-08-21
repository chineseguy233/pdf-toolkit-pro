const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建PDF工具预览版本...');

// 检查必要的依赖
const requiredDeps = ['electron', 'vite'];
const missingDeps = [];

requiredDeps.forEach(dep => {
  try {
    require.resolve(dep);
    console.log(`✅ ${dep} 已安装`);
  } catch (e) {
    missingDeps.push(dep);
    console.log(`❌ ${dep} 缺失`);
  }
});

if (missingDeps.length > 0) {
  console.log('⚠️  正在安装缺失的依赖...');
  try {
    execSync(`npm install ${missingDeps.join(' ')} --legacy-peer-deps`, { stdio: 'inherit' });
  } catch (error) {
    console.log('❌ 依赖安装失败，使用简化模式');
  }
}

// 创建简化的主进程文件
const simpleMainJs = `
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
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'PDF工具专业版 - 预览版'
  });

  // 加载预览页面
  const previewPath = path.join(__dirname, '../preview.html');
  mainWindow.loadFile(previewPath);

  // 开发模式下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

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
`;

// 写入简化的主进程文件
fs.writeFileSync(path.join(__dirname, '../src/main/main-preview.js'), simpleMainJs);

// 创建预览版package.json
const previewPackage = {
  "name": "pdf-toolkit-preview",
  "version": "1.0.0-preview",
  "description": "PDF工具专业版 - 预览版",
  "main": "src/main/main-preview.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "pack": "electron-builder --dir"
  },
  "build": {
    "appId": "com.pdftool.preview",
    "productName": "PDF工具预览版",
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/main/main-preview.js",
      "preview.html",
      "assets/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  },
  "devDependencies": {
    "electron": "^27.0.0",
    "electron-builder": "^24.0.0"
  }
};

fs.writeFileSync(path.join(__dirname, '../package-preview.json'), JSON.stringify(previewPackage, null, 2));

console.log('✅ 预览版构建脚本准备完成');
console.log('📝 使用以下命令启动预览版:');
console.log('   npm run start:preview');