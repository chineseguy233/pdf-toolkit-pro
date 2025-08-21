import { BatchProcessingEngine, BatchJob, BatchJobStatus, WorkflowStep, StepType } from '../../../src/renderer/services/BatchProcessingEngine';

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
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR,
          name: 'OCR识别',
          config: { language: 'chi_sim' }
        }
      ];

      const files = ['test1.pdf', 'test2.pdf'];
      const job = await engine.createJob('测试任务', files, workflow);

      expect(job).toBeDefined();
      expect(job.name).toBe('测试任务');
      expect(job.files).toEqual(files);
      expect(job.workflow.steps).toEqual(workflow);
      expect(job.status).toBe(BatchJobStatus.PENDING);
    });

    it('should start a batch job', async () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR,
          name: 'OCR识别',
          config: { language: 'chi_sim' }
        }
      ];

      const job = await engine.createJob('测试任务', ['test.pdf'], workflow);
      await engine.startJob(job.id);

      const updatedJob = engine.getJob(job.id);
      expect(updatedJob?.status).toBe(BatchJobStatus.RUNNING);
    });

    it('should pause and resume a job', async () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR,
          name: 'OCR识别',
          config: { language: 'chi_sim' }
        }
      ];

      const job = await engine.createJob('测试任务', ['test.pdf'], workflow);
      await engine.startJob(job.id);
      
      await engine.pauseJob(job.id);
      let updatedJob = engine.getJob(job.id);
      expect(updatedJob?.status).toBe(BatchJobStatus.PAUSED);

      await engine.resumeJob(job.id);
      updatedJob = engine.getJob(job.id);
      expect(updatedJob?.status).toBe(BatchJobStatus.RUNNING);
    });

    it('should cancel a job', async () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR,
          name: 'OCR识别',
          config: { language: 'chi_sim' }
        }
      ];

      const job = await engine.createJob('测试任务', ['test.pdf'], workflow);
      await engine.startJob(job.id);
      await engine.cancelJob(job.id);

      const updatedJob = engine.getJob(job.id);
      expect(updatedJob?.status).toBe(BatchJobStatus.CANCELLED);
    });
  });

  describe('Progress Tracking', () => {
    it('should track job progress', async () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR,
          name: 'OCR识别',
          config: { language: 'chi_sim' }
        }
      ];

      const job = await engine.createJob('测试任务', ['test1.pdf', 'test2.pdf'], workflow);
      const progress = engine.getJobProgress(job.id);

      expect(progress).toBeDefined();
      expect(progress.totalFiles).toBe(2);
      expect(progress.processedFiles).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('should update progress during processing', async () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR,
          name: 'OCR识别',
          config: { language: 'chi_sim' }
        }
      ];

      const job = await engine.createJob('测试任务', ['test1.pdf', 'test2.pdf'], workflow);
      
      // 模拟处理进度更新
      const progressCallback = jest.fn();
      engine.on('progress', progressCallback);
      
      await engine.startJob(job.id);
      
      // 等待一些处理时间
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(progressCallback).toHaveBeenCalled();
    });
  });

  describe('Workflow Execution', () => {
    it('should execute OCR workflow step', async () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR,
          name: 'OCR识别',
          config: { language: 'chi_sim' }
        }
      ];

      const job = await engine.createJob('OCR任务', ['test.pdf'], workflow);
      await engine.startJob(job.id);

      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 200));

      const updatedJob = engine.getJob(job.id);
      expect(updatedJob?.status).toBe(BatchJobStatus.COMPLETED);
    });

    it('should execute file organization workflow step', async () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.FILE_ORGANIZATION,
          name: '文件整理',
          config: { 
            pattern: '{year}/{month}',
            createFolders: true 
          }
        }
      ];

      const job = await engine.createJob('整理任务', ['test.pdf'], workflow);
      await engine.startJob(job.id);

      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 200));

      const updatedJob = engine.getJob(job.id);
      expect(updatedJob?.status).toBe(BatchJobStatus.COMPLETED);
    });

    it('should handle workflow step failures', async () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR,
          name: 'OCR识别',
          config: { language: 'invalid_lang' } // 无效配置
        }
      ];

      const job = await engine.createJob('失败任务', ['nonexistent.pdf'], workflow);
      await engine.startJob(job.id);

      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 200));

      const progress = engine.getJobProgress(job.id);
      expect(progress.failedFiles).toBeGreaterThan(0);
    });
  });

  describe('Event System', () => {
    it('should emit job status change events', async () => {
      const statusCallback = jest.fn();
      engine.on('jobStatusChanged', statusCallback);

      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR,
          name: 'OCR识别',
          config: { language: 'chi_sim' }
        }
      ];

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
      engine.on('progress', progressCallback);

      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR,
          name: 'OCR识别',
          config: { language: 'chi_sim' }
        }
      ];

      const job = await engine.createJob('测试任务', ['test.pdf'], workflow);
      await engine.startJob(job.id);

      // 等待进度事件
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(progressCallback).toHaveBeenCalled();
    });
  });

  describe('Resource Management', () => {
    it('should limit concurrent jobs', async () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR,
          name: 'OCR识别',
          config: { language: 'chi_sim' }
        }
      ];

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
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR,
          name: 'OCR识别',
          config: { language: 'chi_sim' }
        }
      ];

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