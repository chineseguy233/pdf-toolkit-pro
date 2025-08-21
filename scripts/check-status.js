#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('📊 PDF Toolkit Pro 项目状态检查');
console.log('================================\n');

// 1. 检查项目结构
console.log('📁 项目结构检查:');
const requiredDirs = [
  'src/main',
  'src/renderer', 
  'src/shared',
  'dist',
  'assets',
  'scripts'
];

const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'src/main/main.js',
  'src/main/preload.js',
  'src/renderer/App.tsx',
  'src/renderer/main.tsx',
  'src/renderer/index.html'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}`);
  } else {
    console.log(`❌ ${dir} - 缺失`);
  }
});

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 缺失`);
  }
});

// 2. 检查依赖安装状态
console.log('\n📦 依赖安装状态:');
if (fs.existsSync('node_modules')) {
  console.log('✅ node_modules 目录存在');
  
  // 检查关键依赖
  const criticalDeps = ['react', 'electron', 'vite', 'typescript'];
  criticalDeps.forEach(dep => {
    if (fs.existsSync(`node_modules/${dep}`)) {
      console.log(`✅ ${dep} - 已安装`);
    } else {
      console.log(`❌ ${dep} - 未安装`);
    }
  });
} else {
  console.log('❌ node_modules 目录不存在，依赖未安装完成');
}

// 3. 检查 package.json 配置
console.log('\n⚙️ 配置检查:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ 项目名称: ${pkg.name}`);
  console.log(`✅ 版本: ${pkg.version}`);
  console.log(`✅ 脚本数量: ${Object.keys(pkg.scripts || {}).length}`);
  console.log(`✅ 依赖数量: ${Object.keys(pkg.dependencies || {}).length}`);
  console.log(`✅ 开发依赖数量: ${Object.keys(pkg.devDependencies || {}).length}`);
} catch (error) {
  console.log('❌ package.json 读取失败');
}

// 4. 给出下一步建议
console.log('\n🎯 下一步建议:');

if (!fs.existsSync('node_modules')) {
  console.log('1. 等待 npm install 完成（正在后台运行）');
  console.log('2. 或者手动运行: npm install --force');
} else {
  console.log('1. 尝试启动开发服务器: npm run dev');
  console.log('2. 如果启动失败，运行: npm run health-check');
}

console.log('3. 查看实时日志: 检查终端中的 npm install 进度');
console.log('4. 如果安装卡住，按 Ctrl+C 停止，然后运行快速修复');

// 5. 显示可用的修复脚本
console.log('\n🛠️ 可用的修复工具:');
console.log('- npm run health-check  # 环境健康检查');
console.log('- node scripts/quick-fix.js  # 快速依赖修复');
console.log('- node scripts/check-status.js  # 项目状态检查（当前脚本）');