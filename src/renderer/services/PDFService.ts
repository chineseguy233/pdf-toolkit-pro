import * as pdfjsLib from 'pdfjs-dist';
import { TextItem, TextContent } from 'pdfjs-dist/types/src/display/api';

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFDocumentInfo {
  numPages: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pdfVersion?: string;
}

export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

export interface PDFTextContent {
  items: PDFTextItem[];
  styles: Record<string, any>;
}

export interface PDFTextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
  hasEOL: boolean;
}

export class PDFService {
  private documentCache = new Map<string, pdfjsLib.PDFDocumentProxy>();
  private pageCache = new Map<string, pdfjsLib.PDFPageProxy>();

  /**
   * 加载PDF文档
   */
  async loadDocument(fileBuffer: ArrayBuffer, documentId: string): Promise<PDFDocumentInfo> {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
      const pdfDocument = await loadingTask.promise;
      
      // 缓存文档
      this.documentCache.set(documentId, pdfDocument);
      
      // 获取文档信息
      const metadata = await pdfDocument.getMetadata();
      const info = metadata.info as any;
      
      const documentInfo: PDFDocumentInfo = {
        numPages: pdfDocument.numPages,
        title: info?.Title || undefined,
        author: info?.Author || undefined,
        subject: info?.Subject || undefined,
        keywords: info?.Keywords || undefined,
        creator: info?.Creator || undefined,
        producer: info?.Producer || undefined,
        creationDate: info?.CreationDate ? new Date(info.CreationDate) : undefined,
        modificationDate: info?.ModDate ? new Date(info.ModDate) : undefined,
        pdfVersion: info?.PDFFormatVersion || undefined
      };

      return documentInfo;
    } catch (error: any) {
      console.error('PDF文档加载失败:', error);
      throw new Error(`PDF文档加载失败: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 获取页面信息
   */
  async getPageInfo(documentId: string, pageNumber: number): Promise<PDFPageInfo> {
    const document = this.documentCache.get(documentId);
    if (!document) {
      throw new Error('文档未加载');
    }

    try {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.0 });
      
      return {
        pageNumber,
        width: viewport.width,
        height: viewport.height,
        rotation: viewport.rotation
      };
    } catch (error: any) {
      console.error('获取页面信息失败:', error);
      throw new Error(`获取页面信息失败: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 渲染页面到Canvas
   */
  async renderPage(
    documentId: string, 
    pageNumber: number, 
    canvas: HTMLCanvasElement, 
    scale: number = 1.0
  ): Promise<void> {
    const document = this.documentCache.get(documentId);
    if (!document) {
      throw new Error('文档未加载');
    }

    try {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      
      // 设置canvas尺寸
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('无法获取Canvas上下文');
      }

      // 渲染页面
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (error: any) {
      console.error('页面渲染失败:', error);
      throw new Error(`页面渲染失败: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 提取页面文本内容
   */
  async getPageTextContent(documentId: string, pageNumber: number): Promise<PDFTextContent> {
    const document = this.documentCache.get(documentId);
    if (!document) {
      throw new Error('文档未加载');
    }

    try {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      
      return {
        items: textContent.items
          .filter((item): item is TextItem => 'str' in item)
          .map((item: TextItem) => ({
            str: item.str,
            dir: item.dir,
            width: item.width,
            height: item.height,
            transform: item.transform,
            fontName: item.fontName,
            hasEOL: item.hasEOL || false
          })),
        styles: textContent.styles || {}
      };
    } catch (error: any) {
      console.error('文本内容提取失败:', error);
      throw new Error(`文本内容提取失败: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 提取所有页面的文本内容
   */
  async getAllTextContent(documentId: string): Promise<string> {
    const document = this.documentCache.get(documentId);
    if (!document) {
      throw new Error('文档未加载');
    }

    try {
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= document.numPages; pageNum++) {
        const textContent = await this.getPageTextContent(documentId, pageNum);
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
          .trim();
        
        if (pageText) {
          fullText += pageText + '\n\n';
        }
      }
      
      return fullText.trim();
    } catch (error: any) {
      console.error('提取全文内容失败:', error);
      throw new Error(`提取全文内容失败: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 获取文档大纲/书签
   */
  async getDocumentOutline(documentId: string): Promise<any[]> {
    const document = this.documentCache.get(documentId);
    if (!document) {
      throw new Error('文档未加载');
    }

    try {
      const outline = await document.getOutline();
      return outline || [];
    } catch (error) {
      console.error('获取文档大纲失败:', error);
      return [];
    }
  }

  /**
   * 清理文档缓存
   */
  destroyDocument(documentId: string): void {
    const document = this.documentCache.get(documentId);
    if (document) {
      document.destroy();
      this.documentCache.delete(documentId);
    }
    
    // 清理相关页面缓存
    for (const [key] of Array.from(this.pageCache)) {
      if (key.startsWith(documentId)) {
        this.pageCache.delete(key);
      }
    }
  }

  /**
   * 清理所有缓存
   */
  clearCache(): void {
    for (const [documentId] of Array.from(this.documentCache)) {
      this.destroyDocument(documentId);
    }
  }
}

// 导出单例实例
export const pdfService = new PDFService();