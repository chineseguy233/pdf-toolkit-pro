import { ocrService } from './OCRService';

// 批量处理相关接口定义
export interface BatchFile {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  status: FileProcessingStatus;
  progress: number;
  error?: ProcessingError;
  result?: FileProcessingResult;
  startTime?: number;
  endTime?: number;
}

export interface BatchJob {
  id: string;
  name: string;
  files: BatchFile[];
  workflow: ProcessingWorkflow;
  status: BatchJobStatus;
  progress: BatchProgress;
  results: BatchResult[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date;
}

export interface ProcessingWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  isTemplate: boolean;
}

export interface WorkflowStep {
  id: string;
  type: StepType;
  name: string;
  parameters: Record<string, any>;
  order: number;
  isEnabled: boolean;
  onError: ErrorHandlingStrategy;
}

export interface WorkflowCondition {
  id: string;
  stepId: string;
  condition: string;
  action: 'continue' | 'skip' | 'stop';
}

export interface BatchProgress {
  totalFiles: number;
  processedFiles: number;
  successfulFiles: number;
  failedFiles: number;
  skippedFiles: number;
  percentage: number;
  currentFile?: string;
  estimatedTimeRemaining: number;
  processingSpeed: number; // files per minute
}

export interface BatchResult {
  fileId: string;
  fileName: string;
  success: boolean;
  steps: StepResult[];
  errors: ProcessingError[];
  processingTime: number;
}

export interface StepResult {
  stepId: string;
  stepName: string;
  success: boolean;
  duration: number;
  output: any;
  error?: string;
}

export interface ProcessingError {
  step: string;
  message: string;
  timestamp: Date;
  severity: 'warning' | 'error' | 'critical';
}

export interface FileProcessingResult {
  fileId: string;
  steps: StepResult[];
  success: boolean;
  errors: ProcessingError[];
  metadata?: Record<string, any>;
}

export enum BatchJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum FileProcessingStatus {
  WAITING = 'waiting',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

export enum StepType {
  ANALYZE_CONTENT = 'analyze-content',
  EXTRACT_TEXT = 'extract-text',
  OCR_RECOGNITION = 'ocr-recognition',
  SMART_RENAME = 'smart-rename',
  CATEGORIZE = 'categorize',
  ORGANIZE_FOLDERS = 'organize-folders',
  DETECT_DUPLICATES = 'detect-duplicates',
  CUSTOM_SCRIPT = 'custom-script'
}

export enum ErrorHandlingStrategy {
  STOP_JOB = 'stop-job',
  SKIP_FILE = 'skip-file',
  RETRY = 'retry',
  CONTINUE = 'continue'
}

// 步骤处理器接口
export interface StepProcessor {
  process(file: BatchFile, parameters: Record<string, any>): Promise<any>;
}

// 进度回调类型
export type ProgressCallback = (progress: BatchProgress) => void;
export type JobStatusCallback = (jobId: string, status: BatchJobStatus) => void;

// 批量处理引擎
export class BatchProcessingEngine {
  private activeJobs = new Map<string, BatchJob>();
  private jobQueue: string[] = [];
  private maxConcurrentJobs = 3;
  private maxConcurrentFiles = 2;
  private stepProcessors = new Map<StepType, StepProcessor>();
  private progressCallbacks = new Map<string, ProgressCallback>();
  private statusCallbacks = new Map<string, JobStatusCallback>();
  private isProcessing = false;

  constructor() {
    this.initializeStepProcessors();
  }

  // 创建批量任务
  async createBatchJob(
    files: string[],
    workflow: ProcessingWorkflow,
    name?: string
  ): Promise<string> {
    const jobId = this.generateJobId();
    
    const batchFiles: BatchFile[] = await Promise.all(
      files.map(async (filePath) => ({
        id: this.generateFileId(),
        filePath,
        fileName: this.extractFileName(filePath),
        fileSize: await this.getFileSize(filePath),
        status: FileProcessingStatus.WAITING,
        progress: 0
      }))
    );
    
    const job: BatchJob = {
      id: jobId,
      name: name || `批量处理任务_${new Date().toLocaleString()}`,
      files: batchFiles,
      workflow,
      status: BatchJobStatus.PENDING,
      progress: {
        totalFiles: files.length,
        processedFiles: 0,
        successfulFiles: 0,
        failedFiles: 0,
        skippedFiles: 0,
        percentage: 0,
        estimatedTimeRemaining: 0,
        processingSpeed: 0
      },
      results: [],
      createdAt: new Date()
    };
    
    this.activeJobs.set(jobId, job);
    console.log(`创建批量任务: ${jobId}, 文件数量: ${files.length}`);
    
    return jobId;
  }

