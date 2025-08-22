// 性能指标接口
export interface PerformanceMetrics {
  editingLatency: number;        // 编辑延迟 (ms)
  renderingTime: number;         // 渲染时间 (ms)
  memoryUsage: number;          // 内存使用量 (MB)
  cpuUsage: number;             // CPU使用率 (%)
  frameRate: number;            // 帧率 (fps)
  cacheHitRate: number;         // 缓存命中率 (%)
}

// 设备能力检测
export interface DeviceCapability {
  memory: number;               // 可用内存 (MB)
  cpuCores: number;            // CPU核心数
  hasWebGL: boolean;           // 是否支持WebGL
  maxTextureSize: number;      // 最大纹理尺寸
  isLowEnd: boolean;           // 是否为低端设备
}

// 性能设置
export interface PerformanceSettings {
  renderingQuality: 'low' | 'medium' | 'high';
  maxCachedPages: number;
  animationsEnabled: boolean;
  webWorkerEnabled: boolean;
  incrementalRendering: boolean;
  debounceDelay: number;
}

// 编辑操作接口
export interface EditOperation {
  id: string;
  type: 'text-edit' | 'text-insert' | 'text-delete';
  textBlockId: string;
  timestamp: number;
  priority: number;
}

// 编辑器状态
export interface EditorState {
  textBlockId: string;
  startTime: number;
  isActive: boolean;
  editorId: string;
}

// 对象池实现
export class ObjectPool<T> {
  private available: T[] = [];
  private inUse = new Set<T>();
  private factory: () => T;
  private maxSize: number;

  constructor(factory: () => T, maxSize: number = 50) {
    this.factory = factory;
    this.maxSize = maxSize;
  }

  acquire(): T {
    let obj = this.available.pop();
    
    if (!obj) {
      obj = this.factory();
    }
    
    this.inUse.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      
      if (this.available.length < this.maxSize) {
        this.available.push(obj);
      }
    }
  }

  getStats(): { available: number; inUse: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size
    };
  }

  clear(): void {
    this.available = [];
    this.inUse.clear();
  }
}

// 性能监控器
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    editingLatency: 0,
    renderingTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    frameRate: 60,
    cacheHitRate: 0
  };

  private frameCount = 0;
  private lastFrameTime = 0;
  private isMonitoring = false;

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorFrameRate();
    this.monitorMemoryUsage();
    
    console.log('性能监控已启动');
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('性能监控已停止');
  }

  measureEditingLatency<T>(operation: () => T): T {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    
    this.metrics.editingLatency = endTime - startTime;
    
    if (this.metrics.editingLatency > 50) {
      console.warn(`编辑操作延迟过高: ${this.metrics.editingLatency.toFixed(2)}ms`);
    }
    
    return result;
  }

  measureRenderingTime<T>(renderOperation: () => T): T {
    const startTime = performance.now();
    const result = renderOperation();
    const endTime = performance.now();
    
    this.metrics.renderingTime = endTime - startTime;
    
    return result;
  }

  private monitorFrameRate(): void {
    const measureFrame = (timestamp: number) => {
      if (this.lastFrameTime > 0) {
        const delta = timestamp - this.lastFrameTime;
        this.metrics.frameRate = 1000 / delta;
      }
      
      this.lastFrameTime = timestamp;
      this.frameCount++;
      
      if (this.isMonitoring) {
        requestAnimationFrame(measureFrame);
      }
    };
    
    requestAnimationFrame(measureFrame);
  }

  private monitorMemoryUsage(): void {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      }
      
      if (this.isMonitoring) {
        setTimeout(checkMemory, 1000);
      }
    };
    
    checkMemory();
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  updateCacheHitRate(hits: number, total: number): void {
    this.metrics.cacheHitRate = total > 0 ? (hits / total) * 100 : 0;
  }
}

