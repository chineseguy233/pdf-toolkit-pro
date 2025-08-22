import { DocumentAnalysis, DocumentCategory } from './PDFContentAnalyzer';

export interface NamingSuggestion {
  id: string;
  suggestedName: string;
  confidence: number;
  strategy: NamingStrategy;
  components: NameComponents;
  reasoning: string;
}

export interface NameComponents {
  date?: string;
  category?: string;
  title?: string;
  keywords?: string[];
  version?: string;
  extension: string;
}

export enum NamingStrategy {
  DATE_CATEGORY_TITLE = 'date-category-title',
  CATEGORY_TITLE_DATE = 'category-title-date',
  TITLE_ONLY = 'title-only',
  KEYWORDS_BASED = 'keywords-based',
  OPTIMIZED_ORIGINAL = 'optimized-original'
}

interface NameTemplate {
  pattern: string;
  description: string;
  example: string;
}

export class SmartRenameEngine {
  private templates: Map<NamingStrategy, NameTemplate> = new Map();
  private categoryTranslations: Map<DocumentCategory, string> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeCategoryTranslations();
  }

  /**
   * 生成重命名建议
   */
  async generateSuggestions(
    documentAnalysis: DocumentAnalysis,
    originalFileName: string
  ): Promise<NamingSuggestion[]> {
    const suggestions: NamingSuggestion[] = [];
    const components = this.extractNameComponents(documentAnalysis, originalFileName);

    try {
      // 策略1: 日期-类型-标题
      suggestions.push(this.generateDateCategoryTitle(components));
      
      // 策略2: 类型-标题-日期
      suggestions.push(this.generateCategoryTitleDate(components));
      
      // 策略3: 仅标题
      suggestions.push(this.generateTitleOnly(components));
      
      // 策略4: 关键词组合
      suggestions.push(this.generateKeywordsBased(components));
      
      // 策略5: 优化原文件名
      suggestions.push(this.optimizeOriginalName(originalFileName, documentAnalysis));

      // 排序和去重
      return this.rankAndDeduplicateSuggestions(suggestions);
    } catch (error: any) {
      console.error('生成重命名建议失败:', error);
      return [this.createFallbackSuggestion(originalFileName, components)];
    }
  }

  /**
   * 提取命名组件
   */
  private extractNameComponents(analysis: DocumentAnalysis, originalFileName: string): NameComponents {
    const extension = this.getFileExtension(originalFileName);
    
    return {
      date: this.extractDate(analysis),
      category: this.translateCategory(analysis.classification.category),
      title: this.extractTitle(analysis),
      keywords: analysis.content.keywords.slice(0, 3), // 取前3个关键词
      extension
    };
  }

  /**
   * 策略1: 日期-类型-标题
   */
  private generateDateCategoryTitle(components: NameComponents): NamingSuggestion {
    const parts: string[] = [];
    
    if (components.date) parts.push(components.date);
    if (components.category) parts.push(components.category);
    if (components.title) parts.push(this.cleanTitle(components.title));
    
    const suggestedName = this.sanitizeFileName(parts.join('-') + components.extension);
    
    return {
      id: this.generateId(),
      suggestedName,
      confidence: this.calculateConfidence(components, ['date', 'category', 'title']),
      strategy: NamingStrategy.DATE_CATEGORY_TITLE,
      components,
      reasoning: '基于日期、文档类型和标题的标准命名格式'
    };
  }

  /**
   * 策略2: 类型-标题-日期
   */
  private generateCategoryTitleDate(components: NameComponents): NamingSuggestion {
    const parts: string[] = [];
    
    if (components.category) parts.push(components.category);
    if (components.title) parts.push(this.cleanTitle(components.title));
    if (components.date) parts.push(components.date);
    
    const suggestedName = this.sanitizeFileName(parts.join('-') + components.extension);
    
    return {
      id: this.generateId(),
      suggestedName,
      confidence: this.calculateConfidence(components, ['category', 'title', 'date']),
      strategy: NamingStrategy.CATEGORY_TITLE_DATE,
      components,
      reasoning: '基于文档类型、标题和日期的命名格式'
    };
  }

  /**
   * 策略3: 仅标题
   */
  private generateTitleOnly(components: NameComponents): NamingSuggestion {
    const title = components.title || '未命名文档';
    const suggestedName = this.sanitizeFileName(this.cleanTitle(title) + components.extension);
    
    return {
      id: this.generateId(),
      suggestedName,
      confidence: components.title ? 0.8 : 0.3,
      strategy: NamingStrategy.TITLE_ONLY,
      components,
      reasoning: '基于文档标题的简洁命名'
    };
  }

  /**
   * 策略4: 关键词组合
   */
  private generateKeywordsBased(components: NameComponents): NamingSuggestion {
    const keywords = components.keywords || [];
    const keywordString = keywords.slice(0, 3).join('-');
    
    const parts: string[] = [];
    if (components.category) parts.push(components.category);
    if (keywordString) parts.push(keywordString);
    
    const suggestedName = this.sanitizeFileName(parts.join('-') + components.extension);
    
    return {
      id: this.generateId(),
      suggestedName,
      confidence: keywords.length > 0 ? 0.7 : 0.2,
      strategy: NamingStrategy.KEYWORDS_BASED,
      components,
      reasoning: '基于文档关键词的智能命名'
    };
  }

  /**
   * 策略5: 优化原文件名
   */
  private optimizeOriginalName(originalFileName: string, analysis: DocumentAnalysis): NamingSuggestion {
    const nameWithoutExt = this.getFileNameWithoutExtension(originalFileName);
    const extension = this.getFileExtension(originalFileName);
    
    // 清理原文件名
    let optimizedName = nameWithoutExt
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s\-_]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .replace(/-+/g, '-') // 合并多个连字符
      .trim();
    
    // 如果原文件名太短或无意义，添加类型前缀
    if (optimizedName.length < 3 || /^(文档|document|file|pdf)\d*$/i.test(optimizedName)) {
      const category = this.translateCategory(analysis.classification.category);
      optimizedName = `${category}-${optimizedName}`;
    }
    
    const suggestedName = this.sanitizeFileName(optimizedName + extension);
    
    return {
      id: this.generateId(),
      suggestedName,
      confidence: 0.6,
      strategy: NamingStrategy.OPTIMIZED_ORIGINAL,
      components: { ...this.extractNameComponents(analysis, originalFileName), title: optimizedName },
      reasoning: '优化原始文件名，保持用户习惯'
    };
  }

  /**
   * 提取日期
   */
  private extractDate(analysis: DocumentAnalysis): string | undefined {
    const creationDate = analysis.metadata.creationDate;
    const modificationDate = analysis.metadata.modificationDate;
    
    const date = creationDate || modificationDate;
    if (date) {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD格式
    }
    
    return undefined;
  }

  /**
   * 提取标题
   */
  private extractTitle(analysis: DocumentAnalysis): string | undefined {
    return analysis.metadata.title || analysis.content.extractedTitle;
  }

  /**
   * 翻译文档类别
   */
  private translateCategory(category: DocumentCategory): string {
    return this.categoryTranslations.get(category) || '文档';
  }

  /**
   * 清理标题
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .substring(0, 30) // 限制长度
      .trim();
  }

  /**
   * 文件名安全处理
   */
  private sanitizeFileName(fileName: string): string {
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/g;
    const reservedNames = new Set([
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ]);
    
    // 移除无效字符
    let sanitized = fileName.replace(invalidChars, '');
    
    // 移除首尾空格和点
    sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');
    
    // 检查保留名称
    const nameWithoutExt = sanitized.split('.')[0].toUpperCase();
    if (reservedNames.has(nameWithoutExt)) {
      sanitized = `文档_${sanitized}`;
    }
    
    // 限制长度
    if (sanitized.length > 200) {
      const ext = this.getFileExtension(sanitized);
      const nameOnly = sanitized.substring(0, 200 - ext.length);
      sanitized = nameOnly + ext;
    }
    
    // 确保不为空
    if (!sanitized || sanitized === '.pdf') {
      sanitized = `未命名文档_${Date.now()}.pdf`;
    }
    
    return sanitized;
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(components: NameComponents, requiredFields: string[]): number {
    let score = 0;
    let totalFields = requiredFields.length;
    
    for (const field of requiredFields) {
      if (components[field as keyof NameComponents]) {
        score += 1;
      }
    }
    
    return score / totalFields;
  }

  /**
   * 排序和去重建议
   */
  private rankAndDeduplicateSuggestions(suggestions: NamingSuggestion[]): NamingSuggestion[] {
    // 去重
    const uniqueSuggestions = new Map<string, NamingSuggestion>();
    
    suggestions.forEach(suggestion => {
      const key = suggestion.suggestedName.toLowerCase();
      if (!uniqueSuggestions.has(key) || 
          uniqueSuggestions.get(key)!.confidence < suggestion.confidence) {
        uniqueSuggestions.set(key, suggestion);
      }
    });
    
    // 按置信度排序
    return Array.from(uniqueSuggestions.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // 最多返回5个建议
  }

  /**
   * 创建备用建议
   */
  private createFallbackSuggestion(originalFileName: string, components: NameComponents): NamingSuggestion {
    const timestamp = new Date().toISOString().split('T')[0];
    const suggestedName = `文档_${timestamp}${components.extension}`;
    
    return {
      id: this.generateId(),
      suggestedName,
      confidence: 0.1,
      strategy: NamingStrategy.TITLE_ONLY,
      components,
      reasoning: '备用命名方案'
    };
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot) : '.pdf';
  }

  /**
   * 获取不含扩展名的文件名
   */
  private getFileNameWithoutExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 初始化模板
   */
  private initializeTemplates(): void {
    this.templates = new Map([
      [NamingStrategy.DATE_CATEGORY_TITLE, {
        pattern: '{date}-{category}-{title}',
        description: '日期-类型-标题格式',
        example: '2024-01-15-合同-租赁协议'
      }],
      [NamingStrategy.CATEGORY_TITLE_DATE, {
        pattern: '{category}-{title}-{date}',
        description: '类型-标题-日期格式',
        example: '发票-办公用品采购-2024-01-15'
      }],
      [NamingStrategy.TITLE_ONLY, {
        pattern: '{title}',
        description: '仅标题格式',
        example: '年度财务报告'
      }]
    ]);
  }

  /**
   * 初始化类别翻译
   */
  private initializeCategoryTranslations(): void {
    this.categoryTranslations = new Map([
      [DocumentCategory.CONTRACT, '合同'],
      [DocumentCategory.INVOICE, '发票'],
      [DocumentCategory.REPORT, '报告'],
      [DocumentCategory.RESUME, '简历'],
      [DocumentCategory.MANUAL, '手册'],
      [DocumentCategory.PRESENTATION, '演示'],
      [DocumentCategory.ACADEMIC, '学术'],
      [DocumentCategory.LEGAL, '法律'],
      [DocumentCategory.FINANCIAL, '财务'],
      [DocumentCategory.OTHER, '文档']
    ]);
  }
}

// 导出单例实例
export const smartRenameEngine = new SmartRenameEngine();