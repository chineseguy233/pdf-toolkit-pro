import { pdfService, PDFDocumentInfo } from './PDFService';
import { ChineseTextProcessor } from './ChineseTextProcessor';

export interface DocumentAnalysis {
  documentId: string;
  metadata: DocumentMetadata;
  content: ContentAnalysis;
  classification: DocumentClassification;
  confidence: number;
  analysisTime: number;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
  fileSize: number;
  pdfVersion?: string;
  language?: string;
}

export interface ContentAnalysis {
  extractedTitle?: string;
  keywords: string[];
  summary: string;
  textLength: number;
  pageTexts: string[];
  hasImages: boolean;
  hasTables: boolean;
  mainLanguage: string;
}

export interface DocumentClassification {
  category: DocumentCategory;
  confidence: number;
  features: ClassificationFeature[];
  alternativeCategories: DocumentCategory[];
}

export enum DocumentCategory {
  CONTRACT = 'contract',        // 合同
  INVOICE = 'invoice',         // 发票
  REPORT = 'report',           // 报告
  RESUME = 'resume',           // 简历
  MANUAL = 'manual',           // 手册
  PRESENTATION = 'presentation', // 演示文稿
  ACADEMIC = 'academic',       // 学术文档
  LEGAL = 'legal',             // 法律文档
  FINANCIAL = 'financial',    // 财务文档
  OTHER = 'other'              // 其他
}

export interface ClassificationFeature {
  name: string;
  value: string | number;
  weight: number;
}

interface ClassificationRule {
  pattern: RegExp;
  weight: number;
}

export class PDFContentAnalyzer {
  private textProcessor: ChineseTextProcessor;
  private analysisCache = new Map<string, DocumentAnalysis>();
  private classificationRules: Map<DocumentCategory, ClassificationRule[]> = new Map();

  constructor() {
    this.textProcessor = new ChineseTextProcessor();
    this.initializeClassificationRules();
  }