// 设备能力检测器
export class DeviceCapabilityDetector {
  detectCapability(): DeviceCapability {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    
    const capability: DeviceCapability = {
      memory: this.getAvailableMemory(),
      cpuCores: navigator.hardwareConcurrency || 2,
      hasWebGL: !!gl,
      maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 2048,
      isLowEnd: false
    };
    
    capability.isLowEnd = this.isLowEndDevice(capability);
    
    return capability;
  }

  private getAvailableMemory(): number {
    // 尝试获取设备内存信息
    if ('memory' in navigator) {
      return (navigator as any).memory.deviceMemory * 1024 || 4096; // GB to MB
    }
    
    // 估算内存（基于其他指标）
    const cores = navigator.hardwareConcurrency || 2;
    return cores * 1024; // 粗略估算：每核心1GB
  }

  private isLowEndDevice(capability: DeviceCapability): boolean {
    return capability.memory < 4096 || capability.cpuCores < 4;
  }
}

// 性能降级管理器
export class PerformanceDegradationManager {
  private deviceCapability: DeviceCapability;
  private currentSettings: PerformanceSettings;

  constructor() {
    this.deviceCapability = new DeviceCapabilityDetector().detectCapability();
    this.currentSettings = this.generateOptimalSettings();
  }

  private generateOptimalSettings(): PerformanceSettings {
    if (this.deviceCapability.isLowEnd) {
      return {
        renderingQuality: 'low',
        maxCachedPages: 5,
        animationsEnabled: false,
        webWorkerEnabled: false,
        incrementalRendering: true,
        debounceDelay: 100
      };
    } else if (this.deviceCapability.memory < 8192) {
      return {
        renderingQuality: 'medium',
        maxCachedPages: 10,
        animationsEnabled: true,
        webWorkerEnabled: true,
        incrementalRendering: true,
        debounceDelay: 50
      };
    } else {
      return {
        renderingQuality: 'high',
        maxCachedPages: 20,
        animationsEnabled: true,
        webWorkerEnabled: true,
        incrementalRendering: false,
        debounceDelay: 16
      };
    }
  }

  getSettings(): PerformanceSettings {
    return { ...this.currentSettings };
  }

  updateSettings(overrides: Partial<PerformanceSettings>): void {
    this.currentSettings = { ...this.currentSettings, ...overrides };
    console.log('性能设置已更新:', this.currentSettings);
  }

  getDeviceCapability(): DeviceCapability {
    return { ...this.deviceCapability };
  }
}

// 编辑队列管理器
export class EditingQueueManager {
  private editingQueue: EditOperation[] = [];
  private isProcessing = false;
  private debounceTimer: NodeJS.Timeout | null = null;
  private performanceSettings: PerformanceSettings;

  constructor(performanceSettings: PerformanceSettings) {
    this.performanceSettings = performanceSettings;
  }

  queueEdit(operation: EditOperation): void {
    // 移除同一文本块的旧操作
    this.editingQueue = this.editingQueue.filter(
      op => op.textBlockId !== operation.textBlockId
    );
    
    this.editingQueue.push(operation);
    this.scheduleProcessing();
  }

  private scheduleProcessing(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.processEditQueue();
    }, this.performanceSettings.debounceDelay);
  }

  private async processEditQueue(): Promise<void> {
    if (this.isProcessing || this.editingQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // 按优先级排序
      const operations = this.editingQueue
        .splice(0)
        .sort((a, b) => b.priority - a.priority);
      
      await this.batchProcessOperations(operations);
    } finally {
      this.isProcessing = false;
    }
  }

  private async batchProcessOperations(operations: EditOperation[]): Promise<void> {
    return new Promise(resolve => {
      requestAnimationFrame(async () => {
        for (const op of operations) {
          await this.executeOperation(op);
        }
        resolve();
      });
    });
  }

  private async executeOperation(operation: EditOperation): Promise<void> {
    console.log(`执行编辑操作: ${operation.type} on ${operation.textBlockId}`);
    
    // 模拟编辑操作执行
    return new Promise(resolve => {
      setTimeout(resolve, 1);
    });
  }

  getQueueSize(): number {
    return this.editingQueue.length;
  }

  clearQueue(): void {
    this.editingQueue = [];
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}

