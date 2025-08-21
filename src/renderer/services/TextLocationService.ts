import { PDFPageProxy } from './PDFMockService';

export interface TextItem {
  str: string;           // 文本内容
  dir: string;          // 文本方向
  width: number;        // 文本宽度
  height: number;       // 文本高度
  transform: number[];  // 变换矩阵 [a, b, c, d, e, f]
  fontName: string;     // 字体名称
}

export interface TextContent {
  items: TextItem[];
}

export interface TextBlock {
  id: string;
  x: number;           // PDF坐标系X
  y: number;           // PDF坐标系Y
  width: number;       // 文本块宽度
  height: number;      // 文本块高度
  text: string;        // 文本内容
  fontFamily: string;  // 字体族
  fontSize: number;    // 字体大小
  transform: number[]; // 变换矩阵
  bbox: BoundingBox;   // 边界框
}

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface PageViewport {
  width: number;
  height: number;
}

export interface LocationAccuracy {
  totalAttempts: number;
  successfulLocations: number;
  averageDistance: number;  // 平均偏差距离
  accuracyRate: number;     // 准确率百分比
}

export class CoordinateMapper {
  constructor(
    private viewport: PageViewport,
    private canvasRect: DOMRect,
    private scale: number
  ) {}
  
  pdfToCanvas(pdfX: number, pdfY: number): Point {
    // PDF坐标原点在左下角，Canvas在左上角
    const canvasX = pdfX * this.scale;
    const canvasY = (this.viewport.height - pdfY) * this.scale;
    return { x: canvasX, y: canvasY };
  }
  
  canvasToPdf(canvasX: number, canvasY: number): Point {
    const pdfX = canvasX / this.scale;
    const pdfY = this.viewport.height - (canvasY / this.scale);
    return { x: pdfX, y: pdfY };
  }
}

export class AccuracyMonitor {
  private metrics: LocationAccuracy = {
    totalAttempts: 0,
    successfulLocations: 0,
    averageDistance: 0,
    accuracyRate: 0
  };

  trackLocationAttempt(expected: Point, actual: Point): void {
    const distance = this.calculateDistance(expected, actual);
    this.updateMetrics(distance);
  }

  private calculateDistance(point1: Point, point2: Point): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private updateMetrics(distance: number): void {
    this.metrics.totalAttempts++;
    
    // 认为距离小于5像素为成功定位
    if (distance < 5) {
      this.metrics.successfulLocations++;
    }
    
    // 更新平均距离
    this.metrics.averageDistance = 
      (this.metrics.averageDistance * (this.metrics.totalAttempts - 1) + distance) / 
      this.metrics.totalAttempts;
    
    // 更新准确率
    this.metrics.accuracyRate = 
      (this.metrics.successfulLocations / this.metrics.totalAttempts) * 100;
  }

  getMetrics(): LocationAccuracy {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalAttempts: 0,
      successfulLocations: 0,
      averageDistance: 0,
      accuracyRate: 0
    };
  }
}

export class TextLocationService {
  private coordinateMapper: CoordinateMapper | null = null;
  private accuracyMonitor = new AccuracyMonitor();
  private textBlocksCache = new Map<number, TextBlock[]>();

  setCoordinateMapper(mapper: CoordinateMapper): void {
    this.coordinateMapper = mapper;
  }

  async extractTextLayer(page: PDFPageProxy): Promise<TextContent> {
    try {
      return await page.getTextContent();
    } catch (error) {
      console.error('Failed to extract text layer:', error);
      throw new Error('无法提取PDF文本层');
    }
  }