  /**
   * 分析PDF文档
   */
  async analyzeDocument(
    documentId: string, 
    fileBuffer: ArrayBuffer, 
    fileSize: number
  ): Promise<DocumentAnalysis> {
    const startTime = performance.now();
    
    // 检查缓存
    if (this.analysisCache.has(documentId)) {
      return this.analysisCache.get(documentId)!;
    }

    try {
      // 加载PDF文档
      const pdfInfo = await pdfService.loadDocument(fileBuffer, documentId);
      
      // 提取元数据
      const metadata = this.extractMetadata(pdfInfo, fileSize);
      
      // 分析内容
      const content = await this.analyzeContent(documentId);
      
      // 文档分类
      const classification = this.classifyDocument(content, metadata);
      
      const analysisTime = performance.now() - startTime;
      
      const analysis: DocumentAnalysis = {
        documentId,
        metadata,
        content,
        classification,
        confidence: classification.confidence,
        analysisTime
      };

      // 缓存结果
      this.analysisCache.set(documentId, analysis);
      
      return analysis;
    } catch (error: any) {
      console.error('文档分析失败:', error);
      throw new Error(`文档分析失败: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 提取文档元数据
   */
  private extractMetadata(pdfInfo: PDFDocumentInfo, fileSize: number): DocumentMetadata {
    return {
      title: pdfInfo.title,
      author: pdfInfo.author,
      subject: pdfInfo.subject,
      keywords: pdfInfo.keywords,
      creator: pdfInfo.creator,
      producer: pdfInfo.producer,
      creationDate: pdfInfo.creationDate,
      modificationDate: pdfInfo.modificationDate,
      pageCount: pdfInfo.numPages,
      fileSize,
      pdfVersion: pdfInfo.pdfVersion,
      language: this.detectLanguage(pdfInfo.title, pdfInfo.subject)
    };
  }

  /**
   * 分析文档内容
   */
  private async analyzeContent(documentId: string): Promise<ContentAnalysis> {
    try {
      // 提取全文内容
      const fullText = await pdfService.getAllTextContent(documentId);
      
      // 提取关键词
      const keywords = this.textProcessor.extractKeywords(fullText, 10);
      
      // 生成摘要
      const summary = this.generateSummary(fullText);
      
      // 提取标题
      const extractedTitle = this.extractTitle(fullText);
      
      // 检测语言
      const mainLanguage = this.detectLanguage(fullText);
      
      // 分析页面内容
      const pageTexts = await this.extractPageTexts(documentId);
      
      return {
        extractedTitle,
        keywords,
        summary,
        textLength: fullText.length,
        pageTexts,
        hasImages: false, // TODO: 实现图像检测
        hasTables: this.detectTables(fullText),
        mainLanguage
      };
    } catch (error) {
      console.error('内容分析失败:', error);
      throw error;
    }
  }

  /**
   * 提取各页面文本
   */
  private async extractPageTexts(documentId: string): Promise<string[]> {
    const document = pdfService['documentCache'].get(documentId);
    if (!document) {
      throw new Error('文档未加载');
    }

    const pageTexts: string[] = [];
    
    for (let pageNum = 1; pageNum <= document.numPages; pageNum++) {
      try {
        const textContent = await pdfService.getPageTextContent(documentId, pageNum);
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
          .trim();
        pageTexts.push(pageText);
      } catch (error) {
        console.warn(`提取第${pageNum}页文本失败:`, error);
        pageTexts.push('');
      }
    }
    
    return pageTexts;
  }

  /**
   * 文档分类
   */
  private classifyDocument(content: ContentAnalysis, metadata: DocumentMetadata): DocumentClassification {
    const features: ClassificationFeature[] = [];
    const scores = new Map<DocumentCategory, number>();
    
    // 基于内容的分类
    const text = content.pageTexts.join(' ') + ' ' + (metadata.title || '') + ' ' + (metadata.subject || '');
    
    // 计算每个类别的得分
    for (const [category, rules] of Array.from(this.classificationRules)) {
      let score = 0;
      
      for (const rule of rules) {
        const matches = text.match(rule.pattern);
        if (matches) {
          score += rule.weight * matches.length;
          features.push({
            name: `${category}_pattern_match`,
            value: matches.length,
            weight: rule.weight
          });
        }
      }
      
      scores.set(category, score);
    }
    
    // 找到最高得分的类别
    const sortedScores = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const [topCategory, topScore] = sortedScores[0];
    const confidence = this.normalizeScore(topScore, text.length);
    
    return {
      category: topCategory,
      confidence,
      features,
      alternativeCategories: sortedScores
        .slice(1, 4)
        .map(([category]) => category)
    };
  }

  /**
   * 初始化分类规则
   */
  private initializeClassificationRules(): void {
    this.classificationRules = new Map([
      [DocumentCategory.CONTRACT, [
        { pattern: /合同|协议|甲方|乙方/gi, weight: 0.8 },
        { pattern: /签署|签订|条款|违约/gi, weight: 0.6 },
        { pattern: /有效期|终止|解除/gi, weight: 0.4 }
      ]],
      [DocumentCategory.INVOICE, [
        { pattern: /发票|税号|金额|开票/gi, weight: 0.9 },
        { pattern: /增值税|普通发票|专用发票/gi, weight: 0.8 },
        { pattern: /购买方|销售方|税率/gi, weight: 0.6 }
      ]],
      [DocumentCategory.REPORT, [
        { pattern: /报告|分析|总结|概述/gi, weight: 0.7 },
        { pattern: /数据|统计|图表|结论/gi, weight: 0.6 },
        { pattern: /建议|展望|趋势/gi, weight: 0.5 }
      ]],
      [DocumentCategory.RESUME, [
        { pattern: /简历|履历|个人信息|工作经历/gi, weight: 0.9 },
        { pattern: /教育背景|技能|项目经验/gi, weight: 0.7 },
        { pattern: /联系方式|邮箱|电话/gi, weight: 0.5 }
      ]],
      [DocumentCategory.ACADEMIC, [
        { pattern: /论文|研究|学术|期刊/gi, weight: 0.8 },
        { pattern: /摘要|关键词|参考文献/gi, weight: 0.7 },
        { pattern: /实验|方法|结果|讨论/gi, weight: 0.6 }
      ]],
      [DocumentCategory.FINANCIAL, [
        { pattern: /财务|会计|资产|负债/gi, weight: 0.8 },
        { pattern: /收入|支出|利润|成本/gi, weight: 0.7 },
        { pattern: /预算|审计|投资|融资/gi, weight: 0.6 }
      ]]
    ]);
  }

  /**
   * 检测语言
   */
  private detectLanguage(text?: string, fallback?: string): string {
    const content = (text || '') + ' ' + (fallback || '');
    
    // 简单的中文检测
    const chineseChars = content.match(/[\u4e00-\u9fa5]/g);
    const englishChars = content.match(/[a-zA-Z]/g);
    
    if (chineseChars && chineseChars.length > (englishChars?.length || 0)) {
      return 'zh-CN';
    } else if (englishChars && englishChars.length > 0) {
      return 'en-US';
    }
    
    return 'unknown';
  }

  /**
   * 提取标题
   */
  private extractTitle(text: string): string {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) return '';
    
    // 取第一行作为标题，限制长度
    const firstLine = lines[0].trim();
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  }

  /**
   * 生成摘要
   */
  private generateSummary(text: string, maxLength: number = 200): string {
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
    
    if (sentences.length === 0) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }
    
    // 取前几句作为摘要
    let summary = '';
    for (const sentence of sentences.slice(0, 3)) {
      if (summary.length + sentence.length > maxLength) break;
      summary += sentence.trim() + '。';
    }
    
    return summary || text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  /**
   * 检测表格
   */
  private detectTables(text: string): boolean {
    // 简单的表格检测：查找制表符或多个连续空格
    return /\t|\s{4,}/.test(text) || /\|.*\|/.test(text);
  }

  /**
   * 标准化得分
   */
  private normalizeScore(score: number, textLength: number): number {
    if (textLength === 0) return 0;
    
    // 基于文本长度标准化得分
    const normalizedScore = Math.min(score / Math.sqrt(textLength / 1000), 1);
    return Math.max(normalizedScore, 0);
  }

  /**
   * 获取分析结果
   */
  getAnalysis(documentId: string): DocumentAnalysis | undefined {
    return this.analysisCache.get(documentId);
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.analysisCache.clear();
  }
}

// 导出单例实例
export const pdfContentAnalyzer = new PDFContentAnalyzer();