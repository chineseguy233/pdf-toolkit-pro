
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
