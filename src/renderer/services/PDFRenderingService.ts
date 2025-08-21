import { PDFDocumentProxy, PDFPageProxy, getDocument } from './PDFMockService';

export interface PDFDocument {
  id: string;
  name: string;
  path: string;
  totalPages: number;
  currentPage: number;
  zoomLevel: number;
}

export interface RenderOptions {
  scale: number;
  rotation?: number;
  enableWebGL?: boolean;
}

export class PDFRenderingService {
  public pdfDocument: PDFDocumentProxy | null = null;
  private pageCache = new Map<number, HTMLCanvasElement>();
  private thumbnailCache = new Map<number, string>();

  constructor() {
    // 配置PDF.js Worker
    this.setupWorker();
  }

  private setupWorker(): void {
    // PDF.js Worker配置将在实际使用时设置
    // pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
  }

  async loadDocument(file: File): Promise<PDFDocument> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      this.pdfDocument = await getDocument({ data: arrayBuffer }).promise;
      
      return {
        id: crypto.randomUUID(),
        name: file.name,
        path: file.name,
        totalPages: this.pdfDocument.numPages,
        currentPage: 1,
        zoomLevel: 1.0
      };
    } catch (error) {
      console.error('Failed to load PDF document:', error);
      throw new Error('无法加载PDF文档');
    }
  }

  async renderPage(
    pageNumber: number, 
    canvas: HTMLCanvasElement, 
    options: RenderOptions = { scale: 1.0 }
  ): Promise<void> {
    if (!this.pdfDocument) {
      throw new Error('No PDF document loaded');
    }

    try {
      const page = await this.pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ 
        scale: options.scale,
        rotation: options.rotation || 0
      });

      // 设置Canvas尺寸
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Cannot get canvas context');
      }

      // 渲染页面
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        enableWebGL: options.enableWebGL || false
      };

      await page.render(renderContext).promise;

      // 缓存渲染结果
      this.pageCache.set(pageNumber, canvas.cloneNode(true) as HTMLCanvasElement);
    } catch (error) {
      console.error(`Failed to render page ${pageNumber}:`, error);
      throw new Error(`无法渲染第${pageNumber}页`);
    }
  }

  async generateThumbnail(pageNumber: number): Promise<string> {
    if (!this.pdfDocument) {
      throw new Error('No PDF document loaded');
    }

    // 检查缓存
    const cached = this.thumbnailCache.get(pageNumber);
    if (cached) {
      return cached;
    }

    try {
      const page = await this.pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 0.2 });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Cannot get canvas context');
      }

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      this.thumbnailCache.set(pageNumber, dataUrl);
      
      return dataUrl;
    } catch (error) {
      console.error(`Failed to generate thumbnail for page ${pageNumber}:`, error);
      throw new Error(`无法生成第${pageNumber}页缩略图`);
    }
  }

  async getTextContent(pageNumber: number): Promise<any> {
    if (!this.pdfDocument) {
      throw new Error('No PDF document loaded');
    }

    try {
      const page = await this.pdfDocument.getPage(pageNumber);
      return await page.getTextContent();
    } catch (error) {
      console.error(`Failed to get text content for page ${pageNumber}:`, error);
      return null;
    }
  }

  getPageFromCache(pageNumber: number): HTMLCanvasElement | null {
    return this.pageCache.get(pageNumber) || null;
  }

  clearCache(): void {
    this.pageCache.clear();
    this.thumbnailCache.clear();
  }

  destroy(): void {
    this.clearCache();
    if (this.pdfDocument) {
      this.pdfDocument.destroy();
      this.pdfDocument = null;
    }
  }
}

export const pdfRenderingService = new PDFRenderingService();