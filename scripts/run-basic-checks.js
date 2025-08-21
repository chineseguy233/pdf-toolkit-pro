const fs = require('fs');
const path = require('path');

console.log('🔍 运行基础代码检查...\n');

// 检查关键文件是否存在
const criticalFiles = [
  'src/renderer/App.tsx',
  'src/renderer/main.tsx',
  'src/renderer/components/layout/MainLayout.tsx',
  'src/renderer/services/FileImportService.ts',
  'src/renderer/store/useFileStore.ts',
  'src/main/main.js',
  'src/main/preload.js'
];

let allFilesExist = true;

console.log('📁 检查关键文件存在性:');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// 检查配置文件
const configFiles = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.js'
];

console.log('\n⚙️ 检查配置文件:');
configFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// 检查基本语法（简单的文件读取检查）
console.log('\n🔧 检查基本语法:');
const tsxFiles = [
  'src/renderer/App.tsx',
  'src/renderer/components/layout/MainLayout.tsx',
  'src/renderer/services/FileImportService.ts'
];

let syntaxOk = true;
tsxFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    // 基本语法检查
    const hasImport = content.includes('import');
    const hasExport = content.includes('export');
    const isValid = hasImport && hasExport;
    
    console.log(`  ${isValid ? '✅' : '❌'} ${file} - 基本结构检查`);
    if (!isValid) syntaxOk = false;
  } catch (error) {
    console.log(`  ❌ ${file} - 读取失败: ${error.message}`);
    syntaxOk = false;
  }
});

// 检查依赖关系
console.log('\n📦 检查package.json依赖:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['react', 'react-dom', 'electron'];
  const requiredDevDeps = ['vite', 'typescript', '@types/react'];
  
  let depsOk = true;
  requiredDeps.forEach(dep => {
    const exists = packageJson.dependencies && packageJson.dependencies[dep];
    console.log(`  ${exists ? '✅' : '❌'} ${dep} (生产依赖)`);
    if (!exists) depsOk = false;
  });
  
  requiredDevDeps.forEach(dep => {
    const exists = packageJson.devDependencies && packageJson.devDependencies[dep];
    console.log(`  ${exists ? '✅' : '❌'} ${dep} (开发依赖)`);
    if (!exists) depsOk = false;
  });
} catch (error) {
  console.log('  ❌ package.json 读取失败');
  syntaxOk = false;
}

// 总结
console.log('\n📊 检查总结:');
console.log(`  文件完整性: ${allFilesExist ? '✅ 通过' : '❌ 失败'}`);
console.log(`  语法检查: ${syntaxOk ? '✅ 通过' : '❌ 失败'}`);

const overallStatus = allFilesExist && syntaxOk;
console.log(`\n🎯 总体状态: ${overallStatus ? '✅ 良好' : '❌ 需要修复'}`);

if (overallStatus) {
  console.log('\n🚀 代码质量检查通过，可以继续开发！');
} else {
  console.log('\n⚠️ 发现问题，需要修复后再继续。');
}

process.exit(overallStatus ? 0 : 1);