module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  moduleFileExtensions: ['js', 'json', 'node'],
  // 跳过需要DOM环境的测试
  testPathIgnorePatterns: [
    '/node_modules/',
    '.*\\.test\\.tsx$',
    '.*\\.test\\.ts$'
  ]
};
