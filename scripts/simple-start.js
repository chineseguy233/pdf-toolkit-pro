#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 简化启动脚本');
console.log('================\n');

// 先尝试启动 Vite 开发服务器
console.log('📦 启动 Vite 开发服务器...');

const viteProcess = spawn('npx', ['vite', '--config', 'vite.config.ts'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true
});

viteProcess.on('error', (error) => {
  console.error('❌ Vite 启动失败:', error.message);
  console.log('\n🔧 尝试备用方案...');
  
  // 备用方案：直接使用 vite
  const backupProcess = spawn('node_modules\\.bin\\vite', [], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
  });
  
  backupProcess.on('error', (err) => {
    console.error('❌ 备用方案也失败:', err.message);
    console.log('\n💡 建议手动运行:');
    console.log('1. npx vite');
    console.log('2. 或者 npm install vite --force');
  });
});

viteProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ Vite 进程退出，代码: ${code}`);
  }
});

// 5秒后尝试启动 Electron
setTimeout(() => {
  console.log('\n⚡ 5秒后启动 Electron...');
  
  setTimeout(() => {
    console.log('🖥️ 启动 Electron...');
    
    const electronProcess = spawn('npx', ['electron', 'src/main/main.js'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    electronProcess.on('error', (error) => {
      console.error('❌ Electron 启动失败:', error.message);
      console.log('💡 请确保 Vite 服务器在 http://localhost:5173 运行');
    });
    
  }, 5000);
}, 1000);

console.log('\n📋 启动说明:');
console.log('1. Vite 开发服务器将在 http://localhost:5173 启动');
console.log('2. Electron 应用将在几秒后自动启动');
console.log('3. 如果遇到问题，请按 Ctrl+C 停止，然后手动启动');