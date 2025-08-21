import { OCREngine, OCRResult, OCRProgress, ocrEngine } from './OCREngine';

export interface OCRTask {
  id: string;
  pageNumber: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: OCRResult;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface OCRBatchResult {
  taskId: string;
  totalPages: number;
  completedPages: number;
  failedPages: number;
  results: OCRResult[];
  totalProcessingTime: number;
  averageConfidence: number;
}

// OCR服务管理类
export class OCRService {
  private tasks = new Map<string, OCRTask>();
  private batchTasks = new Map<string, OCRTask[]>();
  private progressCallbacks = new Map<string, (progress: OCRProgress) => void>();
  private isProcessing = false;
  private processingQueue: string[] = [];

  constructor(private engine: OCREngine = ocrEngine) {}

  // 初始化OCR服务
  async initialize(progressCallback?: (progress: OCRProgress) => void): Promise<void> {
    await this.engine.initialize(progressCallback);
    console.log('OCR服务初始化完成');
  }

  // 单页OCR识别
  async recognizePage(
    imageData: ImageData, 
    pageNumber: number,
    progressCallback?: (progress: OCRProgress) => void
  ): Promise<OCRResult> {
    const taskId = `page_${pageNumber}_${Date.now()}`;
    
    const task: OCRTask = {
      id: taskId,
      pageNumber,
      status: 'pending',
      progress: 0,
      startTime: Date.now()
    };

    this.tasks.set(taskId, task);
    
    if (progressCallback) {
      this.progressCallbacks.set(taskId, progressCallback);
    }

    try {
      this.updateTaskStatus(taskId, 'processing', 0);
      
      const result = await this.engine.recognizeText(imageData, pageNumber);
      
      task.result = result;
      task.endTime = Date.now();
      this.updateTaskStatus(taskId, 'completed', 100);
      
      console.log(`页面${pageNumber}OCR识别完成，置信度: ${result.confidence.toFixed(2)}`);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      task.error = errorMessage;
      this.updateTaskStatus(taskId, 'error', 0);
      
      console.error(`页面${pageNumber}OCR识别失败:`, errorMessage);
      throw error;
    } finally {
      this.progressCallbacks.delete(taskId);
    }
  }

  // 批量OCR识别
  async recognizeBatch(
    pages: Array<{ imageData: ImageData; pageNumber: number }>,
    progressCallback?: (batchProgress: {
      totalPages: number;
      completedPages: number;
      currentPage: number;
      overallProgress: number;
      currentPageProgress: OCRProgress;
    }) => void
  ): Promise<OCRBatchResult> {
    const batchId = `batch_${Date.now()}`;
    const startTime = Date.now();
    
    const tasks: OCRTask[] = pages.map(page => ({
      id: `${batchId}_page_${page.pageNumber}`,
      pageNumber: page.pageNumber,
      status: 'pending',
      progress: 0
    }));

    this.batchTasks.set(batchId, tasks);
    
    const results: OCRResult[] = [];
    let completedPages = 0;
    let failedPages = 0;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const task = tasks[i];
      
      try {
        task.status = 'processing';
        task.startTime = Date.now();
        
        const result = await this.engine.recognizeText(
          page.imageData, 
          page.pageNumber
        );
        
        task.result = result;
        task.status = 'completed';
        task.endTime = Date.now();
        task.progress = 100;
        
        results.push(result);
        completedPages++;
        
        console.log(`批量OCR: 页面${page.pageNumber}完成 (${completedPages}/${pages.length})`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        task.error = errorMessage;
        task.status = 'error';
        task.progress = 0;
        failedPages++;
        
        console.error(`批量OCR: 页面${page.pageNumber}失败:`, errorMessage);
      }
      
      // 报告批量进度
      if (progressCallback) {
        const overallProgress = ((completedPages + failedPages) / pages.length) * 100;
        progressCallback({
          totalPages: pages.length,
          completedPages,
          currentPage: page.pageNumber,
          overallProgress,
          currentPageProgress: {
            status: task.status === 'completed' ? 'completed' : 
                   task.status === 'error' ? 'error' : 'recognizing',
            progress: task.progress,
            message: task.status === 'completed' ? '识别完成' :
                    task.status === 'error' ? `识别失败: ${task.error}` : '正在识别...'
          }
        });
      }
    }

    const endTime = Date.now();
    const totalProcessingTime = endTime - startTime;
    
    // 计算平均置信度
    const averageConfidence = results.length > 0 
      ? results.reduce((sum, result) => sum + result.confidence, 0) / results.length
      : 0;

    const batchResult: OCRBatchResult = {
      taskId: batchId,
      totalPages: pages.length,
      completedPages,
      failedPages,
      results,
      totalProcessingTime,
      averageConfidence
    };

    console.log(`批量OCR完成: ${completedPages}/${pages.length}页成功, 平均置信度: ${averageConfidence.toFixed(2)}`);
    
    return batchResult;
  }

