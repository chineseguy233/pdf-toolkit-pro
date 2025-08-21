#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 最小化项目启动工具');
console.log('======================\n');

// 创建最基础的项目结构
console.log('📁 创建项目结构...');

const dirs = [
  'src',
  'src/main',
  'src/renderer',
  'src/shared',
  'dist',
  'assets'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ 创建目录: ${dir}`);
  }
});

// 创建基础的 main.js
console.log('\n📝 创建基础文件...');

const mainJs = `
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 开发环境加载 Vite 服务器
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
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
`;

fs.writeFileSync('src/main/main.js', mainJs);
console.log('✅ 创建 main.js');

// 创建 preload.js
const preloadJs = `
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 这里将来添加 IPC 通信接口
  platform: process.platform,
  version: process.versions.electron
});
`;

fs.writeFileSync('src/main/preload.js', preloadJs);
console.log('✅ 创建 preload.js');

// 创建基础的 React 应用
const appTsx = `
import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 PDF Toolkit Pro</h1>
      <p>项目已成功启动！</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>✅ 已完成:</h3>
        <ul>
          <li>Electron 应用框架</li>
          <li>React 前端框架</li>
          <li>基础项目结构</li>
        </ul>
      </div>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
        <h3>🚀 下一步:</h3>
        <ul>
          <li>添加 PDF 预览功能</li>
          <li>实现预览即编辑</li>
          <li>集成 AI 智能整理</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
`;

fs.writeFileSync('src/renderer/App.tsx', appTsx);
console.log('✅ 创建 App.tsx');

// 创建 main.tsx
const mainTsx = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
`;

fs.writeFileSync('src/renderer/main.tsx', mainTsx);
console.log('✅ 创建 main.tsx');

// 创建 index.html
const indexHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF Toolkit Pro</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
`;

fs.writeFileSync('src/renderer/index.html', indexHtml);
console.log('✅ 创建 index.html');

// 创建基础的 vite.config.ts
const viteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  build: {
    outDir: '../../dist/renderer'
  },
  server: {
    port: 5173
  }
});
`;

fs.writeFileSync('vite.config.ts', viteConfig);
console.log('✅ 创建 vite.config.ts');

console.log('\n🎯 最小化设置完成！');
console.log('\n📋 现在可以尝试启动项目:');
console.log('1. 等待 npm install 完成');
console.log('2. 运行 npm run dev');
console.log('3. 如果遇到问题，运行 npm run health-check');