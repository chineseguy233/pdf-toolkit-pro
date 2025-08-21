#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('⚡ 快速依赖修复工具');
console.log('==================\n');

// 检查网络连接
console.log('🌐 检查网络连接...');
try {
  execSync('ping -n 1 registry.npmmirror.com', { stdio: 'pipe' });
  console.log('✅ 网络连接正常');
} catch (error) {
  console.log('❌ 网络连接异常，请检查网络设置');
  process.exit(1);
}

// 分步安装关键依赖
const steps = [
  {
    name: '安装核心框架',
    deps: ['react@18.2.0', 'react-dom@18.2.0', 'typescript@5.3.3']
  },
  {
    name: '安装构建工具',
    deps: ['vite@5.0.10', '@vitejs/plugin-react@4.2.1']
  },
  {
    name: '安装 Electron',
    deps: ['electron@27.3.11', 'electron-builder@24.9.1']
  },
  {
    name: '安装 PDF 处理',
    deps: ['pdfjs-dist@4.0.379', 'pdf-lib@1.17.1']
  },
  {
    name: '安装数据库',
    deps: ['sqlite3@5.1.6']
  }
];

for (const step of steps) {
  console.log(`\n📦 ${step.name}...`);
  try {
    const cmd = `npm install ${step.deps.join(' ')} --registry=https://registry.npmmirror.com/`;
    console.log(`执行: ${cmd}`);
    execSync(cmd, { stdio: 'inherit', timeout: 60000 });
    console.log(`✅ ${step.name} 完成`);
  } catch (error) {
    console.error(`❌ ${step.name} 失败`);
    console.log('尝试单独安装...');
    
    for (const dep of step.deps) {
      try {
        execSync(`npm install ${dep} --registry=https://registry.npmmirror.com/`, { stdio: 'inherit', timeout: 30000 });
        console.log(`✅ ${dep} 安装成功`);
      } catch (e) {
        console.error(`❌ ${dep} 安装失败`);
      }
    }
  }
}

console.log('\n🎯 快速修复完成！');
console.log('请运行 npm run health-check 检查环境状态');