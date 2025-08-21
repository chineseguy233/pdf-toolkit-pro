import { OCRService, ocrService } from '../../../src/renderer/services/OCRService';
import { OCREngine } from '../../../src/renderer/services/OCREngine';

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

// Mock OCR Engine
jest.mock('../../../src/renderer/services/OCREngine', () => {
  const mockEngine = {
    initialize: jest.fn().mockResolvedValue(undefined),
    recognizeText: jest.fn(),
    isReady: jest.fn().mockReturnValue(true),
    cleanup: jest.fn().mockResolvedValue(undefined),
    setLanguage: jest.fn(),
    getSupportedLanguages: jest.fn().mockReturnValue(['chi_sim', 'eng', 'chi_sim+eng']),
    getRecognitionStats: jest.fn().mockReturnValue({
      totalPages: 0,
      totalWords: 0,
      averageConfidence: 0,
      averageProcessingTime: 0
    })
  };

  return {
    OCREngine: jest.fn().mockImplementation(() => mockEngine),
    ocrEngine: mockEngine
  };
});

describe('OCRService', () => {
  let service: OCRService;
  let mockEngine: jest.Mocked<OCREngine>;

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    
    // 创建mock引擎
    mockEngine = {
      initialize: jest.fn().mockResolvedValue(undefined),
      recognizeText: jest.fn(),
      isReady: jest.fn().mockReturnValue(true),
      cleanup: jest.fn().mockResolvedValue(undefined),
      setLanguage: jest.fn(),
      getSupportedLanguages: jest.fn().mockReturnValue(['chi_sim', 'eng', 'chi_sim+eng']),
      getRecognitionStats: jest.fn().mockReturnValue({
        totalPages: 0,
        totalWords: 0,
        averageConfidence: 0,
        averageProcessingTime: 0
      })
    } as any;

    service = new OCRService(mockEngine);
  });

  afterEach(async () => {
    await service.cleanup();
  });

  describe('Service initialization', () => {
    it('should initialize OCR service successfully', async () => {
      const progressCallback = jest.fn();
      
      await service.initialize(progressCallback);
      
      expect(mockEngine.initialize).toHaveBeenCalledWith(progressCallback);
    });

    it('should handle initialization errors', async () => {
      mockEngine.initialize.mockRejectedValue(new Error('Initialization failed'));
      
      await expect(service.initialize()).rejects.toThrow('Initialization failed');
    });
  });

  describe('Single page OCR', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should recognize single page successfully', async () => {
      const mockResult = {
        text: 'Test text',
        confidence: 0.95,
        boundingBox: { x: 0, y: 0, width: 100, height: 50 },
        words: [],
        lines: [],
        paragraphs: [],
        pageNumber: 1,
        processingTime: 1000
      };

      mockEngine.recognizeText.mockResolvedValue(mockResult);

      const imageData = createMockImageData(100, 100);
      const progressCallback = jest.fn();

      const result = await service.recognizePage(imageData, 1, progressCallback);

      expect(result).toEqual(mockResult);
      expect(mockEngine.recognizeText).toHaveBeenCalledWith(imageData, 1);
    });

    it('should handle recognition errors', async () => {
      mockEngine.recognizeText.mockRejectedValue(new Error('Recognition failed'));

      const imageData = createMockImageData(100, 100);

      await expect(service.recognizePage(imageData, 1)).rejects.toThrow('Recognition failed');
    });

    it('should track task status', async () => {
      const mockResult = {
        text: 'Test text',
        confidence: 0.95,
        boundingBox: { x: 0, y: 0, width: 100, height: 50 },
        words: [],
        lines: [],
        paragraphs: [],
        pageNumber: 1,
        processingTime: 1000
      };

      mockEngine.recognizeText.mockResolvedValue(mockResult);

      const imageData = createMockImageData(100, 100);
      const resultPromise = service.recognizePage(imageData, 1);

      // 检查任务是否被跟踪
      const stats = service.getStatistics();
      expect(stats.totalTasks).toBeGreaterThan(0);

      await resultPromise;
    });
  });

  describe('Batch OCR', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should process batch OCR successfully', async () => {
      const mockResults = [
        {
          text: 'Page 1 text',
          confidence: 0.95,
          boundingBox: { x: 0, y: 0, width: 100, height: 50 },
          words: [],
          lines: [],
          paragraphs: [],
          pageNumber: 1,
          processingTime: 1000
        },
        {
          text: 'Page 2 text',
          confidence: 0.92,
          boundingBox: { x: 0, y: 0, width: 100, height: 50 },
          words: [],
          lines: [],
          paragraphs: [],
          pageNumber: 2,
          processingTime: 1200
        }
      ];

      mockEngine.recognizeText
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);

      const pages = [
        { imageData: createMockImageData(100, 100), pageNumber: 1 },
        { imageData: createMockImageData(100, 100), pageNumber: 2 }
      ];

      const progressCallback = jest.fn();

      const batchResult = await service.recognizeBatch(pages, progressCallback);

      expect(batchResult.totalPages).toBe(2);
      expect(batchResult.completedPages).toBe(2);
      expect(batchResult.failedPages).toBe(0);
      expect(batchResult.results).toHaveLength(2);
      expect(batchResult.averageConfidence).toBeCloseTo(0.935);
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should handle partial failures in batch processing', async () => {
      mockEngine.recognizeText
        .mockResolvedValueOnce({
          text: 'Page 1 text',
          confidence: 0.95,
          boundingBox: { x: 0, y: 0, width: 100, height: 50 },
          words: [],
          lines: [],
          paragraphs: [],
          pageNumber: 1,
          processingTime: 1000
        })
        .mockRejectedValueOnce(new Error('Page 2 failed'));

      const pages = [
        { imageData: createMockImageData(100, 100), pageNumber: 1 },
        { imageData: createMockImageData(100, 100), pageNumber: 2 }
      ];

      const batchResult = await service.recognizeBatch(pages);

      expect(batchResult.totalPages).toBe(2);
      expect(batchResult.completedPages).toBe(1);
      expect(batchResult.failedPages).toBe(1);
      expect(batchResult.results).toHaveLength(1);
    });
  });

  describe('Task management', () => {
    it('should track task status correctly', async () => {
      const mockResult = {
        text: 'Test text',
        confidence: 0.95,
        boundingBox: { x: 0, y: 0, width: 100, height: 50 },
        words: [],
        lines: [],
        paragraphs: [],
        pageNumber: 1,
        processingTime: 1000
      };

      mockEngine.recognizeText.mockResolvedValue(mockResult);

      const imageData = createMockImageData(100, 100);
      await service.recognizePage(imageData, 1);

      const stats = service.getStatistics();
      expect(stats.totalTasks).toBe(1);
      expect(stats.completedTasks).toBe(1);
      expect(stats.failedTasks).toBe(0);
    });

    it('should cleanup completed tasks', async () => {
      const mockResult = {
        text: 'Test text',
        confidence: 0.95,
        boundingBox: { x: 0, y: 0, width: 100, height: 50 },
        words: [],
        lines: [],
        paragraphs: [],
        pageNumber: 1,
        processingTime: 1000
      };

      mockEngine.recognizeText.mockResolvedValue(mockResult);

      const imageData = createMockImageData(100, 100);
      await service.recognizePage(imageData, 1);

      let stats = service.getStatistics();
      expect(stats.totalTasks).toBe(1);

      service.cleanupCompletedTasks();

      stats = service.getStatistics();
      expect(stats.totalTasks).toBe(0);
    });
  });

  describe('Export functionality', () => {
    beforeEach(async () => {
      await service.initialize();
      
      const mockResult = {
        text: 'Test text content',
        confidence: 0.95,
        boundingBox: { x: 0, y: 0, width: 100, height: 50 },
        words: [{ id: 'word1', text: 'Test', confidence: 0.95, boundingBox: { x: 0, y: 0, width: 50, height: 20 }, fontSize: 12 }],
        lines: [],
        paragraphs: [],
        pageNumber: 1,
        processingTime: 1000
      };

      mockEngine.recognizeText.mockResolvedValue(mockResult);

      const imageData = createMockImageData(100, 100);
      await service.recognizePage(imageData, 1);
    });

    it('should export results as JSON', () => {
      const exported = service.exportResults('json');
      
      expect(exported).toBeDefined();
      expect(() => JSON.parse(exported)).not.toThrow();
      
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
    });

    it('should export results as TXT', () => {
      const exported = service.exportResults('txt');
      
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
      expect(exported).toContain('页面 1');
      expect(exported).toContain('Test text content');
    });

    it('should export results as CSV', () => {
      const exported = service.exportResults('csv');
      
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
      expect(exported).toContain('Page,Text,Confidence,Words,ProcessingTime');
      expect(exported).toContain('1,"Test text content"');
    });
  });

  describe('Language configuration', () => {
    it('should set and get supported languages', () => {
      const languages = service.getSupportedLanguages();
      
      expect(languages).toContain('chi_sim');
      expect(languages).toContain('eng');
      expect(languages).toContain('chi_sim+eng');
      
      service.setLanguage('chi_sim');
      expect(mockEngine.setLanguage).toHaveBeenCalledWith('chi_sim');
    });
  });

  describe('Service status', () => {
    it('should check if service is ready', () => {
      expect(service.isReady()).toBe(true);
      expect(mockEngine.isReady).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup service resources', async () => {
      await service.cleanup();
      
      expect(mockEngine.cleanup).toHaveBeenCalled();
    });
  });

  describe('Singleton instance', () => {
    it('should provide a singleton instance', () => {
      expect(ocrService).toBeInstanceOf(OCRService);
    });
  });

  // Helper function to create mock image data
  function createMockImageData(width: number, height: number): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    
    // Fill with white background
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
      data[i + 3] = 255; // A
    }
    
    return new MockImageData(data, width, height);
  }
});