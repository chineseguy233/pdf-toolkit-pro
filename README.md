# PDF Toolkit Pro

革命性的预览即编辑PDF工具，支持OCR识别、批量处理和智能文本编辑。

## 功能特性

### 🔍 PDF查看与编辑
- 高质量PDF预览
- 实时文本编辑
- 缩放、旋转等基本操作
- 多页面导航

### 🤖 OCR文字识别
- 支持中英文混合识别
- 高精度文字提取
- 可编辑识别结果
- 批量OCR处理

### ⚡ 批量处理
- 多文件同时处理
- 自定义处理流程
- 进度实时监控
- 结果批量导出

### 🎨 现代化界面
- 响应式设计
- 深色/浅色主题
- 直观的操作体验
- 高性能渲染

## 技术栈

- **前端框架**: React 18 + TypeScript
- **桌面应用**: Electron 28
- **构建工具**: Vite 5
- **样式框架**: Tailwind CSS
- **状态管理**: Zustand
- **PDF处理**: PDF.js + PDF-lib
- **OCR引擎**: Tesseract.js

## 开发环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
# 构建渲染进程和主进程
npm run build

# 打包为可执行文件
npm run package

# Windows平台打包
npm run package:win

# macOS平台打包
npm run package:mac
```

### 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 代码质量

```bash
# ESLint检查
npm run lint

# 代码格式化
npm run format

# TypeScript类型检查
npm run type-check
```

## 项目结构

```
src/
├── main/                 # 主进程代码
│   ├── main.ts          # 主进程入口
│   └── preload.ts       # 预加载脚本
├── renderer/            # 渲染进程代码
│   ├── components/      # React组件
│   │   ├── common/      # 通用组件
│   │   ├── layout/      # 布局组件
│   │   ├── pdf/         # PDF相关组件
│   │   ├── ocr/         # OCR相关组件
│   │   └── batch/       # 批处理组件
│   ├── services/        # 业务服务
│   ├── store/           # 状态管理
│   ├── assets/          # 静态资源
│   └── App.tsx          # 应用根组件
└── shared/              # 共享类型定义
    └── types.ts
```

## 配置说明

### 国内镜像配置

项目已配置国内镜像源，包括：
- npm registry: npmmirror.com
- Electron下载: npmmirror.com/mirrors/electron/
- 其他依赖包镜像源

### 构建配置

- 使用Vite进行快速构建
- TypeScript严格模式
- 代码分割优化
- 生产环境压缩

## 开发指南

### 添加新功能

1. 在`src/shared/types.ts`中定义类型
2. 在相应的`components`目录下创建组件
3. 在`services`目录下实现业务逻辑
4. 更新状态管理（如需要）
5. 添加测试用例

### 样式规范

- 使用Tailwind CSS类名
- 遵循响应式设计原则
- 支持深色/浅色主题
- 保持一致的间距和颜色

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint规则
- 使用Prettier格式化
- 编写单元测试

## 部署说明

### 本地构建

```bash
npm run build
npm run package
```

### CI/CD

项目包含GitHub Actions配置，支持：
- 自动化测试
- 多平台构建
- 版本发布

## 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript错误**
   ```bash
   npm run type-check
   ```

3. **构建失败**
   ```bash
   npm run clean
   npm run build
   ```

### 性能优化

- 使用React.memo优化组件渲染
- 实现虚拟滚动（大文件列表）
- PDF页面懒加载
- OCR结果缓存

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 更新日志

### v1.0.0 (2025-08-22)

- ✨ 初始版本发布
- 🔍 PDF查看与编辑功能
- 🤖 OCR文字识别
- ⚡ 批量处理系统
- 🎨 现代化UI界面
- 📱 响应式设计
- 🌙 深色主题支持
- 🚀 高性能优化
- 🧪 完整测试覆盖
- 📦 多平台打包支持

## 联系方式

- 项目地址: https://github.com/chineseguy233/pdf-toolkit-pro
- 问题反馈: https://github.com/chineseguy233/pdf-toolkit-pro/issues