  // 执行批量任务
  async executeBatchJob(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error('批量任务不存在');
    }

    if (job.status === BatchJobStatus.RUNNING) {
      throw new Error('任务已在运行中');
    }

    job.status = BatchJobStatus.RUNNING;
    job.startedAt = new Date();
    this.notifyStatusChange(jobId, job.status);

    try {
      await this.processJobFiles(job);
      
      job.status = BatchJobStatus.COMPLETED;
      job.completedAt = new Date();
      
      console.log(`批量任务完成: ${jobId}`);
      this.notifyStatusChange(jobId, job.status);
      
    } catch (error) {
      job.status = BatchJobStatus.FAILED;
      console.error(`批量任务失败: ${jobId}`, error);
      this.notifyStatusChange(jobId, job.status);
      throw error;
    }
  }

  // 暂停任务
  pauseJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (!job || job.status !== BatchJobStatus.RUNNING) {
      return false;
    }

    job.status = BatchJobStatus.PAUSED;
    job.pausedAt = new Date();
    this.notifyStatusChange(jobId, job.status);
    
    console.log(`任务已暂停: ${jobId}`);
    return true;
  }

  // 恢复任务
  async resumeJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job || job.status !== BatchJobStatus.PAUSED) {
      return false;
    }

    job.status = BatchJobStatus.RUNNING;
    job.pausedAt = undefined;
    this.notifyStatusChange(jobId, job.status);
    
    console.log(`任务已恢复: ${jobId}`);
    
    // 继续处理剩余文件
    try {
      await this.processJobFiles(job);
      job.status = BatchJobStatus.COMPLETED;
      job.completedAt = new Date();
      this.notifyStatusChange(jobId, job.status);
    } catch (error) {
      job.status = BatchJobStatus.FAILED;
      this.notifyStatusChange(jobId, job.status);
      throw error;
    }

    return true;
  }

  // 取消任务
  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (!job || job.status === BatchJobStatus.COMPLETED) {
      return false;
    }

    job.status = BatchJobStatus.CANCELLED;
    this.notifyStatusChange(jobId, job.status);
    
    console.log(`任务已取消: ${jobId}`);
    return true;
  }

  // 获取任务状态
  getJobStatus(jobId: string): BatchJob | undefined {
    return this.activeJobs.get(jobId);
  }

  // 获取所有任务
  getAllJobs(): BatchJob[] {
    return Array.from(this.activeJobs.values());
  }

  // 删除任务
  deleteJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;

    if (job.status === BatchJobStatus.RUNNING) {
      this.cancelJob(jobId);
    }

    this.activeJobs.delete(jobId);
    this.progressCallbacks.delete(jobId);
    this.statusCallbacks.delete(jobId);
    
    console.log(`任务已删除: ${jobId}`);
    return true;
  }

  // 注册进度回调
  onProgress(jobId: string, callback: ProgressCallback): void {
    this.progressCallbacks.set(jobId, callback);
  }

  // 注册状态变化回调
  onStatusChange(jobId: string, callback: JobStatusCallback): void {
    this.statusCallbacks.set(jobId, callback);
  }

  // 处理任务中的文件
  private async processJobFiles(job: BatchJob): Promise<void> {
    const startTime = Date.now();
    const waitingFiles = job.files.filter(f => 
      f.status === FileProcessingStatus.WAITING || 
      f.status === FileProcessingStatus.FAILED
    );

    if (waitingFiles.length === 0) {
      return;
    }

    const concurrentLimit = Math.min(this.maxConcurrentFiles, waitingFiles.length);
    const processingQueue = [...waitingFiles];
    const activeProcessing: Promise<void>[] = [];

    while (processingQueue.length > 0 || activeProcessing.length > 0) {
      // 检查任务是否被暂停或取消
      if (job.status === BatchJobStatus.PAUSED || job.status === BatchJobStatus.CANCELLED) {
        break;
      }

      // 启动新的处理任务
      while (activeProcessing.length < concurrentLimit && processingQueue.length > 0) {
        const file = processingQueue.shift()!;
        const processingPromise = this.processFile(job, file);
        activeProcessing.push(processingPromise);
      }

      // 等待任意一个任务完成
      if (activeProcessing.length > 0) {
        await Promise.race(activeProcessing);
        
        // 移除已完成的任务
        for (let i = activeProcessing.length - 1; i >= 0; i--) {
          if (await this.isPromiseResolved(activeProcessing[i])) {
            activeProcessing.splice(i, 1);
          }
        }
      }

      // 更新整体进度
      this.updateJobProgress(job, startTime);
    }
  }

  // 处理单个文件
  private async processFile(job: BatchJob, file: BatchFile): Promise<void> {
    file.status = FileProcessingStatus.PROCESSING;
    file.startTime = Date.now();
    
    const result: BatchResult = {
      fileId: file.id,
      fileName: file.fileName,
      success: true,
      steps: [],
      errors: [],
      processingTime: 0
    };

    try {
      // 执行工作流步骤
      const workflowResult = await this.executeWorkflow(job.workflow, file);
      
      result.steps = workflowResult.steps;
      result.errors = workflowResult.errors;
      result.success = workflowResult.success;
      
      file.status = workflowResult.success ? 
        FileProcessingStatus.COMPLETED : 
        FileProcessingStatus.FAILED;
      
      file.result = workflowResult;
      
    } catch (error) {
      const processingError: ProcessingError = {
        step: 'workflow-execution',
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date(),
        severity: 'critical'
      };
      
      result.errors.push(processingError);
      result.success = false;
      file.status = FileProcessingStatus.FAILED;
      file.error = processingError;
      
      console.error(`文件处理失败: ${file.fileName}`, error);
    } finally {
      file.endTime = Date.now();
      result.processingTime = file.endTime - (file.startTime || file.endTime);
      file.progress = 100;
      
      job.results.push(result);
    }
  }

  // 执行工作流
  private async executeWorkflow(workflow: ProcessingWorkflow, file: BatchFile): Promise<FileProcessingResult> {
    const result: FileProcessingResult = {
      fileId: file.id,
      steps: [],
      success: true,
      errors: []
    };

    const enabledSteps = workflow.steps
      .filter(s => s.isEnabled)
      .sort((a, b) => a.order - b.order);

    for (const step of enabledSteps) {
      try {
        const stepResult = await this.executeStep(step, file);
        result.steps.push(stepResult);

        // 检查条件分支
        if (!this.evaluateConditions(workflow.conditions, stepResult)) {
          break;
        }

      } catch (error) {
        const stepError: ProcessingError = {
          step: step.name,
          message: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date(),
          severity: 'error'
        };

        result.errors.push(stepError);

        // 根据错误处理策略决定后续操作
        const shouldContinue = await this.handleStepError(step, error, file);
        if (!shouldContinue) {
          result.success = false;
          break;
        }
      }
    }

    return result;
  }

  // 执行单个步骤
  private async executeStep(step: WorkflowStep, file: BatchFile): Promise<StepResult> {
    const processor = this.stepProcessors.get(step.type);
    if (!processor) {
      throw new Error(`不支持的步骤类型: ${step.type}`);
    }

    const startTime = Date.now();
    
    try {
      const output = await processor.process(file, step.parameters);
      const endTime = Date.now();

      return {
        stepId: step.id,
        stepName: step.name,
        success: true,
        duration: endTime - startTime,
        output
      };
    } catch (error) {
      const endTime = Date.now();
      
      return {
        stepId: step.id,
        stepName: step.name,
        success: false,
        duration: endTime - startTime,
        output: null,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 评估条件分支
  private evaluateConditions(conditions: WorkflowCondition[], stepResult: StepResult): boolean {
    // 简化的条件评估逻辑
    const relevantConditions = conditions.filter(c => c.stepId === stepResult.stepId);
    
    for (const condition of relevantConditions) {
      // 这里可以实现更复杂的条件评估逻辑
      if (condition.condition === 'on-success' && !stepResult.success) {
        return condition.action === 'continue';
      }
      if (condition.condition === 'on-failure' && stepResult.success) {
        return condition.action === 'continue';
      }
    }
    
    return true;
  }

  // 处理步骤错误
  private async handleStepError(step: WorkflowStep, error: any, file: BatchFile): Promise<boolean> {
    switch (step.onError) {
      case ErrorHandlingStrategy.STOP_JOB:
        return false;
      
      case ErrorHandlingStrategy.SKIP_FILE:
        file.status = FileProcessingStatus.SKIPPED;
        return false;
      
      case ErrorHandlingStrategy.RETRY:
        // 简单的重试逻辑，实际应用中可以更复杂
        try {
          await this.executeStep(step, file);
          return true;
        } catch (retryError) {
          return false;
        }
      
      case ErrorHandlingStrategy.CONTINUE:
      default:
        return true;
    }
  }

  // 更新任务进度
  private updateJobProgress(job: BatchJob, startTime: number): void {
    const totalFiles = job.files.length;
    const processedFiles = job.files.filter(f => 
      f.status === FileProcessingStatus.COMPLETED || 
      f.status === FileProcessingStatus.FAILED ||
      f.status === FileProcessingStatus.SKIPPED
    ).length;
    
    const successfulFiles = job.files.filter(f => f.status === FileProcessingStatus.COMPLETED).length;
    const failedFiles = job.files.filter(f => f.status === FileProcessingStatus.FAILED).length;
    const skippedFiles = job.files.filter(f => f.status === FileProcessingStatus.SKIPPED).length;
    
    const percentage = (processedFiles / totalFiles) * 100;
    
    // 计算处理速度和预估剩余时间
    const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
    const processingSpeed = processedFiles / Math.max(elapsedMinutes, 0.1);
    const remainingFiles = totalFiles - processedFiles;
    const estimatedTimeRemaining = remainingFiles / Math.max(processingSpeed, 0.1);
    
    // 获取当前处理的文件
    const currentFile = job.files.find(f => f.status === FileProcessingStatus.PROCESSING)?.fileName;

    job.progress = {
      totalFiles,
      processedFiles,
      successfulFiles,
      failedFiles,
      skippedFiles,
      percentage,
      currentFile,
      estimatedTimeRemaining,
      processingSpeed
    };

    // 通知进度更新
    this.notifyProgressUpdate(job.id, job.progress);
  }

  // 通知进度更新
  private notifyProgressUpdate(jobId: string, progress: BatchProgress): void {
    const callback = this.progressCallbacks.get(jobId);
    if (callback) {
      callback(progress);
    }
  }

  // 通知状态变化
  private notifyStatusChange(jobId: string, status: BatchJobStatus): void {
    const callback = this.statusCallbacks.get(jobId);
    if (callback) {
      callback(jobId, status);
    }
  }

  // 初始化步骤处理器
  private initializeStepProcessors(): void {
    this.stepProcessors.set(StepType.ANALYZE_CONTENT, new ContentAnalysisProcessor());
    this.stepProcessors.set(StepType.EXTRACT_TEXT, new TextExtractionProcessor());
    this.stepProcessors.set(StepType.OCR_RECOGNITION, new OCRProcessor());
    this.stepProcessors.set(StepType.SMART_RENAME, new SmartRenameProcessor());
    this.stepProcessors.set(StepType.CATEGORIZE, new CategorizationProcessor());
    this.stepProcessors.set(StepType.ORGANIZE_FOLDERS, new FolderOrganizationProcessor());
    this.stepProcessors.set(StepType.DETECT_DUPLICATES, new DuplicateDetectionProcessor());
  }

  // 工具方法
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractFileName(filePath: string): string {
    return filePath.split(/[/\\]/).pop() || filePath;
  }

  private async getFileSize(filePath: string): Promise<number> {
    // 模拟文件大小获取
    return Math.floor(Math.random() * 10000000) + 100000; // 100KB - 10MB
  }

  private async isPromiseResolved(promise: Promise<any>): Promise<boolean> {
    try {
      await Promise.race([promise, new Promise(resolve => setTimeout(resolve, 0))]);
      return true;
    } catch {
      return true; // 错误也算已解决
    }
  }
}

// 步骤处理器实现
class ContentAnalysisProcessor implements StepProcessor {
  async process(file: BatchFile, parameters: Record<string, any>): Promise<any> {
    // 模拟内容分析
    await this.delay(1000 + Math.random() * 2000);
    
    return {
      contentType: 'document',
      pageCount: Math.floor(Math.random() * 50) + 1,
      hasImages: Math.random() > 0.5,
      language: 'zh-CN',
      keywords: ['文档', '报告', '分析']
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class TextExtractionProcessor implements StepProcessor {
  async process(file: BatchFile, parameters: Record<string, any>): Promise<any> {
    await this.delay(800 + Math.random() * 1200);
    
    return {
      extractedText: `这是从文件 ${file.fileName} 中提取的文本内容...`,
      wordCount: Math.floor(Math.random() * 5000) + 100,
      confidence: 0.85 + Math.random() * 0.15
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class OCRProcessor implements StepProcessor {
  async process(file: BatchFile, parameters: Record<string, any>): Promise<any> {
    // 使用OCR服务
    const mockImageData = this.createMockImageData();
    const result = await ocrService.recognizePage(mockImageData, 1);
    
    return {
      ocrText: result.text,
      confidence: result.confidence,
      wordCount: result.words.length,
      processingTime: result.processingTime
    };
  }

  private createMockImageData(): ImageData {
    const width = 800;
    const height = 600;
    const data = new Uint8ClampedArray(width * height * 4);
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
      data[i + 3] = 255; // A
    }
    
    return new ImageData(data, width, height);
  }
}

class SmartRenameProcessor implements StepProcessor {
  async process(file: BatchFile, parameters: Record<string, any>): Promise<any> {
    await this.delay(500 + Math.random() * 1000);
    
    const strategy = parameters.strategy || 'date-category-title';
    const maxLength = parameters.maxLength || 100;
    
    let newName = '';
    switch (strategy) {
      case 'date-category-title':
        newName = `20250821_文档_${file.fileName.replace('.pdf', '')}.pdf`;
        break;
      case 'category-only':
        newName = `文档_${file.fileName}`;
        break;
      default:
        newName = `智能重命名_${file.fileName}`;
    }
    
    if (newName.length > maxLength) {
      newName = newName.substring(0, maxLength - 4) + '.pdf';
    }
    
    return {
      originalName: file.fileName,
      suggestedName: newName,
      strategy,
      confidence: 0.8 + Math.random() * 0.2
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class CategorizationProcessor implements StepProcessor {
  async process(file: BatchFile, parameters: Record<string, any>): Promise<any> {
    await this.delay(600 + Math.random() * 800);
    
    const categories = ['合同', '报告', '发票', '证书', '其他'];
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    
    return {
      category: selectedCategory,
      confidence: 0.7 + Math.random() * 0.3,
      subcategory: selectedCategory === '报告' ? '月度报告' : undefined
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class FolderOrganizationProcessor implements StepProcessor {
  async process(file: BatchFile, parameters: Record<string, any>): Promise<any> {
    await this.delay(300 + Math.random() * 500);
    
    const template = parameters.template || 'enterprise';
    const createSubfolders = parameters.createSubfolders || true;
    
    let targetPath = '';
    switch (template) {
      case 'enterprise':
        targetPath = '/Documents/企业文档/2025/';
        break;
      case 'personal':
        targetPath = '/Documents/个人文档/';
        break;
      default:
        targetPath = '/Documents/整理后文档/';
    }
    
    if (createSubfolders) {
      targetPath += '按类型分类/';
    }
    
    return {
      originalPath: file.filePath,
      targetPath: targetPath + file.fileName,
      template,
      created: createSubfolders
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class DuplicateDetectionProcessor implements StepProcessor {
  async process(file: BatchFile, parameters: Record<string, any>): Promise<any> {
    await this.delay(1200 + Math.random() * 1800);
    
    const similarity = parameters.similarity || 0.95;
    const strategy = parameters.strategy || 'auto-smart';
    
    const isDuplicate = Math.random() < 0.2; // 20%概率是重复文件
    
    return {
      isDuplicate,
      similarity: isDuplicate ? similarity + Math.random() * 0.05 : Math.random() * 0.5,
      duplicateOf: isDuplicate ? 'sample_document.pdf' : undefined,
      strategy,
      recommendation: isDuplicate ? 'delete' : 'keep'
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const batchProcessingEngine = new BatchProcessingEngine();