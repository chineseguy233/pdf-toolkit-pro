// 临时PDF.js模拟实现，用于开发阶段
// 实际部署时需要替换为真实的PDF.js实现

export interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
  destroy(): void;
}

export interface PDFPageProxy {
  getViewport(options: { scale: number; rotation?: number }): PageViewport;
  render(renderContext: RenderContext): { promise: Promise<void> };
  getTextContent(): Promise<TextContent>;
}

export interface PageViewport {
  width: number;
  height: number;
}

export interface RenderContext {
  canvasContext: CanvasRenderingContext2D;
  viewport: PageViewport;
  enableWebGL?: boolean;
}

export interface TextContent {
  items: TextItem[];
}

export interface TextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
}

class MockPDFPage implements PDFPageProxy {
  constructor(private pageNumber: number, private totalPages: number) {}

  getViewport(options: { scale: number; rotation?: number }): PageViewport {
    return {
      width: 595 * options.scale, // A4 width in points
      height: 842 * options.scale  // A4 height in points
    };
  }

  render(renderContext: RenderContext): { promise: Promise<void> } {
    return {
      promise: new Promise((resolve) => {
        const { canvasContext, viewport } = renderContext;
        
        // 绘制模拟PDF页面
        canvasContext.fillStyle = '#ffffff';
        canvasContext.fillRect(0, 0, viewport.width, viewport.height);
        
        // 绘制边框
        canvasContext.strokeStyle = '#cccccc';
        canvasContext.lineWidth = 1;
        canvasContext.strokeRect(0, 0, viewport.width, viewport.height);
        
        // 绘制页面内容模拟
        canvasContext.fillStyle = '#333333';
        canvasContext.font = `${16 * (viewport.width / 595)}px Arial`;
        canvasContext.textAlign = 'center';
        
        const centerX = viewport.width / 2;
        const centerY = viewport.height / 2;
        
        canvasContext.fillText(
          `PDF 页面 ${this.pageNumber}`,
          centerX,
          centerY - 40
        );
        
        canvasContext.fillText(
          `共 ${this.totalPages} 页`,
          centerX,
          centerY
        );
        
        canvasContext.fillText(
          '这是一个PDF预览模拟',
          centerX,
          centerY + 40
        );
        
        // 模拟异步渲染
        setTimeout(resolve, 100);
      })
    };
  }

  async getTextContent(): Promise<TextContent> {
    return {
      items: [
        {
          str: `这是第 ${this.pageNumber} 页的文本内容`,
          dir: 'ltr',
          width: 200,
          height: 16,
          transform: [1, 0, 0, 1, 100, 400],
          fontName: 'Arial'
        }
      ]
    };
  }
}

class MockPDFDocument implements PDFDocumentProxy {
  constructor(public numPages: number) {}

  async getPage(pageNumber: number): Promise<PDFPageProxy> {
    if (pageNumber < 1 || pageNumber > this.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }
    return new MockPDFPage(pageNumber, this.numPages);
  }

  destroy(): void {
    // 清理资源
  }
}

export function getDocument(options: { data: ArrayBuffer }): { promise: Promise<PDFDocumentProxy> } {
  return {
    promise: new Promise((resolve) => {
      // 模拟文档加载
      setTimeout(() => {
        // 根据文件大小模拟页数
        const fileSize = options.data.byteLength;
        const estimatedPages = Math.max(1, Math.min(10, Math.floor(fileSize / 50000)));
        resolve(new MockPDFDocument(estimatedPages));
      }, 500);
    })
  };
}

// 导出兼容的API
export * from './PDFMockService';