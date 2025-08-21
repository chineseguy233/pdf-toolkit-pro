import { ProcessingWorkflow, WorkflowStep, StepType, ErrorHandlingStrategy } from './BatchProcessingEngine';

export interface BatchTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  workflow: ProcessingWorkflow;
  isBuiltIn: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  tags: string[];
}

export enum TemplateCategory {
  ORGANIZATION = 'organization',
  OCR = 'ocr',
  CLEANUP = 'cleanup',
  ANALYSIS = 'analysis',
  CUSTOM = 'custom'
}

export interface TemplateUsageStats {
  templateId: string;
  totalUsage: number;
  successRate: number;
  averageProcessingTime: number;
  lastUsed: Date;
}

// 批量处理模板管理器
export class BatchTemplateManager {
  private templates = new Map<string, BatchTemplate>();
  private usageStats = new Map<string, TemplateUsageStats>();

  constructor() {
    this.initializeBuiltInTemplates();
  }

  // 获取所有模板
  getAllTemplates(): BatchTemplate[] {
    return Array.from(this.templates.values());
  }

  // 按类别获取模板
  getTemplatesByCategory(category: TemplateCategory): BatchTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category);
  }

  // 获取单个模板
  getTemplate(templateId: string): BatchTemplate | undefined {
    return this.templates.get(templateId);
  }

  // 创建自定义模板
  createCustomTemplate(
    name: string,
    description: string,
    workflow: ProcessingWorkflow,
    tags: string[] = []
  ): string {
    const templateId = this.generateTemplateId();
    
    const template: BatchTemplate = {
      id: templateId,
      name,
      description,
      category: TemplateCategory.CUSTOM,
      workflow: {
        ...workflow,
        id: templateId,
        name,
        description,
        isTemplate: true
      },
      isBuiltIn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      tags
    };

    this.templates.set(templateId, template);
    this.saveTemplates();
    
    console.log(`创建自定义模板: ${name}`);
    return templateId;
  }

  // 克隆模板
  cloneTemplate(templateId: string, newName: string): string {
    const originalTemplate = this.templates.get(templateId);
    if (!originalTemplate) {
      throw new Error('模板不存在');
    }

    const clonedWorkflow: ProcessingWorkflow = {
      ...originalTemplate.workflow,
      id: this.generateTemplateId(),
      name: newName,
      steps: originalTemplate.workflow.steps.map(step => ({
        ...step,
        id: this.generateStepId()
      }))
    };

    return this.createCustomTemplate(
      newName,
      `基于 "${originalTemplate.name}" 的副本`,
      clonedWorkflow,
      [...originalTemplate.tags, 'cloned']
    );
  }

  // 更新模板
  updateTemplate(templateId: string, updates: Partial<BatchTemplate>): boolean {
    const template = this.templates.get(templateId);
    if (!template || template.isBuiltIn) {
      return false;
    }

    Object.assign(template, updates, { updatedAt: new Date() });
    this.saveTemplates();
    
    console.log(`更新模板: ${template.name}`);
    return true;
  }

  // 删除模板
  deleteTemplate(templateId: string): boolean {
    const template = this.templates.get(templateId);
    if (!template || template.isBuiltIn) {
      return false;
    }

    this.templates.delete(templateId);
    this.usageStats.delete(templateId);
    this.saveTemplates();
    
    console.log(`删除模板: ${template.name}`);
    return true;
  }

  // 记录模板使用
  recordTemplateUsage(templateId: string, success: boolean, processingTime: number): void {
    const template = this.templates.get(templateId);
    if (!template) return;

    template.usageCount++;
    template.updatedAt = new Date();

    // 更新使用统计
    let stats = this.usageStats.get(templateId);
    if (!stats) {
      stats = {
        templateId,
        totalUsage: 0,
        successRate: 0,
        averageProcessingTime: 0,
        lastUsed: new Date()
      };
      this.usageStats.set(templateId, stats);
    }

    stats.totalUsage++;
    stats.lastUsed = new Date();
    
    // 更新成功率
    const previousSuccesses = Math.round(stats.successRate * (stats.totalUsage - 1));
    const newSuccesses = previousSuccesses + (success ? 1 : 0);
    stats.successRate = newSuccesses / stats.totalUsage;
    
    // 更新平均处理时间
    stats.averageProcessingTime = 
      (stats.averageProcessingTime * (stats.totalUsage - 1) + processingTime) / stats.totalUsage;

    this.saveTemplates();
  }

  // 获取模板使用统计
  getTemplateStats(templateId: string): TemplateUsageStats | undefined {
    return this.usageStats.get(templateId);
  }

  // 获取推荐模板
  getRecommendedTemplates(limit: number = 5): BatchTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => {
        const statsA = this.usageStats.get(a.id);
        const statsB = this.usageStats.get(b.id);
        
        // 优先推荐使用频率高且成功率高的模板
        const scoreA = (statsA?.totalUsage || 0) * (statsA?.successRate || 0.5);
        const scoreB = (statsB?.totalUsage || 0) * (statsB?.successRate || 0.5);
        
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // 搜索模板
  searchTemplates(query: string): BatchTemplate[] {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.templates.values())
      .filter(template => 
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
  }

  // 导出模板
  exportTemplate(templateId: string): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('模板不存在');
    }

    return JSON.stringify({
      template: {
        ...template,
        isBuiltIn: false // 导出的模板不应该是内置模板
      },
      exportedAt: new Date(),
      version: '1.0'
    }, null, 2);
  }

  // 导入模板
  importTemplate(templateData: string): string {
    try {
      const data = JSON.parse(templateData);
      const template = data.template as BatchTemplate;
      
      // 生成新的ID避免冲突
      const newId = this.generateTemplateId();
      template.id = newId;
      template.workflow.id = newId;
      template.isBuiltIn = false;
      template.createdAt = new Date();
      template.updatedAt = new Date();
      template.usageCount = 0;
      
      // 为步骤生成新ID
      template.workflow.steps = template.workflow.steps.map(step => ({
        ...step,
        id: this.generateStepId()
      }));

      this.templates.set(newId, template);
      this.saveTemplates();
      
      console.log(`导入模板: ${template.name}`);
      return newId;
      
    } catch (error) {
      throw new Error('模板数据格式无效');
    }
  }

  // 初始化内置模板
  private initializeBuiltInTemplates(): void {
    // 智能整理模板
    this.createBuiltInTemplate({
      id: 'smart-organize',
      name: '智能文档整理',
      description: '分析文档内容，智能重命名并按类型组织到文件夹',
      category: TemplateCategory.ORGANIZATION,
      workflow: {
        id: 'smart-organize',
        name: '智能文档整理',
        description: '分析文档内容，智能重命名并按类型组织到文件夹',
        steps: [
          {
            id: 'analyze-content',
            type: StepType.ANALYZE_CONTENT,
            name: '内容分析',
            parameters: { includeOCR: false },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.SKIP_FILE
          },
          {
            id: 'smart-rename',
            type: StepType.SMART_RENAME,
            name: '智能重命名',
            parameters: { 
              strategy: 'date-category-title',
              maxLength: 100 
            },
            order: 2,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          },
          {
            id: 'organize-folders',
            type: StepType.ORGANIZE_FOLDERS,
            name: '文件夹整理',
            parameters: { 
              template: 'enterprise',
              createSubfolders: true 
            },
            order: 3,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: true
      },
      tags: ['整理', '重命名', '分类']
    });

    // OCR批量识别模板
    this.createBuiltInTemplate({
      id: 'batch-ocr',
      name: '批量OCR识别',
      description: '对扫描文档进行OCR文字识别并提取文本',
      category: TemplateCategory.OCR,
      workflow: {
        id: 'batch-ocr',
        name: '批量OCR识别',
        description: '对扫描文档进行OCR文字识别并提取文本',
        steps: [
          {
            id: 'ocr-recognition',
            type: StepType.OCR_RECOGNITION,
            name: 'OCR文字识别',
            parameters: { 
              language: 'chi_sim+eng',
              confidence: 0.8 
            },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.RETRY
          },
          {
            id: 'analyze-content',
            type: StepType.ANALYZE_CONTENT,
            name: '内容分析',
            parameters: { useOCRText: true },
            order: 2,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: true
      },
      tags: ['OCR', '文字识别', '扫描文档']
    });

    // 重复文件清理模板
    this.createBuiltInTemplate({
      id: 'duplicate-cleanup',
      name: '重复文件清理',
      description: '检测并清理重复的PDF文件',
      category: TemplateCategory.CLEANUP,
      workflow: {
        id: 'duplicate-cleanup',
        name: '重复文件清理',
        description: '检测并清理重复的PDF文件',
        steps: [
          {
            id: 'analyze-content',
            type: StepType.ANALYZE_CONTENT,
            name: '内容分析',
            parameters: {},
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.SKIP_FILE
          },
          {
            id: 'detect-duplicates',
            type: StepType.DETECT_DUPLICATES,
            name: '重复检测',
            parameters: { 
              similarity: 0.95,
              strategy: 'auto-smart' 
            },
            order: 2,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: true
      },
      tags: ['重复检测', '清理', '去重']
    });

    // 文档分析模板
    this.createBuiltInTemplate({
      id: 'document-analysis',
      name: '文档深度分析',
      description: '全面分析文档内容、结构和元数据',
      category: TemplateCategory.ANALYSIS,
      workflow: {
        id: 'document-analysis',
        name: '文档深度分析',
        description: '全面分析文档内容、结构和元数据',
        steps: [
          {
            id: 'extract-text',
            type: StepType.EXTRACT_TEXT,
            name: '文本提取',
            parameters: { includeMetadata: true },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          },
          {
            id: 'analyze-content',
            type: StepType.ANALYZE_CONTENT,
            name: '内容分析',
            parameters: { 
              deepAnalysis: true,
              extractKeywords: true 
            },
            order: 2,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          },
          {
            id: 'categorize',
            type: StepType.CATEGORIZE,
            name: '智能分类',
            parameters: { 
              useAI: true,
              confidence: 0.7 
            },
            order: 3,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: true
      },
      tags: ['分析', '分类', '元数据']
    });

    // 快速整理模板
    this.createBuiltInTemplate({
      id: 'quick-organize',
      name: '快速整理',
      description: '基于文件名和基本属性进行快速整理',
      category: TemplateCategory.ORGANIZATION,
      workflow: {
        id: 'quick-organize',
        name: '快速整理',
        description: '基于文件名和基本属性进行快速整理',
        steps: [
          {
            id: 'smart-rename',
            type: StepType.SMART_RENAME,
            name: '智能重命名',
            parameters: { 
              strategy: 'category-only',
              maxLength: 80 
            },
            order: 1,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          },
          {
            id: 'organize-folders',
            type: StepType.ORGANIZE_FOLDERS,
            name: '文件夹整理',
            parameters: { 
              template: 'personal',
              createSubfolders: false 
            },
            order: 2,
            isEnabled: true,
            onError: ErrorHandlingStrategy.CONTINUE
          }
        ],
        conditions: [],
        isTemplate: true
      },
      tags: ['快速', '整理', '简单']
    });

    console.log('内置模板初始化完成');
  }

  // 创建内置模板
  private createBuiltInTemplate(templateData: Omit<BatchTemplate, 'isBuiltIn' | 'createdAt' | 'updatedAt' | 'usageCount'>): void {
    const template: BatchTemplate = {
      ...templateData,
      isBuiltIn: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };

    this.templates.set(template.id, template);
  }

  // 保存模板到本地存储
  private saveTemplates(): void {
    try {
      const customTemplates = Array.from(this.templates.values())
        .filter(template => !template.isBuiltIn);
      
      const stats = Array.from(this.usageStats.entries());
      
      const data = {
        templates: customTemplates,
        stats: stats,
        savedAt: new Date()
      };

      localStorage.setItem('batch-templates', JSON.stringify(data));
    } catch (error) {
      console.error('保存模板失败:', error);
    }
  }

  // 从本地存储加载模板
  private loadTemplates(): void {
    try {
      const data = localStorage.getItem('batch-templates');
      if (!data) return;

      const parsed = JSON.parse(data);
      
      // 加载自定义模板
      if (parsed.templates) {
        parsed.templates.forEach((template: BatchTemplate) => {
          this.templates.set(template.id, template);
        });
      }

      // 加载使用统计
      if (parsed.stats) {
        parsed.stats.forEach(([templateId, stats]: [string, TemplateUsageStats]) => {
          this.usageStats.set(templateId, stats);
        });
      }

      console.log('模板加载完成');
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  }

  // 工具方法
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStepId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取步骤类型的显示名称
  getStepTypeDisplayName(stepType: StepType): string {
    const displayNames = {
      [StepType.ANALYZE_CONTENT]: '内容分析',
      [StepType.EXTRACT_TEXT]: '文本提取',
      [StepType.OCR_RECOGNITION]: 'OCR识别',
      [StepType.SMART_RENAME]: '智能重命名',
      [StepType.CATEGORIZE]: '智能分类',
      [StepType.ORGANIZE_FOLDERS]: '文件夹整理',
      [StepType.DETECT_DUPLICATES]: '重复检测',
      [StepType.CUSTOM_SCRIPT]: '自定义脚本'
    };

    return displayNames[stepType] || stepType;
  }

  // 获取步骤类型的描述
  getStepTypeDescription(stepType: StepType): string {
    const descriptions = {
      [StepType.ANALYZE_CONTENT]: '分析PDF文档的内容、结构和元数据',
      [StepType.EXTRACT_TEXT]: '从PDF中提取文本内容',
      [StepType.OCR_RECOGNITION]: '对扫描文档进行光学字符识别',
      [StepType.SMART_RENAME]: '基于内容智能生成文件名',
      [StepType.CATEGORIZE]: '根据内容自动分类文档',
      [StepType.ORGANIZE_FOLDERS]: '按规则整理文件到文件夹',
      [StepType.DETECT_DUPLICATES]: '检测和处理重复文件',
      [StepType.CUSTOM_SCRIPT]: '执行自定义处理脚本'
    };

    return descriptions[stepType] || '自定义处理步骤';
  }

  // 获取默认参数
  getDefaultParameters(stepType: StepType): Record<string, any> {
    const defaults = {
      [StepType.ANALYZE_CONTENT]: { includeOCR: false, deepAnalysis: false },
      [StepType.EXTRACT_TEXT]: { includeMetadata: true },
      [StepType.OCR_RECOGNITION]: { language: 'chi_sim+eng', confidence: 0.8 },
      [StepType.SMART_RENAME]: { strategy: 'date-category-title', maxLength: 100 },
      [StepType.CATEGORIZE]: { useAI: true, confidence: 0.7 },
      [StepType.ORGANIZE_FOLDERS]: { template: 'enterprise', createSubfolders: true },
      [StepType.DETECT_DUPLICATES]: { similarity: 0.95, strategy: 'auto-smart' },
      [StepType.CUSTOM_SCRIPT]: {}
    };

    return defaults[stepType] || {};
  }
}

// 导出单例实例
export const batchTemplateManager = new BatchTemplateManager();