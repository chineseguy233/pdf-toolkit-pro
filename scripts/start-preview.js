const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 启动PDF工具预览版...');

// 检查electron是否可用
let electronPath;
try {
  electronPath = require.resolve('electron');
  console.log('✅ 找到Electron:', electronPath);
} catch (e) {
  console.log('❌ 未找到Electron，尝试全局安装...');
  try {
    const { execSync } = require('child_process');
    execSync('npm install -g electron', { stdio: 'inherit' });
    electronPath = 'electron';
  } catch (installError) {
    console.log('❌ Electron安装失败，请手动安装: npm install -g electron');
    process.exit(1);
  }
}

// 启动Electron应用
const mainFile = path.join(__dirname, '../src/main/main-preview.js');
const electron = spawn(electronPath, [mainFile], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

electron.on('close', (code) => {
  console.log(`Electron进程退出，代码: ${code}`);
});

electron.on('error', (error) => {
  console.error('启动Electron时出错:', error);
});

console.log('📱 PDF工具预览版正在启动...');
console.log('💡 如果窗口没有出现，请检查防火墙设置');