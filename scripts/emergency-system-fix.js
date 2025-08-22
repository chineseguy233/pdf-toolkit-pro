#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚨 PDF Toolkit Pro - 紧急系统修复');
console.log('================================');

// 1. 检查并修复构建输出目录
function fixBuildDirectories() {
  console.log('📁 修复构建目录结构...');
  
  const dirs = [
    'dist',
    'dist/main', 
    'dist/renderer',
    'dist/preload'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 创建目录: ${dir}`);
    }
  });
}

// 2. 检查关键文件是否存在
function checkCriticalFiles() {
  console.log('🔍 检查关键文件...');
  
  const criticalFiles = [
    'src/main/main.ts',
    'src/main/preload.ts', 
    'src/renderer/main.tsx',
    'src/renderer/index.html',
    'vite.config.ts',
    'tsconfig.main.json'
  ];
  
  const missing = criticalFiles.filter(file => !fs.existsSync(file));
  
  if (missing.length > 0) {
    console.log('❌ 缺少关键文件:');
    missing.forEach(file => console.log(`   - ${file}`));
    return false;
  }
  
  console.log('✅ 所有关键文件存在');
  return true;
}

// 3. 验证package.json配置
function validatePackageJson() {
  console.log('📦 验证package.json配置...');
  
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // 检查main字段
  if (pkg.main !== 'dist/main/main.js') {
    console.log('⚠️  main字段不正确，应该是: dist/main/main.js');
    return false;
  }
  
  // 检查关键脚本
  const requiredScripts = ['dev', 'build', 'build:renderer', 'build:main'];
  const missingScripts = requiredScripts.filter(script => !pkg.scripts[script]);
  
  if (missingScripts.length > 0) {
    console.log('❌ 缺少关键脚本:', missingScripts);
    return false;
  }
  
  console.log('✅ package.json配置正确');
  return true;
}

// 4. 检查TypeScript配置
function validateTsConfig() {
  console.log('🔧 验证TypeScript配置...');
  
  try {
    const mainConfig = JSON.parse(fs.readFileSync('tsconfig.main.json', 'utf8'));
    
    if (mainConfig.compilerOptions.outDir !== 'dist/main') {
      console.log('❌ tsconfig.main.json outDir配置错误');
      return false;
    }
    
    console.log('✅ TypeScript配置正确');
    return true;
  } catch (error) {
    console.log('❌ TypeScript配置文件读取失败:', error.message);
    return false;
  }
}

// 5. 生成修复建议
function generateFixSuggestions() {
  console.log('\n🛠️  修复建议:');
  console.log('1. 清理并重新构建:');
  console.log('   npm run clean');
  console.log('   npm run build');
  console.log('');
  console.log('2. 如果仍有问题，尝试:');
  console.log('   rm -rf node_modules package-lock.json');
  console.log('   npm install');
  console.log('   npm run build');
  console.log('');
  console.log('3. 开发模式启动:');
  console.log('   npm run dev');
}

// 主函数
function main() {
  let allGood = true;
  
  fixBuildDirectories();
  
  if (!checkCriticalFiles()) allGood = false;
  if (!validatePackageJson()) allGood = false;
  if (!validateTsConfig()) allGood = false;
  
  if (allGood) {
    console.log('\n🎉 系统检查通过！可以尝试启动应用');
    console.log('运行: npm run dev');
  } else {
    console.log('\n⚠️  发现问题，请按照建议修复');
    generateFixSuggestions();
  }
}

main();