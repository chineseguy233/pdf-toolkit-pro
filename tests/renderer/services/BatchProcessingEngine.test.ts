import { 
  BatchProcessingEngine, 
  BatchJob, 
  BatchJobStatus, 
  ProcessingWorkflow,
  WorkflowStep, 
  StepType,
  ErrorHandlingStrategy 
} from '../../../src/renderer/services/BatchProcessingEngine';

// Mock dependencies
jest.mock('../../../src/renderer/services/OCRService');
jest.mock('../../../src/renderer/services/PDFModificationService');

describe('BatchProcessingEngine', () => {
  let engine: BatchProcessingEngine;
  
  beforeEach(() => {
    engine = new BatchProcessingEngine();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Job Management', () => {
    it('should create a new batch job', async () => {
      const workflow: ProcessingWorkflow = {
        id: 'workflow1',
        name: '测试工作流',
        description: '测试描述',
        steps: [
          {
            id: 'step1',
            type: StepType.OCR_RECOGNITION,
            name: 'OCR识别',
            parameters: { language: 'chi_sim' },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: false
      };

      const files = ['test1.pdf', 'test2.pdf'];
      const job = await engine.createJob('测试任务', files, workflow);

      expect(job).toBeDefined();
      expect(job.name).toBe('测试任务');
      expect(job.files.length).toBe(2);
      expect(job.files[0].fileName).toBe('test1.pdf');
      expect(job.files[1].fileName).toBe('test2.pdf');
      expect(job.workflow.steps).toEqual(workflow.steps);
      expect(job.status).toBe(BatchJobStatus.PENDING);
    });

    it('should start a batch job', async () => {
      const workflow: ProcessingWorkflow = {
        id: 'workflow1',
        name: '测试工作流',
        description: '测试描述',
        steps: [
          {
            id: 'step1',
            type: StepType.OCR_RECOGNITION,
            name: 'OCR识别',
            parameters: { language: 'chi_sim' },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: false
      };

      const job = await engine.createJob('测试任务', ['test.pdf'], workflow);
      
      // 启动任务但不等待完成
      const startPromise = engine.startJob(job.id);
      
      // 等待足够时间确保任务开始运行
      await new Promise(resolve => setTimeout(resolve, 300));
      const updatedJob = engine.getJob(job.id);
      expect(updatedJob?.status).toBe(BatchJobStatus.RUNNING);
      
      // 等待任务完成
      await startPromise;
    });

    it('should pause and resume a job', async () => {
      const workflow: ProcessingWorkflow = {
        id: 'workflow1',
        name: '测试工作流',
        description: '测试描述',
        steps: [
          {
            id: 'step1',
            type: StepType.OCR_RECOGNITION,
            name: 'OCR识别',
            parameters: { language: 'chi_sim' },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: false
      };

      const job = await engine.createJob('测试任务', ['test.pdf'], workflow);
      
      // 启动任务
      // 启动任务
      const startPromise = engine.startJob(job.id);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 暂停任务
      await engine.pauseJob(job.id);
      let updatedJob = engine.getJob(job.id);
      expect(updatedJob?.status).toBe(BatchJobStatus.PAUSED);

      // 恢复任务
      // 恢复任务
      // 恢复任务 - 不等待完成
      const resumePromise = engine.resumeJob(job.id);
      // 等待足够时间确保任务恢复并保持运行状态
      await new Promise(resolve => setTimeout(resolve, 500));
      updatedJob = engine.getJob(job.id);
      expect(updatedJob?.status).toBe(BatchJobStatus.RUNNING);
      
      // 等待恢复完成
      await resumePromise;
      
      // 等待任务完成
      await startPromise;
    });

    it('should cancel a job', async () => {
      const workflow: ProcessingWorkflow = {
        id: 'workflow1',
        name: '测试工作流',
        description: '测试描述',
        steps: [
          {
            id: 'step1',
            type: StepType.OCR_RECOGNITION,
            name: 'OCR识别',
            parameters: { language: 'chi_sim' },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: false
      };

      const job = await engine.createJob('测试任务', ['test.pdf'], workflow);
      
      // 启动任务
      // 启动任务
      const startPromise = engine.startJob(job.id);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 取消任务
      await engine.cancelJob(job.id);
      const updatedJob = engine.getJob(job.id);
      expect(updatedJob?.status).toBe(BatchJobStatus.CANCELLED);
      
      // 等待任务完成
      await startPromise;
    });
  });

  describe('Progress Tracking', () => {
    it('should track job progress', async () => {
      const workflow: ProcessingWorkflow = {
        id: 'workflow1',
        name: '测试工作流',
        description: '测试描述',
        steps: [
          {
            id: 'step1',
            type: StepType.OCR_RECOGNITION,
            name: 'OCR识别',
            parameters: { language: 'chi_sim' },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: false
      };

      const job = await engine.createJob('测试任务', ['test1.pdf', 'test2.pdf'], workflow);
      const progress = engine.getJobProgress(job.id);

      expect(progress).toBeDefined();
      expect(progress!.totalFiles).toBe(2);
      expect(progress!.processedFiles).toBe(0);
      expect(progress!.percentage).toBe(0);
    });

    it('should update progress during processing', async () => {
      const workflow: ProcessingWorkflow = {
        id: 'workflow1',
        name: '测试工作流',
        description: '测试描述',
        steps: [
          {
            id: 'step1',
            type: StepType.OCR_RECOGNITION,
            name: 'OCR识别',
            parameters: { language: 'chi_sim' },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: false
      };

      const job = await engine.createJob('测试任务', ['test1.pdf', 'test2.pdf'], workflow);
      
      // 模拟处理进度更新
      const progressCallback = jest.fn();
      engine.on('progressUpdate', progressCallback);
      
      await engine.startJob(job.id);
      
      // 等待一些处理时间
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(progressCallback).toHaveBeenCalled();
    });
  });

  describe('Workflow Execution', () => {
    it('should execute OCR workflow step', async () => {
      const workflow: ProcessingWorkflow = {
        id: 'workflow1',
        name: '测试工作流',
        description: '测试描述',
        steps: [
          {
            id: 'step1',
            type: StepType.OCR_RECOGNITION,
            name: 'OCR识别',
            parameters: { language: 'chi_sim' },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: false
      };

      const job = await engine.createJob('OCR任务', ['test.pdf'], workflow);
      await engine.startJob(job.id);

      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 200));

      const updatedJob = engine.getJob(job.id);
      expect(updatedJob?.status).toBe(BatchJobStatus.COMPLETED);
    });

    it('should execute file organization workflow step', async () => {
      const workflow: ProcessingWorkflow = {
        id: 'workflow1',
        name: '测试工作流',
        description: '测试描述',
        steps: [
          {
            id: 'step1',
            type: StepType.ORGANIZE_FOLDERS,
            name: '文件整理',
            parameters: { 
              pattern: '{year}/{month}',
              createFolders: true 
            },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: false
      };

      const job = await engine.createJob('整理任务', ['test.pdf'], workflow);
      await engine.startJob(job.id);

      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 200));

      const updatedJob = engine.getJob(job.id);
      expect(updatedJob?.status).toBe(BatchJobStatus.COMPLETED);
    });

    it('should handle workflow step failures', async () => {
      const workflow: ProcessingWorkflow = {
        id: 'workflow1',
        name: '测试工作流',
        description: '测试描述',
        steps: [
          {
            id: 'step1',
            type: StepType.OCR_RECOGNITION,
            name: 'OCR识别',
            parameters: { language: 'invalid_lang' }, // 无效配置
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: false
      };

      const job = await engine.createJob('失败任务', ['nonexistent.pdf'], workflow);
      await engine.startJob(job.id);

      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 200));

      const progress = engine.getJobProgress(job.id);
      expect(progress!.failedFiles).toBeGreaterThan(0);
    });
  });

  describe('Event System', () => {
    it('should emit job status change events', async () => {
      const statusCallback = jest.fn();
      engine.on('jobStatusChange', statusCallback);

      const workflow: ProcessingWorkflow = {
        id: 'workflow1',
        name: '测试工作流',
        description: '测试描述',
        steps: [
          {
            id: 'step1',
            type: StepType.OCR_RECOGNITION,
            name: 'OCR识别',
            parameters: { language: 'chi_sim' },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: false
      };

      const job = await engine.createJob('测试任务', ['test.pdf'], workflow);
      await engine.startJob(job.id);

      expect(statusCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: job.id,
          status: BatchJobStatus.RUNNING
        })
      );
    });

    it('should emit progress events', async () => {
      const progressCallback = jest.fn();
      engine.on('progressUpdate', progressCallback);

      const workflow: ProcessingWorkflow = {
        id: 'workflow1',
        name: '测试工作流',
        description: '测试描述',
        steps: [
          {
            id: 'step1',
            type: StepType.OCR_RECOGNITION,
            name: 'OCR识别',
            parameters: { language: 'chi_sim' },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: false
      };

      const job = await engine.createJob('测试任务', ['test.pdf'], workflow);
      await engine.startJob(job.id);

      // 等待进度事件
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(progressCallback).toHaveBeenCalled();
    });
  });

  describe('Resource Management', () => {
    it('should limit concurrent jobs', async () => {
      const workflow: ProcessingWorkflow = {
        id: 'workflow1',
        name: '测试工作流',
        description: '测试描述',
        steps: [
          {
            id: 'step1',
            type: StepType.OCR_RECOGNITION,
            name: 'OCR识别',
            parameters: { language: 'chi_sim' },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: false
      };

      // 创建多个任务
      const jobs = await Promise.all([
        engine.createJob('任务1', ['test1.pdf'], workflow),
        engine.createJob('任务2', ['test2.pdf'], workflow),
        engine.createJob('任务3', ['test3.pdf'], workflow),
        engine.createJob('任务4', ['test4.pdf'], workflow)
      ]);

      // 启动所有任务
      await Promise.all(jobs.map(job => engine.startJob(job.id)));

      // 检查并发限制
      const runningJobs = jobs.filter(job => {
        const currentJob = engine.getJob(job.id);
        return currentJob?.status === BatchJobStatus.RUNNING;
      });

      expect(runningJobs.length).toBeLessThanOrEqual(2); // 假设最大并发数为2
    });

    it('should clean up completed jobs', async () => {
      const workflow: ProcessingWorkflow = {
        id: 'workflow1',
        name: '测试工作流',
        description: '测试描述',
        steps: [
          {
            id: 'step1',
            type: StepType.OCR_RECOGNITION,
            name: 'OCR识别',
            parameters: { language: 'chi_sim' },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: false
      };

      const job = await engine.createJob('测试任务', ['test.pdf'], workflow);
      await engine.startJob(job.id);

      // 等待完成
      await new Promise(resolve => setTimeout(resolve, 200));

      // 清理任务
      engine.deleteJob(job.id);
      const deletedJob = engine.getJob(job.id);
      expect(deletedJob).toBeUndefined();
    });
  });
});