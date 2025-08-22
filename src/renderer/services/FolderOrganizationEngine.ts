import { DocumentAnalysis, DocumentCategory } from './PDFContentAnalyzer';

export interface FolderStructure {
  id: string;
  name: string;
  path: string;
  level: number;
  parent?: string;
  children: FolderStructure[];
  suggestedFiles: string[];
  organizationRule: OrganizationRule;
  confidence: number;
}

export interface OrganizationRule {
  type: OrganizationType;
  criteria: OrganizationCriteria;
  template: OrganizationTemplate;
  priority: number;
}

export interface OrganizationCriteria {
  groupBy: string;
  sortBy?: string;
  filterBy?: string;
}

export interface OrganizationTemplate {
  id: string;
  name: string;
  description: string;
  type: OrganizationType;
  structure: TemplateStructure;
  rules: TemplateRule[];
  isBuiltIn: boolean;
  usage: number;
}

export interface TemplateStructure {
  levels: TemplateLevel[];
  maxDepth: number;
  namingPattern: string;
}

export interface TemplateLevel {
  name: string;
  pattern: string;
}

export interface TemplateRule {
  field: string;
  source: string;
  fallback: string | number;
}

export enum OrganizationType {
  BY_CATEGORY = 'by-category',
  BY_DATE = 'by-date',
  BY_PROJECT = 'by-project',
  BY_SOURCE = 'by-source',
  BY_IMPORTANCE = 'by-importance',
  CUSTOM = 'custom'
}

export interface OrganizeResult {
  fileId: string;
  success: boolean;
  targetPath: string;
  targetFolder?: string;
  error?: string;
}

export class FolderOrganizationEngine {
  private templates: Map<string, OrganizationTemplate> = new Map();
  private categoryTranslations: Map<DocumentCategory, string> = new Map();

  constructor() {
    this.initializeBuiltInTemplates();
    this.initializeCategoryTranslations();
  }

