// OCR相关接口定义
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRWord {
  id: string;
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  fontSize: number;
  fontFamily?: string;
}

export interface OCRLine {
  id: string;
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  words: OCRWord[];
}

export interface OCRParagraph {
  id: string;
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  lines: OCRLine[];
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  words: OCRWord[];
  lines: OCRLine[];
  paragraphs: OCRParagraph[];
  pageNumber: number;
  processingTime: number;
}

export interface OCRProgress {
  status: 'initializing' | 'loading' | 'recognizing' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
}

// 图像预处理器
export class ImagePreprocessor {
  async preprocessImage(imageData: ImageData): Promise<ImageData> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      ctx.putImageData(imageData, 0, 0);
      
      // 应用预处理滤镜
      this.applyGrayscale(ctx, canvas.width, canvas.height);
      this.applyContrast(ctx, canvas.width, canvas.height, 1.2);
      this.applySharpening(ctx, canvas.width, canvas.height);
      this.applyNoiseReduction(ctx, canvas.width, canvas.height);
      
      const processedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(processedImageData);
    });
  }

  private applyGrayscale(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;     // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  private applyContrast(ctx: CanvasRenderingContext2D, width: number, height: number, factor: number): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  private applySharpening(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    
    // 锐化卷积核
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          output[(y * width + x) * 4 + c] = Math.min(255, Math.max(0, sum));
        }
      }
    }
    
    ctx.putImageData(new ImageData(output, width, height), 0, 0);
  }

  private applyNoiseReduction(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    
    // 简单的中值滤波
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          const values = [];
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              values.push(data[idx]);
            }
          }
          values.sort((a, b) => a - b);
          output[(y * width + x) * 4 + c] = values[4]; // 中值
        }
      }
    }
    
    ctx.putImageData(new ImageData(output, width, height), 0, 0);
  }
}

// OCR引擎（模拟实现，实际项目中应使用Tesseract.js）
export class OCREngine {
  private isInitialized = false;
  private imagePreprocessor = new ImagePreprocessor();
  private progressCallback?: (progress: OCRProgress) => void;

  async initialize(progressCallback?: (progress: OCRProgress) => void): Promise<void> {
    if (this.isInitialized) return;
    
    this.progressCallback = progressCallback;
    
    this.reportProgress('initializing', 0, '初始化OCR引擎...');
    
    // 模拟初始化过程
    await this.delay(500);
    this.reportProgress('loading', 30, '加载语言模型...');
    
    await this.delay(1000);
    this.reportProgress('loading', 60, '配置OCR参数...');
    
    await this.delay(500);
    this.reportProgress('loading', 100, '初始化完成');
    
    this.isInitialized = true;
    console.log('OCR引擎初始化完成');
  }

  async recognizeText(imageData: ImageData, pageNumber: number): Promise<OCRResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();
    
    this.reportProgress('recognizing', 0, '预处理图像...');
    
    // 图像预处理
    const processedImage = await this.imagePreprocessor.preprocessImage(imageData);
    
    this.reportProgress('recognizing', 30, '识别文字...');
    
    // 模拟OCR识别过程
    const mockResult = await this.simulateOCRRecognition(processedImage, pageNumber);
    
    this.reportProgress('recognizing', 80, '处理识别结果...');
    
    // 处理识别结果
    const result = this.processOCRResult(mockResult, pageNumber);
    
    const endTime = performance.now();
    result.processingTime = endTime - startTime;
    
    this.reportProgress('completed', 100, '识别完成');
    
    console.log(`OCR识别完成: 页面${pageNumber}, 耗时${result.processingTime.toFixed(2)}ms`);
    