// 并发编辑管理器
export class ConcurrentEditingManager {
  private activeEditors = new Map<string, EditorState>();
  private editingLocks = new Set<string>();
  private maxConcurrentEditors = 5;

  startEditing(textBlockId: string, editorId: string): boolean {
    // 检查是否已达到最大并发数
    if (this.activeEditors.size >= this.maxConcurrentEditors) {
      console.warn('已达到最大并发编辑数量');
      return false;
    }

    // 检查是否已被锁定
    if (this.editingLocks.has(textBlockId)) {
      console.warn(`文本块 ${textBlockId} 正在被编辑`);
      return false;
    }
    
    // 锁定文本块
    this.editingLocks.add(textBlockId);
    
    // 记录编辑器状态
    this.activeEditors.set(editorId, {
      textBlockId,
      startTime: Date.now(),
      isActive: true,
      editorId
    });
    
    console.log(`开始编辑: ${textBlockId} by ${editorId}`);
    return true;
  }

  finishEditing(editorId: string): void {
    const editorState = this.activeEditors.get(editorId);
    if (editorState) {
      // 释放锁定
      this.editingLocks.delete(editorState.textBlockId);
      
      // 清理编辑器状态
      this.activeEditors.delete(editorId);
      
      console.log(`完成编辑: ${editorState.textBlockId} by ${editorId}`);
    }
  }

  isEditing(textBlockId: string): boolean {
    return this.editingLocks.has(textBlockId);
  }

  getActiveEditors(): EditorState[] {
    return Array.from(this.activeEditors.values());
  }

  getEditingStats(): { active: number; locked: number; maxConcurrent: number } {
    return {
      active: this.activeEditors.size,
      locked: this.editingLocks.size,
      maxConcurrent: this.maxConcurrentEditors
    };
  }

  setMaxConcurrentEditors(max: number): void {
    this.maxConcurrentEditors = Math.max(1, max);
  }
}

// 内存管理器
export class MemoryManager {
  private objectPools = new Map<string, ObjectPool<any>>();
  private memoryThreshold = 150; // MB
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.setupObjectPools();
  }

  private setupObjectPools(): void {
    // 文本块对象池
    this.objectPools.set('textBlock', new ObjectPool(() => ({
      id: '',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      text: '',
      fontFamily: '',
      fontSize: 12,
      color: '#000000'
    }), 100));
    
    // Canvas对象池
    this.objectPools.set('canvas', new ObjectPool(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      return canvas;
    }, 10));
  }

  startMemoryMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.cleanupInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 5000);
    
    console.log('内存监控已启动');
  }

  stopMemoryMonitoring(): void {
    this.isMonitoring = false;
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    console.log('内存监控已停止');
  }

  getObject<T>(poolName: string): T | null {
    const pool = this.objectPools.get(poolName);
    return pool ? pool.acquire() : null;
  }

  returnObject(poolName: string, obj: any): void {
    const pool = this.objectPools.get(poolName);
    if (pool) {
      pool.release(obj);
    }
  }

  private checkMemoryUsage(): void {
    const memoryUsage = this.getCurrentMemoryUsage();
    
    if (memoryUsage > this.memoryThreshold) {
      console.warn(`内存使用过高: ${memoryUsage.toFixed(2)}MB`);
      this.performCleanup();
    }
  }

  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private performCleanup(): void {
    console.log('执行内存清理...');
    
    // 清理对象池
    this.objectPools.forEach((pool, name) => {
      const stats = pool.getStats();
      console.log(`对象池 ${name}: 可用=${stats.available}, 使用中=${stats.inUse}`);
    });
    
    // 强制垃圾回收（如果可用）
    if ('gc' in window) {
      (window as any).gc();
      console.log('执行了强制垃圾回收');
    }
  }

  getMemoryStats(): { usage: number; threshold: number; pools: Record<string, any> } {
    const poolStats: Record<string, any> = {};
    
    this.objectPools.forEach((pool, name) => {
      poolStats[name] = pool.getStats();
    });
    
    return {
      usage: this.getCurrentMemoryUsage(),
      threshold: this.memoryThreshold,
      pools: poolStats
    };
  }

  cleanup(): void {
    this.stopMemoryMonitoring();
    this.objectPools.forEach(pool => pool.clear());
    this.objectPools.clear();
  }
}

