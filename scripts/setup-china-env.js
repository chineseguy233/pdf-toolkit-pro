#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 配置国内开发环境...');

// 1. 检查并设置镜像源
console.log('📦 配置npm镜像源...');
try {
  execSync('npm config set registry https://registry.npmmirror.com/', { stdio: 'inherit' });
  execSync('npm config set electron_mirror https://npmmirror.com/mirrors/electron/', { stdio: 'inherit' });
  execSync('npm config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/', { stdio: 'inherit' });
  console.log('✅ npm镜像配置完成');
} catch (error) {
  console.error('❌ npm镜像配置失败:', error.message);
}

// 2. 检查依赖兼容性
console.log('🔍 检查依赖兼容性...');
try {
  console.log('当前依赖状态:');
  execSync('npm ls --depth=0', { stdio: 'inherit' });
} catch (error) {
  console.warn('⚠️ 发现依赖问题，建议运行 npm audit fix');
}

// 3. 检查 Electron 和 TensorFlow.js 兼容性
console.log('🧪 检查关键依赖兼容性...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const electronVersion = packageJson.devDependencies?.electron || packageJson.dependencies?.electron;
const tfVersion = packageJson.dependencies?.['@tensorflow/tfjs'];

console.log(`Electron版本: ${electronVersion}`);
console.log(`TensorFlow.js版本: ${tfVersion}`);

if (electronVersion && tfVersion) {
  console.log('⚠️ 建议测试 TensorFlow.js 在当前 Electron 版本下的兼容性');
}

// 4. 创建开发环境检查脚本
const healthCheckScript = `
const { app } = require('electron');
const tf = require('@tensorflow/tfjs');

console.log('🔧 环境健康检查:');
console.log('Electron版本:', process.versions.electron);
console.log('Node.js版本:', process.versions.node);
console.log('Chrome版本:', process.versions.chrome);

// 测试 TensorFlow.js
try {
  console.log('TensorFlow.js版本:', tf.version.tfjs);
  console.log('✅ TensorFlow.js 加载成功');
} catch (error) {
  console.error('❌ TensorFlow.js 加载失败:', error.message);
}
`;

fs.writeFileSync('scripts/health-check.js', healthCheckScript);
console.log('✅ 创建环境检查脚本: scripts/health-check.js');

console.log('\n🎉 国内环境配置完成！');
console.log('📝 下一步建议:');
console.log('1. 运行 npm install 重新安装依赖');
console.log('2. 运行 npm run dev 测试开发环境');
console.log('3. 运行 node scripts/health-check.js 检查环境健康状态');