    return result;
  }

  private async simulateOCRRecognition(imageData: ImageData, pageNumber: number): Promise<any> {
    // 模拟OCR识别延迟
    await this.delay(2000);
    
    // 生成模拟的OCR结果
    const mockWords: OCRWord[] = [
      {
        id: `word_${pageNumber}_1`,
        text: '这是一段',
        confidence: 0.95,
        boundingBox: { x: 100, y: 100, width: 80, height: 20 },
        fontSize: 14,
        fontFamily: 'SimSun'
      },
      {
        id: `word_${pageNumber}_2`,
        text: '中文文字',
        confidence: 0.92,
        boundingBox: { x: 190, y: 100, width: 80, height: 20 },
        fontSize: 14,
        fontFamily: 'SimSun'
      },
      {
        id: `word_${pageNumber}_3`,
        text: 'English',
        confidence: 0.98,
        boundingBox: { x: 280, y: 100, width: 60, height: 20 },
        fontSize: 14,
        fontFamily: 'Arial'
      },
      {
        id: `word_${pageNumber}_4`,
        text: 'text',
        confidence: 0.96,
        boundingBox: { x: 350, y: 100, width: 40, height: 20 },
        fontSize: 14,
        fontFamily: 'Arial'
      },
      {
        id: `word_${pageNumber}_5`,
        text: '识别测试',
        confidence: 0.88,
        boundingBox: { x: 100, y: 130, width: 80, height: 20 },
        fontSize: 14,
        fontFamily: 'SimSun'
      }
    ];

    return {
      words: mockWords,
      confidence: 0.93
    };
  }

  private processOCRResult(mockResult: any, pageNumber: number): OCRResult {
    const words = mockResult.words;
    
    // 生成行和段落
    const lines = this.groupWordsIntoLines(words);
    const paragraphs = this.groupLinesIntoParagraphs(lines);
    
    // 计算整体边界框
    const boundingBox = this.calculateOverallBoundingBox(words);
    
    // 合并所有文字
    const text = words.map((w: OCRWord) => w.text).join(' ');
    
    return {
      text,
      confidence: mockResult.confidence,
      boundingBox,
      words,
      lines,
      paragraphs,
      pageNumber,
      processingTime: 0 // 将在调用方设置
    };
  }

  private groupWordsIntoLines(words: OCRWord[]): OCRLine[] {
    const lines: OCRLine[] = [];
    const lineGroups = new Map<number, OCRWord[]>();
    
    // 按Y坐标分组（容差10像素）
    words.forEach(word => {
      const lineY = Math.round(word.boundingBox.y / 10) * 10;
      if (!lineGroups.has(lineY)) {
        lineGroups.set(lineY, []);
      }
      lineGroups.get(lineY)!.push(word);
    });
    
    // 为每个行组创建OCRLine
    lineGroups.forEach((lineWords, y) => {
      // 按X坐标排序
      lineWords.sort((a, b) => a.boundingBox.x - b.boundingBox.x);
      
      const boundingBox = this.calculateOverallBoundingBox(lineWords);
      const text = lineWords.map(w => w.text).join(' ');
      const confidence = lineWords.reduce((sum, w) => sum + w.confidence, 0) / lineWords.length;
      
      lines.push({
        id: `line_${lines.length + 1}`,
        text,
        confidence,
        boundingBox,
        words: lineWords
      });
    });
    
    return lines.sort((a, b) => a.boundingBox.y - b.boundingBox.y);
  }

  private groupLinesIntoParagraphs(lines: OCRLine[]): OCRParagraph[] {
    const paragraphs: OCRParagraph[] = [];
    let currentParagraph: OCRLine[] = [];
    
    lines.forEach((line, index) => {
      currentParagraph.push(line);
      
      // 如果是最后一行，或者与下一行距离较大，结束当前段落
      if (index === lines.length - 1 || 
          (index < lines.length - 1 && 
           lines[index + 1].boundingBox.y - line.boundingBox.y > 30)) {
        
        const boundingBox = this.calculateOverallBoundingBox(
          currentParagraph.flatMap(l => l.words)
        );
        const text = currentParagraph.map(l => l.text).join('\n');
        const confidence = currentParagraph.reduce((sum, l) => sum + l.confidence, 0) / currentParagraph.length;
        
        paragraphs.push({
          id: `paragraph_${paragraphs.length + 1}`,
          text,
          confidence,
          boundingBox,
          lines: [...currentParagraph]
        });
        
        currentParagraph = [];
      }
    });
    
    return paragraphs;
  }

  private calculateOverallBoundingBox(items: Array<{ boundingBox: BoundingBox }>): BoundingBox {
    if (items.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    const left = Math.min(...items.map(item => item.boundingBox.x));
    const top = Math.min(...items.map(item => item.boundingBox.y));
    const right = Math.max(...items.map(item => item.boundingBox.x + item.boundingBox.width));
    const bottom = Math.max(...items.map(item => item.boundingBox.y + item.boundingBox.height));
    
    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top
    };
  }

  private reportProgress(status: OCRProgress['status'], progress: number, message: string): void {
    if (this.progressCallback) {
      this.progressCallback({ status, progress, message });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup(): Promise<void> {
    if (this.isInitialized) {
      console.log('清理OCR引擎资源');
      this.isInitialized = false;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  // 获取支持的语言列表
  getSupportedLanguages(): string[] {
    return ['chi_sim', 'eng', 'chi_sim+eng'];
  }

  // 设置识别语言
  setLanguage(language: string): void {
    console.log(`设置OCR识别语言: ${language}`);
  }

  // 获取识别统计信息
  getRecognitionStats(): {
    totalPages: number;
    totalWords: number;
    averageConfidence: number;
    averageProcessingTime: number;
  } {
    // 模拟统计数据
    return {
      totalPages: 5,
      totalWords: 150,
      averageConfidence: 0.92,
      averageProcessingTime: 2500
    };
  }
}

// 导出单例实例
export const ocrEngine = new OCREngine();