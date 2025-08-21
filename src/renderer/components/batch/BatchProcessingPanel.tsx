import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { 
  batchProcessingEngine, 
  BatchJob, 
  BatchJobStatus, 
  BatchProgress,
  ProcessingWorkflow 
} from '../../services/BatchProcessingEngine';
import { 
  batchTemplateManager, 
  BatchTemplate, 
  TemplateCategory 
} from '../../services/BatchTemplateManager';

interface BatchProcessingPanelProps {
  onJobComplete?: (jobId: string, results: any[]) => void;
  className?: string;
}

interface PanelState {
  activeTab: 'create' | 'templates' | 'jobs' | 'history';
  selectedFiles: string[];
  selectedTemplate?: BatchTemplate;
  customWorkflow?: ProcessingWorkflow;
  activeJobs: BatchJob[];
  jobProgress: Map<string, BatchProgress>;
  isProcessing: boolean;
}

export const BatchProcessingPanel: React.FC<BatchProcessingPanelProps> = ({
  onJobComplete,
  className = ''
}) => {
  const [state, setState] = useState<PanelState>({
    activeTab: 'create',
    selectedFiles: [],
    activeJobs: [],
    jobProgress: new Map(),
    isProcessing: false
  });

  const [templates, setTemplates] = useState<BatchTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');

  useEffect(() => {
    loadTemplates();
    loadActiveJobs();
    
    // 设置定时器更新任务状态
    const interval = setInterval(() => {
      updateJobStatuses();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadTemplates = () => {
    const allTemplates = batchTemplateManager.getAllTemplates();
    setTemplates(allTemplates);
  };

  const loadActiveJobs = () => {
    const jobs = batchProcessingEngine.getAllJobs();
    setState(prev => ({ ...prev, activeJobs: jobs }));
  };

  const updateJobStatuses = () => {
    const jobs = batchProcessingEngine.getAllJobs();
    setState(prev => ({ ...prev, activeJobs: jobs }));
  };

  const handleFileSelection = () => {
    // 模拟文件选择
    const mockFiles = [
      '/documents/report1.pdf',
      '/documents/report2.pdf',
      '/documents/contract.pdf',
      '/documents/invoice.pdf',
      '/documents/manual.pdf'
    ];
    
    setState(prev => ({ 
      ...prev, 
      selectedFiles: mockFiles 
    }));
  };

  const handleTemplateSelect = (template: BatchTemplate) => {
    setState(prev => ({ 
      ...prev, 
      selectedTemplate: template 
    }));
  };

  const handleCreateJob = async () => {
    if (state.selectedFiles.length === 0 || !state.selectedTemplate) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isProcessing: true }));

      const jobId = await batchProcessingEngine.createBatchJob(
        state.selectedFiles,
        state.selectedTemplate.workflow,
        `${state.selectedTemplate.name} - ${new Date().toLocaleString()}`
      );

      // 注册进度回调
      batchProcessingEngine.onProgress(jobId, (progress) => {
        setState(prev => ({
          ...prev,
          jobProgress: new Map(prev.jobProgress.set(jobId, progress))
        }));
      });

      // 注册状态变化回调
      batchProcessingEngine.onStatusChange(jobId, (jobId, status) => {
        if (status === BatchJobStatus.COMPLETED) {
          const job = batchProcessingEngine.getJobStatus(jobId);
          if (job && onJobComplete) {
            onJobComplete(jobId, job.results);
          }
          
          // 记录模板使用
          batchTemplateManager.recordTemplateUsage(
            state.selectedTemplate!.id,
            job?.progress.successfulFiles === job?.progress.totalFiles,
            Date.now() - (job?.startedAt?.getTime() || Date.now())
          );
        }
        
        loadActiveJobs();
      });

      // 开始执行任务
      await batchProcessingEngine.executeBatchJob(jobId);

      setState(prev => ({ 
        ...prev, 
        activeTab: 'jobs',
        isProcessing: false 
      }));

    } catch (error) {
      console.error('创建批量任务失败:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleJobAction = async (jobId: string, action: 'pause' | 'resume' | 'cancel' | 'delete') => {
    try {
      switch (action) {
        case 'pause':
          batchProcessingEngine.pauseJob(jobId);
          break;
        case 'resume':
          await batchProcessingEngine.resumeJob(jobId);
          break;
        case 'cancel':
          batchProcessingEngine.cancelJob(jobId);
          break;
        case 'delete':
          batchProcessingEngine.deleteJob(jobId);
          break;
      }
      
      loadActiveJobs();
    } catch (error) {
      console.error(`任务操作失败 (${action}):`, error);
    }
  };

  const getFilteredTemplates = () => {
    if (selectedCategory === 'all') {
      return templates;
    }
    return templates.filter(template => template.category === selectedCategory);
  };

  const renderCreateTab = () => (
    <div className="space-y-6">
      {/* 文件选择 */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">选择文件</h4>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          {state.selectedFiles.length === 0 ? (
            <div>
              <p className="text-gray-500 mb-3">拖拽文件到此处或点击选择</p>
              <Button onClick={handleFileSelection}>选择文件</Button>
            </div>
          ) : (
            <div>
              <p className="text-green-600 mb-2">已选择 {state.selectedFiles.length} 个文件</p>
              <div className="text-sm text-gray-500 max-h-32 overflow-y-auto">
                {state.selectedFiles.map((file, index) => (
                  <div key={index} className="truncate">
                    {file.split('/').pop()}
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setState(prev => ({ ...prev, selectedFiles: [] }))}
                className="mt-2"
              >
                重新选择
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 模板选择 */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">选择处理模板</h4>
        
        {/* 类别筛选 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {Object.values(TemplateCategory).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getCategoryDisplayName(category)}
            </button>
          ))}
        </div>

        {/* 模板列表 */}
        <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
          {getFilteredTemplates().map(template => (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                state.selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{template.name}</h5>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {template.isBuiltIn && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                        内置
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {getCategoryDisplayName(template.category)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {template.workflow.steps.length} 步骤
                    </span>
                  </div>
                  {template.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {template.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  使用 {template.usageCount} 次
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 创建任务按钮 */}
      <div className="flex justify-end">
        <Button
          onClick={handleCreateJob}
          disabled={state.selectedFiles.length === 0 || !state.selectedTemplate || state.isProcessing}
          className="min-w-32"
        >
          {state.isProcessing ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              创建中...
            </>
          ) : (
            '创建批量任务'
          )}
        </Button>
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">模板管理</h4>
        <Button size="sm" variant="outline">
          创建模板
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {templates.map(template => (
          <div key={template.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h5 className="font-medium text-gray-900">{template.name}</h5>
                  {template.isBuiltIn && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                      内置
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{template.workflow.steps.length} 步骤</span>
                  <span>使用 {template.usageCount} 次</span>
                  <span>{template.updatedAt.toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  编辑
                </Button>
                <Button size="sm" variant="outline">
                  克隆
                </Button>
                {!template.isBuiltIn && (
                  <Button size="sm" variant="outline">
                    删除
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderJobsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">活动任务</h4>
        <Button size="sm" variant="outline" onClick={loadActiveJobs}>
          刷新
        </Button>
      </div>

      {state.activeJobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>暂无活动任务</p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.activeJobs.map(job => {
            const progress = state.jobProgress.get(job.id) || job.progress;
            return (
              <div key={job.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{job.name}</h5>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{job.files.length} 个文件</span>
                      <span>创建于 {job.createdAt.toLocaleString()}</span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(job.status)}`}>
                        {getStatusDisplayName(job.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {job.status === BatchJobStatus.RUNNING && (
                      <Button size="sm" variant="outline" onClick={() => handleJobAction(job.id, 'pause')}>
                        暂停
                      </Button>
                    )}
                    {job.status === BatchJobStatus.PAUSED && (
                      <Button size="sm" variant="outline" onClick={() => handleJobAction(job.id, 'resume')}>
                        恢复
                      </Button>
                    )}
                    {(job.status === BatchJobStatus.RUNNING || job.status === BatchJobStatus.PAUSED) && (
                      <Button size="sm" variant="outline" onClick={() => handleJobAction(job.id, 'cancel')}>
                        取消
                      </Button>
                    )}
                    {(job.status === BatchJobStatus.COMPLETED || job.status === BatchJobStatus.FAILED || job.status === BatchJobStatus.CANCELLED) && (
                      <Button size="sm" variant="outline" onClick={() => handleJobAction(job.id, 'delete')}>
                        删除
                      </Button>
                    )}
                  </div>
                </div>

                {/* 进度条 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">
                      进度: {progress.processedFiles}/{progress.totalFiles}
                    </span>
                    <span className="text-sm text-gray-600">
                      {progress.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <ProgressBar progress={progress.percentage} />
                  {progress.currentFile && (
                    <div className="text-xs text-gray-500 mt-1">
                      当前处理: {progress.currentFile}
                    </div>
                  )}
                </div>

                {/* 统计信息 */}
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-green-600">{progress.successfulFiles}</div>
                    <div className="text-gray-500">成功</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-red-600">{progress.failedFiles}</div>
                    <div className="text-gray-500">失败</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-yellow-600">{progress.skippedFiles}</div>
                    <div className="text-gray-500">跳过</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-blue-600">
                      {progress.estimatedTimeRemaining > 0 ? 
                        `${Math.ceil(progress.estimatedTimeRemaining)}分钟` : 
                        '-'
                      }
                    </div>
                    <div className="text-gray-500">剩余</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">历史记录</h4>
      <div className="text-center py-8 text-gray-500">
        <p>历史记录功能将在后续版本中实现</p>
      </div>
    </div>
  );

  const getCategoryDisplayName = (category: TemplateCategory): string => {
    const names = {
      [TemplateCategory.ORGANIZATION]: '整理',
      [TemplateCategory.OCR]: 'OCR',
      [TemplateCategory.CLEANUP]: '清理',
      [TemplateCategory.ANALYSIS]: '分析',
      [TemplateCategory.CUSTOM]: '自定义'
    };
    return names[category] || category;
  };

  const getStatusDisplayName = (status: BatchJobStatus): string => {
    const names = {
      [BatchJobStatus.PENDING]: '等待中',
      [BatchJobStatus.RUNNING]: '运行中',
      [BatchJobStatus.PAUSED]: '已暂停',
      [BatchJobStatus.COMPLETED]: '已完成',
      [BatchJobStatus.FAILED]: '失败',
      [BatchJobStatus.CANCELLED]: '已取消'
    };
    return names[status] || status;
  };

  const getStatusColor = (status: BatchJobStatus): string => {
    const colors = {
      [BatchJobStatus.PENDING]: 'bg-gray-100 text-gray-700',
      [BatchJobStatus.RUNNING]: 'bg-blue-100 text-blue-700',
      [BatchJobStatus.PAUSED]: 'bg-yellow-100 text-yellow-700',
      [BatchJobStatus.COMPLETED]: 'bg-green-100 text-green-700',
      [BatchJobStatus.FAILED]: 'bg-red-100 text-red-700',
      [BatchJobStatus.CANCELLED]: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* 标签页导航 */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { key: 'create', label: '创建任务' },
            { key: 'templates', label: '模板管理' },
            { key: 'jobs', label: '活动任务' },
            { key: 'history', label: '历史记录' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setState(prev => ({ ...prev, activeTab: key as any }))}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                state.activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {state.activeTab === 'create' && renderCreateTab()}
        {state.activeTab === 'templates' && renderTemplatesTab()}
        {state.activeTab === 'jobs' && renderJobsTab()}
        {state.activeTab === 'history' && renderHistoryTab()}
      </div>
    </div>
  );
};
