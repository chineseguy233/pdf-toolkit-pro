import { TextBlock, BoundingBox, Point } from './TextLocationService';

export enum PDFElementType {
  TEXT = 'text',
  IMAGE = 'image',
  PATH = 'path',
  FORM_FIELD = 'form',
  ANNOTATION = 'annotation'
}

export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  isItalic: boolean;
  isBold: boolean;
}

export interface EditableTextArea {
  id: string;
  type: PDFElementType;
  isEditable: boolean;
  bbox: BoundingBox;
  textContent: string;
  styleInfo: TextStyle;
  confidence: number;  // 可编辑性置信度 0-1
  category: TextCategory;
}

export enum TextCategory {
  TITLE = 'title',
  BODY = 'body',
  CAPTION = 'caption',
  WATERMARK = 'watermark',
  FORM_FIELD = 'form_field',
  ANNOTATION = 'annotation'
}

export interface Column {
  left: number;
  right: number;
  textBlocks: TextBlock[];
}

export interface LayoutInfo {
  columns: Column[];
  readingOrder: string[];
  textRegions: TextRegion[];
}

export interface TextRegion {
  id: string;
  bbox: BoundingBox;
  textBlocks: TextBlock[];
  category: TextCategory;
}

export interface PerformanceMetrics {
  averageRecognitionTime: number;
  cacheHitRate: number;
  mouseMoveEventRate: number;
  memoryUsage: number;
}

export class EditabilityRules {
  determineEditability(textBlock: TextBlock): boolean {
    // 基于文本内容和样式判断可编辑性
    
    // 检查是否为水印文字（通常透明度低或颜色很浅）
    if (this.isWatermarkText(textBlock)) return false;
    
    // 检查是否为页眉页脚（通常在页面边缘）
    if (this.isHeaderFooterText(textBlock)) return false;
    
    // 检查字体大小（太小的文字可能是注释或不重要）
    if (textBlock.fontSize < 8) return false;
    
    // 大部分正常文本都可以编辑
    return true;
  }
  
  private isWatermarkText(textBlock: TextBlock): boolean {
    // 简单判断：如果文本包含常见水印词汇
    const watermarkKeywords = ['draft', 'confidential', 'watermark', '草稿', '机密', '水印'];
    const text = textBlock.text.toLowerCase();
    return watermarkKeywords.some(keyword => text.includes(keyword));
  }
  
  private isHeaderFooterText(textBlock: TextBlock): boolean {
    // 简单判断：如果文本在页面顶部或底部10%区域
    const pageHeight = 842; // A4页面高度（点）
    const topThreshold = pageHeight * 0.9;
    const bottomThreshold = pageHeight * 0.1;
    
    return textBlock.y > topThreshold || textBlock.y < bottomThreshold;
  }
  
  categorizeText(textBlock: TextBlock): TextCategory {
    // 根据字体大小和样式分类
    if (textBlock.fontSize > 16) return TextCategory.TITLE;
    if (textBlock.fontSize >= 10) return TextCategory.BODY;
    if (textBlock.fontSize >= 8) return TextCategory.CAPTION;
    
    return TextCategory.BODY;
  }
  
  calculateConfidence(textBlock: TextBlock): number {
    let confidence = 0.5; // 基础置信度
    
    // 字体大小影响
    if (textBlock.fontSize >= 10 && textBlock.fontSize <= 14) {
      confidence += 0.3; // 正常字体大小
    }
    
    // 文本长度影响
    if (textBlock.text.length > 5) {
      confidence += 0.2; // 有意义的文本长度
    }
    
    // 位置影响（页面中央区域更可能可编辑）
    const pageHeight = 842;
    const pageWidth = 595;
    const centerY = pageHeight / 2;
    const centerX = pageWidth / 2;
    
    const distanceFromCenter = Math.sqrt(
      Math.pow(textBlock.x - centerX, 2) + Math.pow(textBlock.y - centerY, 2)
    );
    
    if (distanceFromCenter < 200) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, Math.max(0.0, confidence));
  }
}

export class LayoutAnalyzer {
  analyzeTextLayout(textBlocks: TextBlock[]): LayoutInfo {
    const columns = this.detectColumns(textBlocks);
    const readingOrder = this.determineReadingOrder(textBlocks);
    const textRegions = this.groupTextRegions(textBlocks);
    
    return {
      columns,
      readingOrder,
      textRegions
    };
  }
  
  private detectColumns(textBlocks: TextBlock[]): Column[] {
    if (textBlocks.length === 0) return [];
    
    // 基于X坐标聚类检测列
    const xPositions = textBlocks.map(block => block.x);
    const clusters = this.clusterPositions(xPositions, 50); // 50点的容差
    
    return clusters.map((cluster, index) => ({
      left: Math.min(...cluster),
      right: Math.max(...cluster) + 100, // 估算列宽
      textBlocks: textBlocks.filter(block => 
        cluster.some(x => Math.abs(block.x - x) < 50)
      )
    }));
  }
  
