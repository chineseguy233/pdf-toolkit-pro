import { BatchTemplateManager, BatchTemplate, TemplateCategory } from '../../../src/renderer/services/BatchTemplateManager';
import { WorkflowStep, StepType, ErrorHandlingStrategy } from '../../../src/renderer/services/BatchProcessingEngine';

describe('BatchTemplateManager', () => {
  let manager: BatchTemplateManager;
  
  beforeEach(() => {
    manager = new BatchTemplateManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Template Management', () => {
    it('should get all templates including built-in ones', () => {
      const templates = manager.getAllTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.isBuiltIn)).toBe(true);
    });

    it('should get templates by category', () => {
      const ocrTemplates = manager.getTemplatesByCategory(TemplateCategory.OCR);
      const organizationTemplates = manager.getTemplatesByCategory(TemplateCategory.ORGANIZATION);
      
      expect(ocrTemplates.length).toBeGreaterThan(0);
      expect(organizationTemplates.length).toBeGreaterThan(0);
      expect(ocrTemplates.every(t => t.category === TemplateCategory.OCR)).toBe(true);
      expect(organizationTemplates.every(t => t.category === TemplateCategory.ORGANIZATION)).toBe(true);
    });

    it('should get template by id', () => {
      const templates = manager.getAllTemplates();
      const firstTemplate = templates[0];
      
      const foundTemplate = manager.getTemplate(firstTemplate.id);
      expect(foundTemplate).toEqual(firstTemplate);
    });

    it('should return undefined for non-existent template', () => {
      const template = manager.getTemplate('non-existent-id');
      expect(template).toBeUndefined();
    });
  });

  describe('Custom Template Creation', () => {
    it('should create a new custom template', () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR_RECOGNITION,
          name: 'OCR识别',
          parameters: { language: 'chi_sim' },
          order: 1,
          isEnabled: true,
          onError: ErrorHandlingStrategy.CONTINUE
        }
      ];

      const template = manager.createTemplate(
        '自定义OCR模板',
        '用于中文OCR识别的自定义模板',
        TemplateCategory.OCR,
        workflow,
        ['OCR', '中文']
      );

      expect(template).toBeDefined();
      expect(template.name).toBe('自定义OCR模板');
      expect(template.category).toBe(TemplateCategory.OCR);
      expect(template.isBuiltIn).toBe(false);
      expect(template.workflow.steps).toEqual(workflow);
      expect(template.tags).toEqual(['OCR', '中文']);
    });

    it('should add created template to the list', () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.ORGANIZE_FOLDERS,
          name: '文件整理',
          parameters: { pattern: '{year}/{month}' },
          order: 1,
          isEnabled: true,
          onError: ErrorHandlingStrategy.CONTINUE
        }
      ];

      const initialCount = manager.getAllTemplates().length;
      
      manager.createTemplate(
        '自定义整理模板',
        '按年月整理文件',
        TemplateCategory.ORGANIZATION,
        workflow
      );

      const newCount = manager.getAllTemplates().length;
      expect(newCount).toBe(initialCount + 1);
    });
  });

  describe('Template Updates', () => {
    it('should update an existing template', () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR_RECOGNITION,
          name: 'OCR识别',
          parameters: { language: 'chi_sim' },
          order: 1,
          isEnabled: true,
          onError: ErrorHandlingStrategy.CONTINUE
        }
      ];

      const template = manager.createTemplate(
        '测试模板',
        '测试描述',
        TemplateCategory.OCR,
        workflow
      );

      const updatedTemplate = manager.updateTemplate(template.id, {
        name: '更新后的模板',
        description: '更新后的描述',
        tags: ['更新', '测试']
      });

      expect(updatedTemplate).toBeDefined();
      expect(updatedTemplate!.name).toBe('更新后的模板');
      expect(updatedTemplate!.description).toBe('更新后的描述');
      expect(updatedTemplate!.tags).toEqual(['更新', '测试']);
    });

    it('should not update built-in templates', () => {
      const builtInTemplate = manager.getAllTemplates().find(t => t.isBuiltIn);
      expect(builtInTemplate).toBeDefined();

      const result = manager.updateTemplate(builtInTemplate!.id, {
        name: '尝试更新内置模板'
      });

      expect(result).toBeUndefined();
    });

    it('should return undefined when updating non-existent template', () => {
      const result = manager.updateTemplate('non-existent-id', {
        name: '不存在的模板'
      });

      expect(result).toBeUndefined();
    });
  });

  describe('Template Deletion', () => {
    it('should delete a custom template', () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR_RECOGNITION,
          name: 'OCR识别',
          parameters: { language: 'chi_sim' },
          order: 1,
          isEnabled: true,
          onError: ErrorHandlingStrategy.CONTINUE
        }
      ];

      const template = manager.createTemplate(
        '待删除模板',
        '这个模板将被删除',
        TemplateCategory.CUSTOM,
        workflow
      );

      const initialCount = manager.getAllTemplates().length;
      const deleted = manager.deleteTemplate(template.id);
      const newCount = manager.getAllTemplates().length;

      expect(deleted).toBe(true);
      expect(newCount).toBe(initialCount - 1);
      expect(manager.getTemplate(template.id)).toBeUndefined();
    });

    it('should not delete built-in templates', () => {
      const builtInTemplate = manager.getAllTemplates().find(t => t.isBuiltIn);
      expect(builtInTemplate).toBeDefined();

      const deleted = manager.deleteTemplate(builtInTemplate!.id);
      expect(deleted).toBe(false);
      expect(manager.getTemplate(builtInTemplate!.id)).toBeDefined();
    });

    it('should return false when deleting non-existent template', () => {
      const deleted = manager.deleteTemplate('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Template Cloning', () => {
    it('should clone an existing template', () => {
      const originalTemplate = manager.getAllTemplates()[0];
      const clonedTemplate = manager.cloneTemplate(originalTemplate.id, '克隆的模板');

      expect(clonedTemplate).toBeDefined();
      expect(clonedTemplate!.name).toBe('克隆的模板');
      expect(clonedTemplate!.workflow.steps).toEqual(originalTemplate.workflow.steps);
      expect(clonedTemplate!.category).toBe(originalTemplate.category);
      expect(clonedTemplate!.isBuiltIn).toBe(false);
      expect(clonedTemplate!.id).not.toBe(originalTemplate.id);
    });

    it('should return undefined when cloning non-existent template', () => {
      const cloned = manager.cloneTemplate('non-existent-id', '克隆失败');
      expect(cloned).toBeUndefined();
    });
  });

  describe('Usage Statistics', () => {
    it('should increment template usage count', () => {
      const template = manager.getAllTemplates()[0];
      const initialUsage = template.usageCount;

      manager.incrementUsage(template.id);
      
      const updatedTemplate = manager.getTemplate(template.id);
      expect(updatedTemplate!.usageCount).toBe(initialUsage + 1);
    });

    it('should get popular templates', () => {
      const templates = manager.getAllTemplates();
      
      // 增加一些使用次数
      manager.incrementUsage(templates[0].id);
      manager.incrementUsage(templates[0].id);
      manager.incrementUsage(templates[1].id);

      const popularTemplates = manager.getPopularTemplates(2);
      
      expect(popularTemplates.length).toBeLessThanOrEqual(2);
      expect(popularTemplates[0].usageCount).toBeGreaterThanOrEqual(popularTemplates[1]?.usageCount || 0);
    });

    it('should get recent templates', () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR_RECOGNITION,
          name: 'OCR识别',
          parameters: { language: 'chi_sim' },
          order: 1,
          isEnabled: true,
          onError: ErrorHandlingStrategy.CONTINUE
        }
      ];

      // 创建一个新模板
      const newTemplate = manager.createTemplate(
        '最新模板',
        '最近创建的模板',
        TemplateCategory.CUSTOM,
        workflow
      );

      const recentTemplates = manager.getRecentTemplates(5);
      
      expect(recentTemplates.length).toBeGreaterThan(0);
      expect(recentTemplates[0].id).toBe(newTemplate.id);
    });
  });

  describe('Template Search', () => {
    it('should search templates by name', () => {
      const workflow: WorkflowStep[] = [
        {
          id: 'step1',
          type: StepType.OCR_RECOGNITION,
          name: 'OCR识别',
          parameters: { language: 'chi_sim' },
          order: 1,
          isEnabled: true,
          onError: ErrorHandlingStrategy.CONTINUE
        }
      ];

      manager.createTemplate(
        '搜索测试模板',
        '用于测试搜索功能',
        TemplateCategory.OCR,
        workflow,
        ['搜索', '测试']
      );

      const results = manager.searchTemplates('搜索');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.name.includes('搜索'))).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = manager.searchTemplates('不存在的搜索词xyz123');
      expect(results).toEqual([]);
    });
  });

  describe('Built-in Templates', () => {
    it('should have OCR templates', () => {
      const ocrTemplates = manager.getTemplatesByCategory(TemplateCategory.OCR);
      expect(ocrTemplates.length).toBeGreaterThan(0);
      
      const ocrTemplate = ocrTemplates.find(t => t.name.includes('OCR'));
      expect(ocrTemplate).toBeDefined();
      expect(ocrTemplate!.isBuiltIn).toBe(true);
    });

    it('should have organization templates', () => {
      const orgTemplates = manager.getTemplatesByCategory(TemplateCategory.ORGANIZATION);
      expect(orgTemplates.length).toBeGreaterThan(0);
      
      const orgTemplate = orgTemplates.find(t => t.name.includes('整理'));
      expect(orgTemplate).toBeDefined();
      expect(orgTemplate!.isBuiltIn).toBe(true);
    });

    it('should have cleanup templates', () => {
      const cleanupTemplates = manager.getTemplatesByCategory(TemplateCategory.CLEANUP);
      expect(cleanupTemplates.length).toBeGreaterThan(0);
      
      const duplicateCleanup = cleanupTemplates.find(t => t.name.includes('重复'));
      expect(duplicateCleanup).toBeDefined();
      expect(duplicateCleanup!.isBuiltIn).toBe(true);
    });
  });
});