// 主要的性能优化服务
export class PerformanceOptimizationService {
  private performanceMonitor = new PerformanceMonitor();
  private degradationManager = new PerformanceDegradationManager();
  private editingQueueManager: EditingQueueManager;
  private concurrentEditingManager = new ConcurrentEditingManager();
  private memoryManager = new MemoryManager();

  constructor() {
    const settings = this.degradationManager.getSettings();
    this.editingQueueManager = new EditingQueueManager(settings);
    
    this.initialize();
  }

  private initialize(): void {
    // 启动监控
    this.performanceMonitor.startMonitoring();
    this.memoryManager.startMemoryMonitoring();
    
    // 根据设备能力调整并发编辑数
    const capability = this.degradationManager.getDeviceCapability();
    const maxConcurrent = capability.isLowEnd ? 2 : 5;
    this.concurrentEditingManager.setMaxConcurrentEditors(maxConcurrent);
    
    console.log('性能优化服务已初始化', {
      deviceCapability: capability,
      settings: this.degradationManager.getSettings()
    });
  }

  // 优化编辑操作
  optimizeEditOperation<T>(operation: () => T): T {
    return this.performanceMonitor.measureEditingLatency(operation);
  }

  // 优化渲染操作
  optimizeRenderOperation<T>(renderOperation: () => T): T {
    return this.performanceMonitor.measureRenderingTime(renderOperation);
  }

  // 队列编辑操作
  queueEdit(textBlockId: string, type: EditOperation['type'], priority: number = 1): void {
    const operation: EditOperation = {
      id: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      textBlockId,
      timestamp: Date.now(),
      priority
    };
    
    this.editingQueueManager.queueEdit(operation);
  }

  // 开始编辑
  startEditing(textBlockId: string, editorId: string): boolean {
    return this.concurrentEditingManager.startEditing(textBlockId, editorId);
  }

  // 完成编辑
  finishEditing(editorId: string): void {
    this.concurrentEditingManager.finishEditing(editorId);
  }

  // 获取对象池对象
  getPooledObject<T>(poolName: string): T | null {
    return this.memoryManager.getObject<T>(poolName);
  }

  // 归还对象池对象
  returnPooledObject(poolName: string, obj: any): void {
    this.memoryManager.returnObject(poolName, obj);
  }

  // 获取性能指标
  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  // 获取性能设置
  getPerformanceSettings(): PerformanceSettings {
    return this.degradationManager.getSettings();
  }

  // 更新性能设置
  updatePerformanceSettings(overrides: Partial<PerformanceSettings>): void {
    this.degradationManager.updateSettings(overrides);
    
    // 重新创建编辑队列管理器
    const newSettings = this.degradationManager.getSettings();
    this.editingQueueManager = new EditingQueueManager(newSettings);
  }

  // 获取系统状态
  getSystemStatus(): {
    performance: PerformanceMetrics;
    memory: any;
    editing: any;
    device: DeviceCapability;
  } {
    return {
      performance: this.performanceMonitor.getMetrics(),
      memory: this.memoryManager.getMemoryStats(),
      editing: this.concurrentEditingManager.getEditingStats(),
      device: this.degradationManager.getDeviceCapability()
    };
  }

  // 清理资源
  cleanup(): void {
    this.performanceMonitor.stopMonitoring();
    this.memoryManager.cleanup();
    this.editingQueueManager.clearQueue();
    
    console.log('性能优化服务已清理');
  }
}

// 导出单例实例
export const performanceOptimizationService = new PerformanceOptimizationService();