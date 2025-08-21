module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/tests/*.test.js'
  ],
  moduleFileExtensions: ['js', 'json'],
  // 完全跳过转换，只测试纯JavaScript
  transform: {},
  testPathIgnorePatterns: [
    '/node_modules/',
    '.*\\.test\\.ts$',
    '.*\\.test\\.tsx$'
  ],
  // 禁用Babel
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ]
};