import { FileImportService } from '../../../src/renderer/services/FileImportService';

// Mock File API
class MockFile implements File {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  webkitRelativePath: string = '';

  constructor(name: string, size: number, type: string, lastModified: number = Date.now()) {
    this.name = name;
    this.size = size;
    this.type = type;
    this.lastModified = lastModified;
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    return new Blob(['%PDF-1.4'], { type: contentType });
  }

  stream(): ReadableStream<Uint8Array> {
    throw new Error('Method not implemented.');
  }

  text(): Promise<string> {
    return Promise.resolve('%PDF-1.4');
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    throw new Error('Method not implemented.');
  }
}

describe('FileImportService', () => {
  describe('validateFile', () => {
    test('应该接受有效的PDF文件', async () => {
      const file = new MockFile('test.pdf', 1024 * 1024, 'application/pdf');
      const result = await FileImportService.validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('应该拒绝非PDF文件扩展名', async () => {
      const file = new MockFile('test.txt', 1024, 'text/plain');
      const result = await FileImportService.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('仅支持PDF文件格式');
    });

    test('应该拒绝错误的MIME类型', async () => {
      const file = new MockFile('test.pdf', 1024, 'text/plain');
      const result = await FileImportService.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('文件类型不正确，请选择PDF文件');
    });

    test('应该拒绝超过100MB的文件', async () => {
      const file = new MockFile('large.pdf', 101 * 1024 * 1024, 'application/pdf');
      const result = await FileImportService.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('文件过大');
    });

    test('应该拒绝空文件', async () => {
      const file = new MockFile('empty.pdf', 0, 'application/pdf');
      const result = await FileImportService.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('文件为空，请选择有效的PDF文件');
    });
  });

  describe('importFiles', () => {
    test('应该成功导入有效的PDF文件', async () => {
      const files = [
        new MockFile('test1.pdf', 1024, 'application/pdf'),
        new MockFile('test2.pdf', 2048, 'application/pdf')
      ];
      
      const result = await FileImportService.importFiles(files);
      
      expect(result).toHaveLength(2);
      expect(result[0].fileName).toBe('test1.pdf');
      expect(result[1].fileName).toBe('test2.pdf');
      expect(result[0].fileSize).toBe(1024);
      expect(result[1].fileSize).toBe(2048);
    });

    test('应该为每个文档生成唯一ID', async () => {
      const files = [
        new MockFile('test1.pdf', 1024, 'application/pdf'),
        new MockFile('test2.pdf', 2048, 'application/pdf')
      ];
      
      const result = await FileImportService.importFiles(files);
      
      expect(result[0].id).toBeDefined();
      expect(result[1].id).toBeDefined();
      expect(result[0].id).not.toBe(result[1].id);
    });

    test('应该在文件验证失败时抛出错误', async () => {
      const files = [new MockFile('test.txt', 1024, 'text/plain')];
      
      await expect(FileImportService.importFiles(files)).rejects.toThrow('仅支持PDF文件格式');
    });
  });

  describe('generateThumbnail', () => {
    test('应该生成缩略图占位符', async () => {
      const file = new MockFile('test.pdf', 1024, 'application/pdf');
      const thumbnail = await FileImportService.generateThumbnail(file);
      
      expect(thumbnail).toMatch(/^data:image/);
    });
  });
});