#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚨 紧急依赖修复工具');
console.log('====================\n');

// 1. 备份当前 package.json
console.log('📋 备份当前配置...');
if (fs.existsSync('package.json')) {
  fs.copyFileSync('package.json', 'package.json.backup');
  console.log('✅ package.json 已备份为 package.json.backup');
}

// 2. 清理依赖
console.log('\n🧹 清理现有依赖...');
try {
  if (fs.existsSync('node_modules')) {
    console.log('删除 node_modules 目录...');
    execSync('rmdir /s /q node_modules', { stdio: 'inherit' });
  }
  
  if (fs.existsSync('package-lock.json')) {
    console.log('删除 package-lock.json...');
    fs.unlinkSync('package-lock.json');
  }
  
  console.log('✅ 清理完成');
} catch (error) {
  console.warn('⚠️ 清理过程中出现问题，继续执行...');
}

// 3. 重新安装核心依赖
console.log('\n📦 重新安装依赖...');

const coreCommands = [
  'npm cache clean --force',
  'npm install --package-lock-only',
  'npm install --force'
];

for (const cmd of coreCommands) {
  try {
    console.log(`执行: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
    console.log('✅ 成功');
  } catch (error) {
    console.error(`❌ 失败: ${cmd}`);
    console.error('错误:', error.message);
  }
}

// 4. 检查关键依赖
console.log('\n🔍 检查关键依赖状态...');

const criticalDeps = [
  'electron',
  'react',
  'typescript',
  'vite'
];

criticalDeps.forEach(dep => {
  try {
    const result = execSync(`npm list ${dep}`, { encoding: 'utf8' });
    console.log(`✅ ${dep}: 已安装`);
  } catch (error) {
    console.log(`❌ ${dep}: 缺失或有问题`);
  }
});

console.log('\n🎯 修复完成！');
console.log('建议下一步操作:');
console.log('1. 运行 npm run dev 测试开发环境');
console.log('2. 如果仍有问题，请查看 package.json.backup 恢复配置');