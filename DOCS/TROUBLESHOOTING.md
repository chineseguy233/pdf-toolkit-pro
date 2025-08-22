# PDF工具应用故障排除指南

## 常见问题与解决方案

### 1. 应用启动白屏问题

#### 症状
- Electron应用启动后显示白屏
- 控制台无错误信息或报错不明确
- Vite开发服务器正常运行

#### 可能原因
1. TypeScript编译失败，缺少主进程文件
2. 主进程文件路径配置错误
3. 预加载脚本编译或加载失败

#### 解决步骤
1. **检查编译文件是否存在**
   ```bash
   ls dist/main/
   # 应该看到 main.js 和 preload.js
   ```

2. **检查TypeScript配置**
   ```bash
   npx tsc -p tsconfig.main.json --showConfig
   ```

3. **重新编译主进程**
   ```bash
   npx tsc -p tsconfig.main.json
   ```

4. **验证package.json主入口**
   ```json
   {
     "main": "dist/main/main.js"
   }
   ```

### 2. TypeScript编译失败

#### 症状
- `tsc` 命令执行无输出
- dist目录为空
- 编译过程卡住或超时

#### 常见原因与解决方案

**原因1：配置文件排除了输出目录**
```json
// ❌ 错误配置
"exclude": ["node_modules", "dist"]

// ✅ 正确配置  
"exclude": ["node_modules"]
```

**原因2：路径配置错误**
```json
// 检查输出目录配置
"compilerOptions": {
  "outDir": "dist/main"  // 确保路径正确
}
```

**原因3：包含文件配置问题**
```json
"include": [
  "src/main/**/*"  // 确保包含主进程文件
]
```

### 3. Electron进程启动失败

#### 症状
- Vite服务器正常，但Electron窗口不出现
- 进程列表中没有electron进程
- 启动命令执行但无响应

#### 调试步骤
1. **检查进程状态**
   ```bash
   # Windows
   Get-Process | Where-Object {$_.ProcessName -match "electron"}
   
   # Linux/Mac
   ps aux | grep electron
   ```

2. **手动启动Electron**
   ```bash
   npx electron .
   ```

3. **检查启动日志**
   - 查看控制台输出
   - 检查是否有错误信息

4. **验证服务器连接**
   ```bash
   curl http://localhost:5176
   ```

### 4. 端口冲突问题

#### 症状
- 开发服务器启动失败
- 端口被占用错误
- 应用无法连接到开发服务器

#### 解决方案
1. **查找占用进程**
   ```bash
   # Windows
   netstat -ano | findstr :5176
   
   # Linux/Mac
   lsof -i :5176
   ```

2. **终止占用进程**
   ```bash
   # Windows
   taskkill /F /PID <进程ID>
   
   # Linux/Mac
   kill -9 <进程ID>
   ```

3. **更改端口配置**
   ```javascript
   // vite.config.ts
   export default defineConfig({
     server: {
       port: 5177  // 使用其他端口
     }
   })
   ```

### 5. 依赖问题

#### 症状
- 模块找不到错误
- 导入语句报错
- 编译时依赖解析失败

#### 解决步骤
1. **重新安装依赖**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **检查依赖版本兼容性**
   ```bash
   npm ls
   npm audit
   ```

3. **清理缓存**
   ```bash
   npm cache clean --force
   ```

## 调试工具和命令

### 开发环境检查
```bash
# 检查Node.js版本
node --version

# 检查npm版本  
npm --version

# 检查TypeScript版本
npx tsc --version

# 检查Electron版本
npx electron --version
```

### 进程监控
```bash
# Windows进程监控
Get-Process | Where-Object {$_.ProcessName -match "node|electron"}

# 端口监控
netstat -ano | findstr :5176

# 终止所有Node进程
taskkill /F /IM node.exe
```

### 编译调试
```bash
# 显示TypeScript配置
npx tsc -p tsconfig.main.json --showConfig

# 列出编译文件
npx tsc -p tsconfig.main.json --listFiles

# 检查编译错误
npx tsc -p tsconfig.main.json --noEmit
```

## 预防措施

### 1. 配置文件最佳实践
- 定期检查tsconfig.json配置
- 避免在exclude中排除输出目录
- 保持路径配置的一致性

### 2. 开发流程建议
- 启动前先清理旧进程
- 分步启动：先Vite，后Electron
- 定期检查编译输出

### 3. 版本管理
- 锁定关键依赖版本
- 定期更新依赖包
- 保持开发环境一致性

---
**最后更新：** 2025年8月22日  
**适用版本：** PDF Toolkit Pro v1.0.0