  private clusterPositions(positions: number[], tolerance: number): number[][] {
    const sorted = [...positions].sort((a, b) => a - b);
    const clusters: number[][] = [];
    let currentCluster: number[] = [];
    
    for (const pos of sorted) {
      if (currentCluster.length === 0 || 
          pos - currentCluster[currentCluster.length - 1] <= tolerance) {
        currentCluster.push(pos);
      } else {
        clusters.push(currentCluster);
        currentCluster = [pos];
      }
    }
    
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }
    
    return clusters;
  }
  
  private determineReadingOrder(textBlocks: TextBlock[]): string[] {
    // 简单的从上到下，从左到右的阅读顺序
    const sorted = [...textBlocks].sort((a, b) => {
      // 首先按Y坐标排序（从上到下）
      const yDiff = b.y - a.y; // PDF坐标系Y轴向上
      if (Math.abs(yDiff) > 10) return yDiff > 0 ? 1 : -1;
      
      // Y坐标相近时按X坐标排序（从左到右）
      return a.x - b.x;
    });
    
    return sorted.map(block => block.id);
  }
  
  private groupTextRegions(textBlocks: TextBlock[]): TextRegion[] {
    const regions: TextRegion[] = [];
    const rules = new EditabilityRules();
    
    // 按类别分组
    const categories = Object.values(TextCategory);
    
    categories.forEach(category => {
      const categoryBlocks = textBlocks.filter(block => 
        rules.categorizeText(block) === category
      );
      
      if (categoryBlocks.length > 0) {
        const bbox = this.calculateRegionBoundingBox(categoryBlocks);
        regions.push({
          id: `region-${category}-${Date.now()}`,
          bbox,
          textBlocks: categoryBlocks,
          category
        });
      }
    });
    
    return regions;
  }
  
  private calculateRegionBoundingBox(textBlocks: TextBlock[]): BoundingBox {
    if (textBlocks.length === 0) {
      return { left: 0, top: 0, right: 0, bottom: 0 };
    }
    
    const left = Math.min(...textBlocks.map(b => b.bbox.left));
    const right = Math.max(...textBlocks.map(b => b.bbox.right));
    const top = Math.max(...textBlocks.map(b => b.bbox.top));
    const bottom = Math.min(...textBlocks.map(b => b.bbox.bottom));
    
    return { left, top, right, bottom };
  }
}

export class TextAreaClassifier {
  private editabilityRules = new EditabilityRules();
  private layoutAnalyzer = new LayoutAnalyzer();
  private performanceMetrics: PerformanceMetrics = {
    averageRecognitionTime: 0,
    cacheHitRate: 0,
    mouseMoveEventRate: 0,
    memoryUsage: 0
  };
  
  classifyTextBlocks(textBlocks: TextBlock[]): EditableTextArea[] {
    const startTime = performance.now();
    
    const editableAreas = textBlocks.map(block => this.classifyTextBlock(block));
    
    // 更新性能指标
    const endTime = performance.now();
    this.updatePerformanceMetrics(endTime - startTime);
    
    return editableAreas;
  }
  
  private classifyTextBlock(textBlock: TextBlock): EditableTextArea {
    const isEditable = this.editabilityRules.determineEditability(textBlock);
    const category = this.editabilityRules.categorizeText(textBlock);
    const confidence = this.editabilityRules.calculateConfidence(textBlock);
    
    return {
      id: textBlock.id,
      type: PDFElementType.TEXT,
      isEditable,
      bbox: textBlock.bbox,
      textContent: textBlock.text,
      styleInfo: {
        fontSize: textBlock.fontSize,
        fontFamily: textBlock.fontFamily,
        fontWeight: 'normal',
        color: '#000000',
        isItalic: false,
        isBold: false
      },
      confidence,
      category
    };
  }
  
  findEditableAreaAtPoint(x: number, y: number, areas: EditableTextArea[]): EditableTextArea | null {
    // 查找包含指定点的可编辑区域
    for (const area of areas) {
      if (area.isEditable && this.isPointInBoundingBox({ x, y }, area.bbox)) {
        return area;
      }
    }
    
    return null;
  }
  
  private isPointInBoundingBox(point: Point, bbox: BoundingBox): boolean {
    return point.x >= bbox.left && point.x <= bbox.right &&
           point.y >= bbox.bottom && point.y <= bbox.top;
  }
  
  private updatePerformanceMetrics(recognitionTime: number): void {
    // 简单的移动平均
    this.performanceMetrics.averageRecognitionTime = 
      (this.performanceMetrics.averageRecognitionTime * 0.9) + (recognitionTime * 0.1);
  }
  
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }
  
  analyzeLayout(textBlocks: TextBlock[]): LayoutInfo {
    return this.layoutAnalyzer.analyzeTextLayout(textBlocks);
  }
}

export const editableAreaRecognitionService = new TextAreaClassifier();