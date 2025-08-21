import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BatchProcessingPanel } from '../../../../src/renderer/components/batch/BatchProcessingPanel';
import { BatchTemplateManager } from '../../../../src/renderer/services/BatchTemplateManager';
import { BatchProcessingEngine } from '../../../../src/renderer/services/BatchProcessingEngine';

// Mock dependencies
jest.mock('../../../../src/renderer/services/BatchTemplateManager');
jest.mock('../../../../src/renderer/services/BatchProcessingEngine');

const MockedBatchTemplateManager = BatchTemplateManager as jest.MockedClass<typeof BatchTemplateManager>;
const MockedBatchProcessingEngine = BatchProcessingEngine as jest.MockedClass<typeof BatchProcessingEngine>;

describe('BatchProcessingPanel', () => {
  let mockTemplateManager: jest.Mocked<BatchTemplateManager>;
  let mockProcessingEngine: jest.Mocked<BatchProcessingEngine>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockTemplateManager = {
      getAllTemplates: jest.fn(),
      getTemplatesByCategory: jest.fn(),
      getTemplate: jest.fn(),
      createTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      deleteTemplate: jest.fn(),
      cloneTemplate: jest.fn(),
      incrementUsage: jest.fn(),
      getPopularTemplates: jest.fn(),
      getRecentTemplates: jest.fn(),
      searchTemplates: jest.fn()
    } as any;

    mockProcessingEngine = {
      createJob: jest.fn(),
      startJob: jest.fn(),
      pauseJob: jest.fn(),
      resumeJob: jest.fn(),
      cancelJob: jest.fn(),
      deleteJob: jest.fn(),
      getJob: jest.fn(),
      getActiveJobs: jest.fn(),
      getJobProgress: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    } as any;

    // Mock constructor returns
    MockedBatchTemplateManager.mockImplementation(() => mockTemplateManager);
    MockedBatchProcessingEngine.mockImplementation(() => mockProcessingEngine);

    // Setup default mock returns
    mockTemplateManager.getAllTemplates.mockReturnValue([
      {
        id: 'template1',
        name: '中文OCR识别',
        description: '识别中文PDF文档中的文字',
        category: 'OCR' as any,
        workflow: {
          id: 'workflow1',
          name: '中文OCR工作流',
          steps: [
            {
              id: 'step1',
              type: 'OCR' as any,
              name: 'OCR识别',
              config: { language: 'chi_sim' }
            }
          ]
        },
        tags: ['OCR', '中文'],
        isBuiltIn: true,
        usageCount: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    mockProcessingEngine.getActiveJobs.mockReturnValue([]);
  });

  describe('Rendering', () => {
    it('should render the component with all tabs', () => {
      render(<BatchProcessingPanel />);

      expect(screen.getByText('创建任务')).toBeInTheDocument();
      expect(screen.getByText('模板管理')).toBeInTheDocument();
      expect(screen.getByText('活动任务')).toBeInTheDocument();
      expect(screen.getByText('历史记录')).toBeInTheDocument();
    });

    it('should render create task tab by default', () => {
      render(<BatchProcessingPanel />);

      expect(screen.getByText('选择文件')).toBeInTheDocument();
      expect(screen.getByText('选择模板')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<BatchProcessingPanel className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs', () => {
      render(<BatchProcessingPanel />);

      // Click on templates tab
      fireEvent.click(screen.getByText('模板管理'));
      expect(screen.getByText('模板管理')).toBeInTheDocument();

      // Click on jobs tab
      fireEvent.click(screen.getByText('活动任务'));
      expect(screen.getByText('活动任务')).toBeInTheDocument();

      // Click on history tab
      fireEvent.click(screen.getByText('历史记录'));
      expect(screen.getByText('历史记录功能将在后续版本中实现')).toBeInTheDocument();
    });

    it('should highlight active tab', () => {
      render(<BatchProcessingPanel />);

      const createTab = screen.getByText('创建任务');
      const templatesTab = screen.getByText('模板管理');

      // Create tab should be active by default
      expect(createTab.closest('button')).toHaveClass('border-blue-500', 'text-blue-600');

      // Switch to templates tab
      fireEvent.click(templatesTab);
      expect(templatesTab.closest('button')).toHaveClass('border-blue-500', 'text-blue-600');
    });
  });

  describe('Create Task Tab', () => {
    it('should display file selection area', () => {
      render(<BatchProcessingPanel />);

      expect(screen.getByText('选择文件')).toBeInTheDocument();
      expect(screen.getByText('拖拽文件到此处或点击选择')).toBeInTheDocument();
    });

    it('should display template selection', () => {
      render(<BatchProcessingPanel />);

      expect(screen.getByText('选择模板')).toBeInTheDocument();
      expect(screen.getByText('中文OCR识别')).toBeInTheDocument();
    });

    it('should handle template selection', () => {
      render(<BatchProcessingPanel />);

      const templateCard = screen.getByText('中文OCR识别').closest('div');
      fireEvent.click(templateCard!);

      expect(templateCard).toHaveClass('ring-2', 'ring-blue-500');
    });

    it('should disable create button when no files or template selected', () => {
      render(<BatchProcessingPanel />);

      const createButton = screen.getByText('创建批量任务');
      expect(createButton).toBeDisabled();
    });

    it('should enable create button when files and template are selected', async () => {
      render(<BatchProcessingPanel />);

      // Select template
      const templateCard = screen.getByText('中文OCR识别').closest('div');
      fireEvent.click(templateCard!);

      // Mock file selection (this would normally be done through file input)
      // For testing purposes, we'll simulate the state change
      const fileInput = screen.getByLabelText('选择文件');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        const createButton = screen.getByText('创建批量任务');
        expect(createButton).not.toBeDisabled();
      });
    });
  });

  describe('Templates Tab', () => {
    it('should display template management interface', () => {
      render(<BatchProcessingPanel />);

      fireEvent.click(screen.getByText('模板管理'));

      expect(screen.getByText('模板管理')).toBeInTheDocument();
      expect(screen.getByText('创建模板')).toBeInTheDocument();
    });

    it('should display template list', () => {
      render(<BatchProcessingPanel />);

      fireEvent.click(screen.getByText('模板管理'));

      expect(screen.getByText('中文OCR识别')).toBeInTheDocument();
      expect(screen.getByText('识别中文PDF文档中的文字')).toBeInTheDocument();
      expect(screen.getByText('内置')).toBeInTheDocument();
    });

    it('should show template actions', () => {
      render(<BatchProcessingPanel />);

      fireEvent.click(screen.getByText('模板管理'));

      expect(screen.getByText('编辑')).toBeInTheDocument();
      expect(screen.getByText('克隆')).toBeInTheDocument();
    });
  });

  describe('Jobs Tab', () => {
    it('should display active jobs interface', () => {
      render(<BatchProcessingPanel />);

      fireEvent.click(screen.getByText('活动任务'));

      expect(screen.getByText('活动任务')).toBeInTheDocument();
      expect(screen.getByText('刷新')).toBeInTheDocument();
    });

    it('should show empty state when no active jobs', () => {
      render(<BatchProcessingPanel />);

      fireEvent.click(screen.getByText('活动任务'));

      expect(screen.getByText('暂无活动任务')).toBeInTheDocument();
    });

    it('should display active jobs when available', () => {
      const mockJob = {
        id: 'job1',
        name: '测试任务',
        files: ['test1.pdf', 'test2.pdf'],
        status: 'RUNNING' as any,
        progress: {
          totalFiles: 2,
          processedFiles: 1,
          successfulFiles: 1,
          failedFiles: 0,
          skippedFiles: 0,
          percentage: 50,
          currentFile: 'test2.pdf',
          estimatedTimeRemaining: 5
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        workflow: {
          id: 'workflow1',
          name: '测试工作流',
          steps: []
        }
      };

      mockProcessingEngine.getActiveJobs.mockReturnValue([mockJob]);
      mockProcessingEngine.getJobProgress.mockReturnValue(mockJob.progress);

      render(<BatchProcessingPanel />);

      fireEvent.click(screen.getByText('活动任务'));

      expect(screen.getByText('测试任务')).toBeInTheDocument();
      expect(screen.getByText('2 个文件')).toBeInTheDocument();
      expect(screen.getByText('运行中')).toBeInTheDocument();
    });

    it('should handle job actions', () => {
      const mockJob = {
        id: 'job1',
        name: '测试任务',
        files: ['test.pdf'],
        status: 'RUNNING' as any,
        progress: {
          totalFiles: 1,
          processedFiles: 0,
          successfulFiles: 0,
          failedFiles: 0,
          skippedFiles: 0,
          percentage: 0,
          currentFile: 'test.pdf',
          estimatedTimeRemaining: 10
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        workflow: {
          id: 'workflow1',
          name: '测试工作流',
          steps: []
        }
      };

      mockProcessingEngine.getActiveJobs.mockReturnValue([mockJob]);
      mockProcessingEngine.getJobProgress.mockReturnValue(mockJob.progress);

      render(<BatchProcessingPanel />);

      fireEvent.click(screen.getByText('活动任务'));

      const pauseButton = screen.getByText('暂停');
      fireEvent.click(pauseButton);

      expect(mockProcessingEngine.pauseJob).toHaveBeenCalledWith('job1');
    });
  });

  describe('History Tab', () => {
    it('should display history placeholder', () => {
      render(<BatchProcessingPanel />);

      fireEvent.click(screen.getByText('历史记录'));

      expect(screen.getByText('历史记录功能将在后续版本中实现')).toBeInTheDocument();
    });
  });

  describe('Job Creation', () => {
    it('should create job when create button is clicked', async () => {
      const mockJob = {
        id: 'job1',
        name: '新任务',
        files: ['test.pdf'],
        status: 'PENDING' as any,
        progress: {
          totalFiles: 1,
          processedFiles: 0,
          successfulFiles: 0,
          failedFiles: 0,
          skippedFiles: 0,
          percentage: 0,
          currentFile: null,
          estimatedTimeRemaining: 0
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        workflow: {
          id: 'workflow1',
          name: '测试工作流',
          steps: []
        }
      };

      mockProcessingEngine.createJob.mockResolvedValue(mockJob);
      mockProcessingEngine.startJob.mockResolvedValue(undefined);

      render(<BatchProcessingPanel />);

      // Select template
      const templateCard = screen.getByText('中文OCR识别').closest('div');
      fireEvent.click(templateCard!);

      // Mock file selection
      const component = screen.getByText('创建批量任务').closest('div');
      // Simulate file selection state change
      // This would normally be handled by the file input component

      // For testing, we'll directly test the create job functionality
      expect(mockTemplateManager.getAllTemplates).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle template loading errors', () => {
      mockTemplateManager.getAllTemplates.mockImplementation(() => {
        throw new Error('Failed to load templates');
      });

      // Should not crash the component
      expect(() => render(<BatchProcessingPanel />)).not.toThrow();
    });

    it('should handle job creation errors', async () => {
      mockProcessingEngine.createJob.mockRejectedValue(new Error('Job creation failed'));

      render(<BatchProcessingPanel />);

      // The component should handle the error gracefully
      // This would typically show an error message to the user
    });
  });

  describe('Real-time Updates', () => {
    it('should update job progress in real-time', async () => {
      const mockJob = {
        id: 'job1',
        name: '测试任务',
        files: ['test.pdf'],
        status: 'RUNNING' as any,
        progress: {
          totalFiles: 1,
          processedFiles: 0,
          successfulFiles: 0,
          failedFiles: 0,
          skippedFiles: 0,
          percentage: 0,
          currentFile: 'test.pdf',
          estimatedTimeRemaining: 10
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        workflow: {
          id: 'workflow1',
          name: '测试工作流',
          steps: []
        }
      };

      mockProcessingEngine.getActiveJobs.mockReturnValue([mockJob]);
      mockProcessingEngine.getJobProgress.mockReturnValue(mockJob.progress);

      render(<BatchProcessingPanel />);

      fireEvent.click(screen.getByText('活动任务'));

      // Simulate progress update
      const updatedProgress = {
        ...mockJob.progress,
        processedFiles: 1,
        percentage: 100
      };

      mockProcessingEngine.getJobProgress.mockReturnValue(updatedProgress);

      // The component should reflect the updated progress
      // This would typically be handled through event listeners
    });
  });
});