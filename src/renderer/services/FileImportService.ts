export interface PDFDocument {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  createdAt: Date;
  modifiedAt: Date;
  thumbnail?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export class FileImportService {
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly SUPPORTED_MIME_TYPES = ['application/pdf'];
  private static readonly SUPPORTED_EXTENSIONS = ['.pdf'];

  static async validateFile(file: File): Promise<FileValidationResult> {
    // 检查文件扩展名
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.SUPPORTED_EXTENSIONS.some(ext => 
      fileName.endsWith(ext)
    );
    
    if (!hasValidExtension) {
      return {
        isValid: false,
        error: '仅支持PDF文件格式'
      };
    }

    // 检查MIME类型
    if (!this.SUPPORTED_MIME_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: '文件类型不正确，请选择PDF文件'
      };
    }

    // 检查文件大小
    if (file.size > this.MAX_FILE_SIZE) {
      const sizeMB = Math.round(file.size / (1024 * 1024));
      return {
        isValid: false,
        error: `文件过大（${sizeMB}MB），最大支持100MB`
      };
    }

    // 检查文件是否为空
    if (file.size === 0) {
      return {
        isValid: false,
        error: '文件为空，请选择有效的PDF文件'
      };
    }

    // 简单的PDF文件头检查
    try {
      const header = await this.readFileHeader(file);
      if (!header.startsWith('%PDF-')) {
        return {
          isValid: false,
          error: '文件可能已损坏，不是有效的PDF文件'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        error: '无法读取文件，请检查文件是否完整'
      };
    }

    return { isValid: true };
  }

  static async importFiles(files: File[]): Promise<PDFDocument[]> {
    const results: PDFDocument[] = [];
    
    for (const file of files) {
      try {
        const validation = await this.validateFile(file);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        const pdfDoc = await this.createPDFDocument(file);
        results.push(pdfDoc);
      } catch (error) {
        console.error(`导入文件 ${file.name} 失败:`, error);
        throw error;
      }
    }

    return results;
  }

  static async generateThumbnail(file: File): Promise<string> {
    // 这里应该集成PDF.js来生成缩略图
    // 暂时返回占位符
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI0Y3RkFGQyIvPgo8cGF0aCBkPSJNMTIgMTBIMjhWMzBIMTJWMTBaIiBzdHJva2U9IiM2Mzc0OEEiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMTYgMTZIMjQiIHN0cm9rZT0iIzYzNzQ4QSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0xNiAyMEgyNCIgc3Ryb2tlPSIjNjM3NDhBIiBzdHJva2Utd2lkdGg9IjIiLz4KPHA+');
      }, 100);
    });
  }

  private static async readFileHeader(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const blob = file.slice(0, 8); // 读取前8个字节
      
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      
      reader.onerror = () => {
        reject(new Error('无法读取文件'));
      };
      
      reader.readAsText(blob);
    });
  }

  private static async createPDFDocument(file: File): Promise<PDFDocument> {
    const thumbnail = await this.generateThumbnail(file);
    
    return {
      id: this.generateId(),
      filePath: file.name, // 在实际应用中应该是完整路径
      fileName: file.name,
      fileSize: file.size,
      pageCount: 1, // 暂时设为1，实际应该解析PDF获取页数
      createdAt: new Date(),
      modifiedAt: new Date(file.lastModified),
      thumbnail
    };
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}