  parseTextBlocks(textContent: TextContent, pageNumber: number): TextBlock[] {
    const textBlocks: TextBlock[] = [];
    
    textContent.items.forEach((item, index) => {
      const transform = item.transform;
      const x = transform[4];
      const y = transform[5];
      const scaleX = transform[0];
      const scaleY = transform[3];
      
      const textBlock: TextBlock = {
        id: `${pageNumber}-${index}`,
        x: x,
        y: y,
        width: item.width * Math.abs(scaleX),
        height: item.height * Math.abs(scaleY),
        text: item.str,
        fontFamily: item.fontName,
        fontSize: item.height * Math.abs(scaleY),
        transform: transform,
        bbox: {
          left: x,
          top: y + item.height * Math.abs(scaleY),
          right: x + item.width * Math.abs(scaleX),
          bottom: y
        }
      };
      
      textBlocks.push(textBlock);
    });

    // 缓存解析结果
    this.textBlocksCache.set(pageNumber, textBlocks);
    
    return textBlocks;
  }

  findTextAtPoint(x: number, y: number, textBlocks: TextBlock[]): TextBlock | null {
    if (!this.coordinateMapper) {
      console.warn('CoordinateMapper not set');
      return null;
    }

    // 转换Canvas坐标到PDF坐标
    const pdfPoint = this.coordinateMapper.canvasToPdf(x, y);
    
    // 查找包含点击位置的文本块
    for (const block of textBlocks) {
      if (this.isPointInBoundingBox(pdfPoint, block.bbox)) {
        return block;
      }
    }
    
    // 如果没有精确匹配，查找最近的文本块
    return this.findNearestTextBlock(pdfPoint, textBlocks);
  }

  private isPointInBoundingBox(point: Point, bbox: BoundingBox): boolean {
    return point.x >= bbox.left && point.x <= bbox.right &&
           point.y >= bbox.bottom && point.y <= bbox.top;
  }

  private findNearestTextBlock(point: Point, textBlocks: TextBlock[]): TextBlock | null {
    if (textBlocks.length === 0) return null;

    let nearestBlock = textBlocks[0];
    let minDistance = this.calculateDistanceToBlock(point, nearestBlock);

    for (let i = 1; i < textBlocks.length; i++) {
      const distance = this.calculateDistanceToBlock(point, textBlocks[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestBlock = textBlocks[i];
      }
    }

    // 只有距离在合理范围内才返回
    return minDistance < 50 ? nearestBlock : null;
  }

  private calculateDistanceToBlock(point: Point, block: TextBlock): number {
    // 计算点到文本块边界框的最短距离
    const dx = Math.max(block.bbox.left - point.x, 0, point.x - block.bbox.right);
    const dy = Math.max(block.bbox.bottom - point.y, 0, point.y - block.bbox.top);
    return Math.sqrt(dx * dx + dy * dy);
  }

  getTextBlocksFromCache(pageNumber: number): TextBlock[] | null {
    return this.textBlocksCache.get(pageNumber) || null;
  }

  clearCache(): void {
    this.textBlocksCache.clear();
  }

  getAccuracyMetrics(): LocationAccuracy {
    return this.accuracyMonitor.getMetrics();
  }

  resetAccuracyMetrics(): void {
    this.accuracyMonitor.reset();
  }

  // 调试和诊断工具
  debugTextBlocks(textBlocks: TextBlock[]): void {
    console.group('Text Blocks Debug Info');
    console.log(`Total blocks: ${textBlocks.length}`);
    
    textBlocks.forEach((block, index) => {
      console.log(`Block ${index}:`, {
        id: block.id,
        text: block.text.substring(0, 20) + (block.text.length > 20 ? '...' : ''),
        position: `(${block.x.toFixed(2)}, ${block.y.toFixed(2)})`,
        size: `${block.width.toFixed(2)} x ${block.height.toFixed(2)}`,
        bbox: block.bbox
      });
    });
    
    console.groupEnd();
  }

  validateTextLocation(expectedPoint: Point, actualBlock: TextBlock | null): boolean {
    if (!actualBlock) return false;
    
    const blockCenter = {
      x: (actualBlock.bbox.left + actualBlock.bbox.right) / 2,
      y: (actualBlock.bbox.top + actualBlock.bbox.bottom) / 2
    };
    
    this.accuracyMonitor.trackLocationAttempt(expectedPoint, blockCenter);
    
    return this.isPointInBoundingBox(expectedPoint, actualBlock.bbox);
  }
}

export const textLocationService = new TextLocationService();