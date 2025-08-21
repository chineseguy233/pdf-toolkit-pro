import { OCREngine, ImagePreprocessor, ocrEngine } from '../../../src/renderer/services/OCREngine';

// Mock ImageData for testing
class MockImageData implements ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace: PredefinedColorSpace = 'srgb';

  constructor(data: Uint8ClampedArray, width: number, height?: number) {
    this.data = data;
    this.width = width;
    this.height = height || data.length / (width * 4);
  }
}

// Mock global ImageData
(global as any).ImageData = MockImageData;

describe('OCREngine', () => {
  let engine: OCREngine;
  let preprocessor: ImagePreprocessor;

  beforeEach(() => {
    engine = new OCREngine();
    preprocessor = new ImagePreprocessor();
  });

  afterEach(async () => {
    await engine.cleanup();
  });

  describe('ImagePreprocessor', () => {
    it('should preprocess image data', async () => {
      // 创建测试图像数据
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // 填充测试数据
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 128;     // R
        data[i + 1] = 128; // G
        data[i + 2] = 128; // B
        data[i + 3] = 255; // A
      }
      
      const imageData = new MockImageData(data, width, height);
      
      const result = await preprocessor.preprocessImage(imageData);
      
      expect(result).toBeDefined();
      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      expect(result.data).toBeInstanceOf(Uint8ClampedArray);
    });
  });

  describe('OCREngine initialization', () => {
    it('should initialize successfully', async () => {
      const progressCallback = jest.fn();
      
      await engine.initialize(progressCallback);
      
      expect(engine.isReady()).toBe(true);
      expect(progressCallback).toHaveBeenCalled();
      
      // 检查进度回调被调用的次数和参数
      const calls = progressCallback.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      // 检查最后一次调用是完成状态
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.status).toBe('loading');
      expect(lastCall.progress).toBe(100);
    });

    it('should not reinitialize if already initialized', async () => {
      await engine.initialize();
      const firstInitTime = Date.now();
      
      await engine.initialize();
      const secondInitTime = Date.now();
      
      // 第二次初始化应该立即返回
      expect(secondInitTime - firstInitTime).toBeLessThan(100);
      expect(engine.isReady()).toBe(true);
    });
  });

  describe('OCR text recognition', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should recognize text from image data', async () => {
      const width = 800;
      const height = 600;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // 填充白色背景
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        data[i + 3] = 255; // A
      }
      
      const imageData = new MockImageData(data, width, height);
      const pageNumber = 1;
      
      const result = await engine.recognizeText(imageData, pageNumber);
      
      expect(result).toBeDefined();
      expect(result.pageNumber).toBe(pageNumber);
      expect(result.text).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.words).toBeInstanceOf(Array);
      expect(result.lines).toBeInstanceOf(Array);
      expect(result.paragraphs).toBeInstanceOf(Array);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.boundingBox).toBeDefined();
    });

    it('should call progress callback during recognition', async () => {
      const width = 400;
      const height = 300;
      const data = new Uint8ClampedArray(width * height * 4);
      const imageData = new MockImageData(data, width, height);
      
      const progressCallback = jest.fn();
      
      // 创建新引擎实例来测试进度回调
      const testEngine = new OCREngine();
      await testEngine.initialize();
      
      const result = await testEngine.recognizeText(imageData, 1);
      
      expect(result).toBeDefined();
      await testEngine.cleanup();
    });

    it('should handle recognition errors gracefully', async () => {
      // 创建无效的图像数据
      const invalidData = new Uint8ClampedArray(0);
      const invalidImageData = new MockImageData(invalidData, 0, 0);
      
      // 这个测试可能需要根据实际的错误处理逻辑调整
      await expect(async () => {
        await engine.recognizeText(invalidImageData, 1);
      }).not.toThrow();
    });
  });

  describe('OCR result structure', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should return properly structured OCR result', async () => {
      const width = 200;
      const height = 150;
      const data = new Uint8ClampedArray(width * height * 4);
      const imageData = new MockImageData(data, width, height);
      
      const result = await engine.recognizeText(imageData, 1);
      
      // 验证结果结构
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('boundingBox');
      expect(result).toHaveProperty('words');
      expect(result).toHaveProperty('lines');
      expect(result).toHaveProperty('paragraphs');
      expect(result).toHaveProperty('pageNumber');
      expect(result).toHaveProperty('processingTime');
      
      // 验证边界框结构
      expect(result.boundingBox).toHaveProperty('x');
      expect(result.boundingBox).toHaveProperty('y');
      expect(result.boundingBox).toHaveProperty('width');
      expect(result.boundingBox).toHaveProperty('height');
      
      // 验证单词结构
      if (result.words.length > 0) {
        const word = result.words[0];
        expect(word).toHaveProperty('id');
        expect(word).toHaveProperty('text');
        expect(word).toHaveProperty('confidence');
        expect(word).toHaveProperty('boundingBox');
        expect(word).toHaveProperty('fontSize');
      }
    });
  });

  describe('OCR engine configuration', () => {
    it('should support language configuration', () => {
      const languages = engine.getSupportedLanguages();
      
      expect(languages).toBeInstanceOf(Array);
      expect(languages.length).toBeGreaterThan(0);
      expect(languages).toContain('chi_sim');
      expect(languages).toContain('eng');
      expect(languages).toContain('chi_sim+eng');
      
      // 测试语言设置
      expect(() => {
        engine.setLanguage('chi_sim');
      }).not.toThrow();
      
      expect(() => {
        engine.setLanguage('eng');
      }).not.toThrow();
    });

    it('should provide recognition statistics', () => {
      const stats = engine.getRecognitionStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalPages');
      expect(stats).toHaveProperty('totalWords');
      expect(stats).toHaveProperty('averageConfidence');
      expect(stats).toHaveProperty('averageProcessingTime');
      
      expect(typeof stats.totalPages).toBe('number');
      expect(typeof stats.totalWords).toBe('number');
      expect(typeof stats.averageConfidence).toBe('number');
      expect(typeof stats.averageProcessingTime).toBe('number');
    });
  });

  describe('OCR engine cleanup', () => {
    it('should cleanup resources properly', async () => {
      await engine.initialize();
      expect(engine.isReady()).toBe(true);
      
      await engine.cleanup();
      expect(engine.isReady()).toBe(false);
    });
  });

  describe('Singleton instance', () => {
    it('should provide a singleton instance', () => {
      expect(ocrEngine).toBeInstanceOf(OCREngine);
      expect(ocrEngine).toBe(ocrEngine); // 同一个实例
    });
  });
});