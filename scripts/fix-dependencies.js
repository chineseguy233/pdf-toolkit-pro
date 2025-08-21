#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 PDF Toolkit Pro 依赖修复工具');
console.log('=====================================\n');

// 1. 检查关键依赖兼容性
console.log('📋 检查关键依赖兼容性...');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

// 关键依赖版本检查
const criticalDeps = {
  'electron': deps.electron,
  '@tensorflow/tfjs': deps['@tensorflow/tfjs'],
  'better-sqlite3': deps['better-sqlite3'],
  'pdfjs-dist': deps['pdfjs-dist'],
  'pdf-lib': deps['pdf-lib']
};

console.log('当前关键依赖版本:');
Object.entries(criticalDeps).forEach(([name, version]) => {
  console.log(`  ${name}: ${version || '未安装'}`);
});

// 2. 已知兼容性问题检查
console.log('\n🚨 已知兼容性问题检查:');

const issues = [];

// Electron 28 + TensorFlow.js 兼容性
if (deps.electron?.includes('28') && deps['@tensorflow/tfjs']) {
  issues.push({
    type: 'compatibility',
    severity: 'medium',
    description: 'Electron 28 与 TensorFlow.js 可能存在 Node.js 版本兼容性问题',
    solution: '建议使用 @tensorflow/tfjs-node 或降级到 Electron 27'
  });
}

// better-sqlite3 原生编译问题
if (deps['better-sqlite3']) {
  issues.push({
    type: 'native',
    severity: 'high',
    description: 'better-sqlite3 需要原生编译，在 Electron 环境下可能失败',
    solution: '建议切换到 sqlite3 或配置 electron-rebuild'
  });
}

// PDF 双引擎潜在冲突
if (deps['pdfjs-dist'] && deps['pdf-lib']) {
  issues.push({
    type: 'architecture',
    severity: 'low',
    description: 'PDF.js 和 PDF-lib 双引擎可能导致包体积过大',
    solution: '考虑按需加载或选择单一引擎'
  });
}

if (issues.length === 0) {
  console.log('✅ 未发现明显的兼容性问题');
} else {
  issues.forEach((issue, index) => {
    const severityIcon = issue.severity === 'high' ? '🔴' : 
                        issue.severity === 'medium' ? '🟡' : '🟢';
    console.log(`${severityIcon} 问题 ${index + 1}: ${issue.description}`);
    console.log(`   解决方案: ${issue.solution}\n`);
  });
}

// 3. 生成修复建议
console.log('💡 修复建议:');

const fixes = [
  '1. 运行 npm install --force 强制重新安装',
  '2. 如果 better-sqlite3 安装失败，运行: npm install sqlite3 --save',
  '3. 配置 electron-rebuild: npm install electron-rebuild --save-dev',
  '4. 测试 TensorFlow.js: node -e "console.log(require(\'@tensorflow/tfjs\').version)"'
];

fixes.forEach(fix => console.log(fix));

console.log('\n🎯 下一步操作:');
console.log('运行以下命令进行修复:');
console.log('npm run fix:deps');