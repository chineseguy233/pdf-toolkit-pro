export class ChineseTextProcessor {
  private segmenter: any;
  private stopWords: Set<string> = new Set();

  constructor() {
    // 使用现代浏览器的原生分词器
    try {
      this.segmenter = new (Intl as any).Segmenter('zh-CN', { granularity: 'word' });
    } catch (error) {
      this.segmenter = null;
    }
    this.initializeStopWords();
  }

  /**
   * 提取关键词
   */
  extractKeywords(text: string, maxKeywords: number = 10): string[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    try {
      // 清理文本
      const cleanText = this.cleanText(text);
      
      // 中文分词
      const words = this.segmentText(cleanText);
      
      // 过滤停用词
      const filteredWords = this.removeStopWords(words);
      
      // 计算词频
      const wordFreq = this.calculateWordFrequency(filteredWords);
      
      // 提取关键词
      return this.extractTopKeywords(wordFreq, maxKeywords);
    } catch (error) {
      console.warn('关键词提取失败，使用简单分词:', error);
      return this.fallbackKeywordExtraction(text, maxKeywords);
    }
  }

  /**
   * 清理文本
   */
  private cleanText(text: string): string {
    return text
      .replace(/[\r\n\t]+/g, ' ')           // 替换换行符和制表符
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 保留中文、英文、数字
      .replace(/\s+/g, ' ')                 // 合并多个空格
      .trim();
  }

  /**
   * 中文分词
   */
  private segmentText(text: string): string[] {
    try {
      if (this.segmenter) {
        const segments = Array.from(this.segmenter.segment(text));
        return segments
          .filter((segment: any) => segment.isWordLike)
          .map((segment: any) => segment.segment)
          .filter(word => word.trim().length > 0);
      }
    } catch (error) {
      console.warn('分词器不可用，使用简单分割:', error);
    }
    
    // 如果分词器不可用，使用简单的空格分割
    return text.split(/\s+/).filter(word => word.length > 0);
  }

  /**
   * 移除停用词
   */
  private removeStopWords(words: string[]): string[] {
    return words.filter(word => 
      !this.stopWords.has(word.toLowerCase()) && 
      word.length > 1 && 
      !/^\d+$/.test(word) // 排除纯数字
    );
  }

  /**
   * 计算词频
   */
  private calculateWordFrequency(words: string[]): Map<string, number> {
    const frequency = new Map<string, number>();
    
    words.forEach(word => {
      const normalizedWord = word.toLowerCase();
      frequency.set(normalizedWord, (frequency.get(normalizedWord) || 0) + 1);
    });
    
    return frequency;
  }

  /**
   * 提取高频关键词
   */
  private extractTopKeywords(wordFreq: Map<string, number>, maxKeywords: number): string[] {
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1]) // 按频率降序排列
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * 备用关键词提取方法
   */
  private fallbackKeywordExtraction(text: string, maxKeywords: number): string[] {
    // 简单的基于长度和频率的关键词提取
    const words = text
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length >= 2 && word.length <= 10)
      .filter(word => !this.stopWords.has(word.toLowerCase()));

    const frequency = new Map<string, number>();
    words.forEach(word => {
      const normalizedWord = word.toLowerCase();
      frequency.set(normalizedWord, (frequency.get(normalizedWord) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .filter(([, freq]) => freq > 1) // 至少出现2次
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * 初始化停用词
   */
  private initializeStopWords(): void {
    this.stopWords = new Set([
      // 中文停用词
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人',
      '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去',
      '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '里',
      '就是', '还是', '比较', '一些', '可以', '这个', '什么', '没',
      '从', '他', '她', '它', '我们', '你们', '他们', '这些', '那些',
      '如果', '因为', '所以', '但是', '然后', '或者', '而且', '不过',
      '虽然', '虽说', '尽管', '即使', '假如', '要是', '除非', '只要',
      '不仅', '不但', '而且', '并且', '以及', '还有', '另外', '此外',
      
      // 英文停用词
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
      'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
      'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      
      // 常见标点和符号
      ',', '.', '!', '?', ';', ':', '"', "'", '(', ')',
      '[', ']', '{', '}', '<', '>', '/', '\\', '|', '-', '_', '=', '+',
      '*', '&', '%', '$', '#', '@', '~', '`'
    ]);
  }

  /**
   * 检测文本语言
   */
  detectLanguage(text: string): 'zh' | 'en' | 'mixed' | 'unknown' {
    if (!text || text.trim().length === 0) {
      return 'unknown';
    }

    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    const totalChars = chineseChars + englishChars;

    if (totalChars === 0) {
      return 'unknown';
    }

    const chineseRatio = chineseChars / totalChars;
    const englishRatio = englishChars / totalChars;

    if (chineseRatio > 0.7) {
      return 'zh';
    } else if (englishRatio > 0.7) {
      return 'en';
    } else if (chineseRatio > 0.3 && englishRatio > 0.3) {
      return 'mixed';
    } else {
      return 'unknown';
    }
  }

  /**
   * 文本摘要生成
   */
  generateSummary(text: string, maxSentences: number = 3): string {
    if (!text || text.trim().length === 0) {
      return '';
    }

    // 按句子分割
    const sentences = text
      .split(/[。！？.!?]/)
      .map(s => s.trim())
      .filter(s => s.length > 5); // 过滤太短的句子

    if (sentences.length === 0) {
      return text.substring(0, 100) + (text.length > 100 ? '...' : '');
    }

    // 取前几句作为摘要
    return sentences
      .slice(0, Math.min(maxSentences, sentences.length))
      .join('。') + '。';
  }

  /**
   * 计算文本相似度
   */
  calculateSimilarity(text1: string, text2: string): number {
    const keywords1 = new Set(this.extractKeywords(text1, 20));
    const keywords2 = new Set(this.extractKeywords(text2, 20));
    
    const keywords1Array = Array.from(keywords1);
    const keywords2Array = Array.from(keywords2);
    const intersection = new Set(keywords1Array.filter(x => keywords2.has(x)));
    const union = new Set([...keywords1Array, ...keywords2Array]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 提取文本中的数字信息
   */
  extractNumbers(text: string): number[] {
    const numberPattern = /\d+(?:\.\d+)?/g;
    const matches = text.match(numberPattern);
    return matches ? matches.map(Number).filter(n => !isNaN(n)) : [];
  }

  /**
   * 提取文本中的日期信息
   */
  extractDates(text: string): string[] {
    const datePatterns = [
      /\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?/g,  // 2024-01-01 或 2024年1月1日
      /\d{1,2}[-/]\d{1,2}[-/]\d{4}/g,        // 01-01-2024 或 01/01/2024
      /\d{4}\.\d{1,2}\.\d{1,2}/g             // 2024.01.01
    ];
    
    const dates: string[] = [];
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    });
    
    return Array.from(new Set(dates)); // 去重
  }
}