  // 获取任务状态
  getTaskStatus(taskId: string): OCRTask | undefined {
    return this.tasks.get(taskId);
  }

  // 获取批量任务状态
  getBatchTaskStatus(batchId: string): OCRTask[] | undefined {
    return this.batchTasks.get(batchId);
  }

  // 取消任务
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'processing') {
      task.status = 'error';
      task.error = '用户取消';
      console.log(`任务${taskId}已取消`);
      return true;
    }
    return false;
  }

  // 清理已完成的任务
  cleanupCompletedTasks(): void {
    const completedTasks: string[] = [];
    
    this.tasks.forEach((task, taskId) => {
      if (task.status === 'completed' || task.status === 'error') {
        completedTasks.push(taskId);
      }
    });
    
    completedTasks.forEach(taskId => {
      this.tasks.delete(taskId);
    });
    
    console.log(`清理了${completedTasks.length}个已完成的OCR任务`);
  }

  // 获取OCR统计信息
  getStatistics(): {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageProcessingTime: number;
    averageConfidence: number;
  } {
    const allTasks = Array.from(this.tasks.values());
    const completedTasks = allTasks.filter(task => task.status === 'completed');
    const failedTasks = allTasks.filter(task => task.status === 'error');
    
    const averageProcessingTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
          return sum + ((task.endTime || 0) - (task.startTime || 0));
        }, 0) / completedTasks.length
      : 0;
    
    const averageConfidence = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
          return sum + (task.result?.confidence || 0);
        }, 0) / completedTasks.length
      : 0;

    return {
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      averageProcessingTime,
      averageConfidence
    };
  }

  // 导出OCR结果
  exportResults(format: 'json' | 'txt' | 'csv' = 'json'): string {
    const completedTasks = Array.from(this.tasks.values())
      .filter(task => task.status === 'completed' && task.result);
    
    switch (format) {
      case 'txt':
        return completedTasks
          .map(task => `=== 页面 ${task.pageNumber} ===\n${task.result!.text}`)
          .join('\n\n');
      
      case 'csv':
        const csvHeader = 'Page,Text,Confidence,Words,ProcessingTime\n';
        const csvRows = completedTasks.map(task => {
          const result = task.result!;
          const text = result.text.replace(/"/g, '""'); // 转义双引号
          return `${result.pageNumber},"${text}",${result.confidence},${result.words.length},${result.processingTime}`;
        }).join('\n');
        return csvHeader + csvRows;
      
      case 'json':
      default:
        return JSON.stringify(
          completedTasks.map(task => task.result),
          null,
          2
        );
    }
  }

  // 设置OCR语言
  setLanguage(language: string): void {
    this.engine.setLanguage(language);
  }

  // 获取支持的语言
  getSupportedLanguages(): string[] {
    return this.engine.getSupportedLanguages();
  }

  // 检查OCR引擎是否就绪
  isReady(): boolean {
    return this.engine.isReady();
  }

  // 清理资源
  async cleanup(): Promise<void> {
    this.tasks.clear();
    this.batchTasks.clear();
    this.progressCallbacks.clear();
    await this.engine.cleanup();
    console.log('OCR服务资源已清理');
  }

  private updateTaskStatus(taskId: string, status: OCRTask['status'], progress: number): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      task.progress = progress;
      
      const callback = this.progressCallbacks.get(taskId);
      if (callback) {
        callback({
          status: status === 'processing' ? 'recognizing' : 
                 status === 'completed' ? 'completed' : 'error',
          progress,
          message: status === 'processing' ? '正在识别...' :
                  status === 'completed' ? '识别完成' : '识别失败'
        });
      }
    }
  }
}

// 导出单例实例
export const ocrService = new OCRService();