  /**
   * 生成文件夹结构
   */
  async generateFolderStructure(
    documents: DocumentAnalysis[],
    organizationType: OrganizationType,
    existingStructure?: FolderStructure
  ): Promise<FolderStructure> {
    try {
      const organizer = this.getOrganizer(organizationType);
      const structure = await organizer.organize(documents, existingStructure);
      
      // 验证和优化结构
      return this.optimizeStructure(structure);
    } catch (error: any) {
      console.error('生成文件夹结构失败:', error);
      throw new Error(`生成文件夹结构失败: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 应用组织模板
   */
  applyTemplate(template: OrganizationTemplate, documents: DocumentAnalysis[]): FolderStructure {
    const organizer = new TemplateBasedOrganizer(template, this.categoryTranslations);
    return organizer.organize(documents);
  }

  /**
   * 获取组织器
   */
  private getOrganizer(type: OrganizationType): FolderOrganizer {
    switch (type) {
      case OrganizationType.BY_CATEGORY:
        return new CategoryBasedOrganizer(this.categoryTranslations);
      case OrganizationType.BY_DATE:
        return new DateBasedOrganizer(this.categoryTranslations);
      case OrganizationType.BY_PROJECT:
        return new ProjectBasedOrganizer(this.categoryTranslations);
      default:
        return new CategoryBasedOrganizer(this.categoryTranslations);
    }
  }

  /**
   * 优化文件夹结构
   */
  private optimizeStructure(structure: FolderStructure): FolderStructure {
    // 限制文件夹深度
    this.limitFolderDepth(structure, 3);
    
    // 合并小文件夹
    this.mergeSmallFolders(structure);
    
    // 排序文件夹
    this.sortFolders(structure);
    
    return structure;
  }

  /**
   * 限制文件夹深度
   */
  private limitFolderDepth(folder: FolderStructure, maxDepth: number): void {
    if (folder.level >= maxDepth) {
      // 将子文件夹的文件移到当前文件夹
      folder.children.forEach(child => {
        folder.suggestedFiles.push(...child.suggestedFiles);
        child.children.forEach(grandChild => {
          folder.suggestedFiles.push(...grandChild.suggestedFiles);
        });
      });
      folder.children = [];
      return;
    }
    
    folder.children.forEach(child => this.limitFolderDepth(child, maxDepth));
  }

  /**
   * 合并小文件夹
   */
  private mergeSmallFolders(folder: FolderStructure): void {
    const minFilesPerFolder = 3;
    
    folder.children = folder.children.filter(child => {
      if (child.suggestedFiles.length < minFilesPerFolder && child.children.length === 0) {
        // 将小文件夹的文件移到父文件夹
        folder.suggestedFiles.push(...child.suggestedFiles);
        return false;
      }
      return true;
    });
    
    folder.children.forEach(child => this.mergeSmallFolders(child));
  }

  /**
   * 排序文件夹
   */
  private sortFolders(folder: FolderStructure): void {
    folder.children.sort((a, b) => {
      // 按文件数量降序排列
      const aFileCount = this.getTotalFileCount(a);
      const bFileCount = this.getTotalFileCount(b);
      return bFileCount - aFileCount;
    });
    
    folder.children.forEach(child => this.sortFolders(child));
  }

  /**
   * 获取文件夹总文件数
   */
  private getTotalFileCount(folder: FolderStructure): number {
    let count = folder.suggestedFiles.length;
    folder.children.forEach(child => {
      count += this.getTotalFileCount(child);
    });
    return count;
  }

  /**
   * 初始化内置模板
   */
  private initializeBuiltInTemplates(): void {
    // 企业文档模板
    this.templates.set('enterprise', {
      id: 'enterprise',
      name: '企业文档管理',
      description: '适用于企业日常文档管理的标准结构',
      type: OrganizationType.BY_CATEGORY,
      structure: {
        levels: [
          { name: '部门', pattern: '{department}' },
          { name: '类型', pattern: '{category}' },
          { name: '年份', pattern: '{year}年' }
        ],
        maxDepth: 3,
        namingPattern: '{department}/{category}/{year}年'
      },
      rules: [
        { field: 'department', source: 'metadata.department', fallback: '通用部门' },
        { field: 'category', source: 'classification.category', fallback: '其他' },
        { field: 'year', source: 'metadata.creationDate.year', fallback: new Date().getFullYear() }
      ],
      isBuiltIn: true,
      usage: 0
    });

    // 个人文档模板
    this.templates.set('personal', {
      id: 'personal',
      name: '个人文档整理',
      description: '适用于个人文档收集和整理',
      type: OrganizationType.BY_DATE,
      structure: {
        levels: [
          { name: '年份', pattern: '{year}年' },
          { name: '月份', pattern: '{month}月' },
          { name: '类型', pattern: '{category}' }
        ],
        maxDepth: 3,
        namingPattern: '{year}年/{month}月/{category}'
      },
      rules: [
        { field: 'year', source: 'metadata.creationDate.year', fallback: new Date().getFullYear() },
        { field: 'month', source: 'metadata.creationDate.month', fallback: new Date().getMonth() + 1 },
        { field: 'category', source: 'classification.category', fallback: '未分类' }
      ],
      isBuiltIn: true,
      usage: 0
    });

    // 项目文档模板
    this.templates.set('project', {
      id: 'project',
      name: '项目文档管理',
      description: '按项目组织文档，适用于项目管理场景',
      type: OrganizationType.BY_PROJECT,
      structure: {
        levels: [
          { name: '项目', pattern: '{project}' },
          { name: '阶段', pattern: '{phase}' },
          { name: '类型', pattern: '{doctype}' }
        ],
        maxDepth: 3,
        namingPattern: '{project}/{phase}/{doctype}'
      },
      rules: [
        { field: 'project', source: 'content.keywords.project', fallback: '默认项目' },
        { field: 'phase', source: 'content.keywords.phase', fallback: '通用' },
        { field: 'doctype', source: 'classification.category', fallback: '文档' }
      ],
      isBuiltIn: true,
      usage: 0
    });
  }

  /**
   * 初始化类别翻译
   */
  private initializeCategoryTranslations(): void {
    this.categoryTranslations = new Map([
      [DocumentCategory.CONTRACT, '合同协议'],
      [DocumentCategory.INVOICE, '发票票据'],
      [DocumentCategory.REPORT, '报告文档'],
      [DocumentCategory.RESUME, '简历档案'],
      [DocumentCategory.MANUAL, '说明手册'],
      [DocumentCategory.PRESENTATION, '演示文稿'],
      [DocumentCategory.ACADEMIC, '学术资料'],
      [DocumentCategory.LEGAL, '法律文件'],
      [DocumentCategory.FINANCIAL, '财务资料'],
      [DocumentCategory.OTHER, '其他文档']
    ]);
  }

  /**
   * 获取所有模板
   */
  getTemplates(): OrganizationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * 获取模板
   */
  getTemplate(templateId: string): OrganizationTemplate | undefined {
    return this.templates.get(templateId);
  }
}

// 文件夹组织器接口
interface FolderOrganizer {
  organize(documents: DocumentAnalysis[], existing?: FolderStructure): FolderStructure;
}

// 基于类别的组织器
class CategoryBasedOrganizer implements FolderOrganizer {
  constructor(private categoryTranslations: Map<DocumentCategory, string>) {}

  organize(documents: DocumentAnalysis[], existing?: FolderStructure): FolderStructure {
    const categoryGroups = this.groupByCategory(documents);
    const rootFolder: FolderStructure = {
      id: 'root',
      name: '文档库',
      path: '/',
      level: 0,
      children: [],
      suggestedFiles: [],
      organizationRule: {
        type: OrganizationType.BY_CATEGORY,
        criteria: { groupBy: 'category' },
        template: {} as OrganizationTemplate,
        priority: 1
      },
      confidence: 0.8
    };

    // 创建一级分类文件夹
    for (const [category, docs] of categoryGroups) {
      const categoryFolder = this.createCategoryFolder(category, docs, rootFolder);
      rootFolder.children.push(categoryFolder);

      // 如果文档数量较多，创建二级分类
      if (docs.length > 10) {
        const subGroups = this.createSubGroups(docs);
        for (const [subCategory, subDocs] of subGroups) {
          const subFolder = this.createSubCategoryFolder(subCategory, subDocs, categoryFolder);
          categoryFolder.children.push(subFolder);
        }
      }
    }

    return rootFolder;
  }

  private groupByCategory(documents: DocumentAnalysis[]): Map<string, DocumentAnalysis[]> {
    const groups = new Map<string, DocumentAnalysis[]>();

    documents.forEach(doc => {
      const category = this.categoryTranslations.get(doc.classification.category) || '其他文档';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(doc);
    });

    return groups;
  }

  private createCategoryFolder(category: string, docs: DocumentAnalysis[], parent: FolderStructure): FolderStructure {
    return {
      id: `category_${category}`,
      name: category,
      path: `${parent.path}${category}/`,
      level: parent.level + 1,
      parent: parent.id,
      children: [],
      suggestedFiles: docs.map(doc => doc.documentId),
      organizationRule: parent.organizationRule,
      confidence: 0.9
    };
  }

  private createSubGroups(docs: DocumentAnalysis[]): Map<string, DocumentAnalysis[]> {
    // 按年份进一步分组
    const groups = new Map<string, DocumentAnalysis[]>();

    docs.forEach(doc => {
      const year = doc.metadata.creationDate?.getFullYear() || new Date().getFullYear();
      const yearKey = `${year}年`;
      
      if (!groups.has(yearKey)) {
        groups.set(yearKey, []);
      }
      groups.get(yearKey)!.push(doc);
    });

    return groups;
  }

  private createSubCategoryFolder(subCategory: string, docs: DocumentAnalysis[], parent: FolderStructure): FolderStructure {
    return {
      id: `subcategory_${parent.id}_${subCategory}`,
      name: subCategory,
      path: `${parent.path}${subCategory}/`,
      level: parent.level + 1,
      parent: parent.id,
      children: [],
      suggestedFiles: docs.map(doc => doc.documentId),
      organizationRule: parent.organizationRule,
      confidence: 0.8
    };
  }
}

// 基于日期的组织器
class DateBasedOrganizer implements FolderOrganizer {
  constructor(private categoryTranslations: Map<DocumentCategory, string>) {}

  organize(documents: DocumentAnalysis[]): FolderStructure {
    const rootFolder: FolderStructure = {
      id: 'root',
      name: '文档库',
      path: '/',
      level: 0,
      children: [],
      suggestedFiles: [],
      organizationRule: {
        type: OrganizationType.BY_DATE,
        criteria: { groupBy: 'date' },
        template: {} as OrganizationTemplate,
        priority: 1
      },
      confidence: 0.8
    };

    const yearGroups = this.groupByYear(documents);

    for (const [year, yearDocs] of yearGroups) {
      const yearFolder = this.createYearFolder(year, rootFolder);
      rootFolder.children.push(yearFolder);

      const monthGroups = this.groupByMonth(yearDocs);
      for (const [month, monthDocs] of monthGroups) {
        const monthFolder = this.createMonthFolder(year, month, yearFolder);
        yearFolder.children.push(monthFolder);

        if (monthDocs.length > 20) {
          const categoryGroups = this.groupByCategory(monthDocs);
          for (const [category, categoryDocs] of categoryGroups) {
            const categoryFolder = this.createCategoryFolder(category, monthFolder);
            monthFolder.children.push(categoryFolder);
            categoryFolder.suggestedFiles = categoryDocs.map(doc => doc.documentId);
          }
        } else {
          monthFolder.suggestedFiles = monthDocs.map(doc => doc.documentId);
        }
      }
    }

    return rootFolder;
  }

  private groupByYear(documents: DocumentAnalysis[]): Map<number, DocumentAnalysis[]> {
    const groups = new Map<number, DocumentAnalysis[]>();

    documents.forEach(doc => {
      const year = doc.metadata.creationDate?.getFullYear() || new Date().getFullYear();
      if (!groups.has(year)) {
        groups.set(year, []);
      }
      groups.get(year)!.push(doc);
    });

    return groups;
  }

  private groupByMonth(documents: DocumentAnalysis[]): Map<number, DocumentAnalysis[]> {
    const groups = new Map<number, DocumentAnalysis[]>();

    documents.forEach(doc => {
      const month = doc.metadata.creationDate?.getMonth() || new Date().getMonth();
      if (!groups.has(month)) {
        groups.set(month, []);
      }
      groups.get(month)!.push(doc);
    });

    return groups;
  }

  private groupByCategory(documents: DocumentAnalysis[]): Map<string, DocumentAnalysis[]> {
    const groups = new Map<string, DocumentAnalysis[]>();

    documents.forEach(doc => {
      const category = this.categoryTranslations.get(doc.classification.category) || '其他文档';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(doc);
    });

    return groups;
  }

  private createYearFolder(year: number, parent: FolderStructure): FolderStructure {
    return {
      id: `year_${year}`,
      name: `${year}年`,
      path: `${parent.path}${year}年/`,
      level: parent.level + 1,
      parent: parent.id,
      children: [],
      suggestedFiles: [],
      organizationRule: parent.organizationRule,
      confidence: 0.9
    };
  }

  private createMonthFolder(year: number, month: number, parent: FolderStructure): FolderStructure {
    const monthName = `${month + 1}月`;
    return {
      id: `month_${year}_${month}`,
      name: monthName,
      path: `${parent.path}${monthName}/`,
      level: parent.level + 1,
      parent: parent.id,
      children: [],
      suggestedFiles: [],
      organizationRule: parent.organizationRule,
      confidence: 0.8
    };
  }

  private createCategoryFolder(category: string, parent: FolderStructure): FolderStructure {
    return {
      id: `category_${parent.id}_${category}`,
      name: category,
      path: `${parent.path}${category}/`,
      level: parent.level + 1,
      parent: parent.id,
      children: [],
      suggestedFiles: [],
      organizationRule: parent.organizationRule,
      confidence: 0.7
    };
  }
}

// 基于项目的组织器
class ProjectBasedOrganizer implements FolderOrganizer {
  constructor(private categoryTranslations: Map<DocumentCategory, string>) {}

  organize(documents: DocumentAnalysis[]): FolderStructure {
    const rootFolder: FolderStructure = {
      id: 'root',
      name: '项目文档',
      path: '/',
      level: 0,
      children: [],
      suggestedFiles: [],
      organizationRule: {
        type: OrganizationType.BY_PROJECT,
        criteria: { groupBy: 'project' },
        template: {} as OrganizationTemplate,
        priority: 1
      },
      confidence: 0.7
    };

    // 简单的项目分组逻辑
    const projectGroups = this.groupByProject(documents);

    for (const [project, docs] of projectGroups) {
      const projectFolder = this.createProjectFolder(project, docs, rootFolder);
      rootFolder.children.push(projectFolder);
    }

    return rootFolder;
  }

  private groupByProject(documents: DocumentAnalysis[]): Map<string, DocumentAnalysis[]> {
    const groups = new Map<string, DocumentAnalysis[]>();

    documents.forEach(doc => {
      // 简单的项目识别逻辑，基于关键词
      const keywords = doc.content.keywords;
      let project = '默认项目';
      
      // 查找可能的项目名称
      for (const keyword of keywords) {
        if (keyword.includes('项目') || keyword.includes('工程') || keyword.includes('计划')) {
          project = keyword;
          break;
        }
      }

      if (!groups.has(project)) {
        groups.set(project, []);
      }
      groups.get(project)!.push(doc);
    });

    return groups;
  }

  private createProjectFolder(project: string, docs: DocumentAnalysis[], parent: FolderStructure): FolderStructure {
    return {
      id: `project_${project}`,
      name: project,
      path: `${parent.path}${project}/`,
      level: parent.level + 1,
      parent: parent.id,
      children: [],
      suggestedFiles: docs.map(doc => doc.documentId),
      organizationRule: parent.organizationRule,
      confidence: 0.6
    };
  }
}

// 基于模板的组织器
class TemplateBasedOrganizer implements FolderOrganizer {
  constructor(
    private template: OrganizationTemplate,
    private categoryTranslations: Map<DocumentCategory, string>
  ) {}

  organize(documents: DocumentAnalysis[]): FolderStructure {
    const rootFolder: FolderStructure = {
      id: 'root',
      name: this.template.name,
      path: '/',
      level: 0,
      children: [],
      suggestedFiles: [],
      organizationRule: {
        type: this.template.type,
        criteria: { groupBy: 'template' },
        template: this.template,
        priority: 1
      },
      confidence: 0.8
    };

    // 根据模板规则组织文档
    const groups = this.groupByTemplate(documents);

    for (const [groupKey, docs] of groups) {
      const folder = this.createTemplateFolder(groupKey, docs, rootFolder);
      rootFolder.children.push(folder);
    }

    return rootFolder;
  }

  private groupByTemplate(documents: DocumentAnalysis[]): Map<string, DocumentAnalysis[]> {
    const groups = new Map<string, DocumentAnalysis[]>();

    documents.forEach(doc => {
      const groupKey = this.generateGroupKey(doc);
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(doc);
    });

    return groups;
  }

  private generateGroupKey(doc: DocumentAnalysis): string {
    // 根据模板的第一级规则生成分组键
    const firstLevel = this.template.structure.levels[0];
    if (!firstLevel) return '默认';

    // 简化的分组逻辑
    switch (firstLevel.name) {
      case '类型':
        return this.categoryTranslations.get(doc.classification.category) || '其他';
      case '年份':
        return `${doc.metadata.creationDate?.getFullYear() || new Date().getFullYear()}年`;
      case '部门':
        return '通用部门'; // 简化处理
      default:
        return '默认';
    }
  }

  private createTemplateFolder(groupKey: string, docs: DocumentAnalysis[], parent: FolderStructure): FolderStructure {
    return {
      id: `template_${groupKey}`,
      name: groupKey,
      path: `${parent.path}${groupKey}/`,
      level: parent.level + 1,
      parent: parent.id,
      children: [],
      suggestedFiles: docs.map(doc => doc.documentId),
      organizationRule: parent.organizationRule,
      confidence: 0.7
    };
  }
}

// 导出单例实例
export const folderOrganizationEngine = new FolderOrganizationEngine();