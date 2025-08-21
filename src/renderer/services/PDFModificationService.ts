import { TextBlock } from './TextLocationService';

// 模拟PDF-lib的基本接口（实际项目中应该使用真实的PDF-lib）
interface PDFDocument {
  getPageCount(): number;
  getPage(index: number): PDFPage;
  save(): Promise<Uint8Array>;
  copy(): Promise<PDFDocument>;
}

interface PDFPage {
  getWidth(): number;
  getHeight(): number;
  drawRectangle(options: DrawRectangleOptions): void;
  drawText(text: string, options: DrawTextOptions): void;
}

interface DrawRectangleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  color: RGB;
}

interface DrawTextOptions {
  x: number;
  y: number;
  size: number;
  color: RGB;
  font?: string;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

// 编辑操作类型
export enum EditOperationType {
  TEXT_MODIFY = 'text-modify',
  TEXT_INSERT = 'text-insert',
  TEXT_DELETE = 'text-delete'
}

export interface EditOperation {
  id: string;
  type: EditOperationType;
  pageIndex: number;
  textBlockId: string;
  oldValue: string;
  newValue: string;
  timestamp: Date;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TextModification {
  id: string;
  textBlockId: string;
  pageIndex: number;
  originalText: string;
  modifiedText: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
  };
  timestamp: Date;
}

export interface DocumentState {
  id: string;
  fileName: string;
  originalBytes: Uint8Array | null;
  modifications: Map<string, TextModification>;
  isDirty: boolean;
  lastSaved: Date;
  autoSaveEnabled: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
}

export interface ExportOptions {
  optimizeSize?: boolean;
  removeMetadata?: boolean;
  compressImages?: boolean;
}

// 编辑历史管理器
export class EditHistoryManager {
  private history: EditOperation[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 100;

  addOperation(operation: EditOperation): void {
    // 移除当前位置之后的所有操作
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // 添加新操作
    this.history.push(operation);
    this.currentIndex++;
    
    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }

    console.log(`添加编辑操作: ${operation.type}, 历史记录数: ${this.history.length}`);
  }

  undo(): EditOperation | null {
    if (this.canUndo()) {
      const operation = this.history[this.currentIndex];
      this.currentIndex--;
      console.log(`撤销操作: ${operation.type}`);
      return operation;
    }
    return null;
  }

  redo(): EditOperation | null {
    if (this.canRedo()) {
      this.currentIndex++;
      const operation = this.history[this.currentIndex];
      console.log(`重做操作: ${operation.type}`);
      return operation;
    }
    return null;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getHistorySize(): number {
    return this.history.length;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}

// 文档状态管理器
export class DocumentStateManager {
  private documentStates = new Map<string, DocumentState>();
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private autoSaveDelay = 5000; // 5秒自动保存

  createDocumentState(documentId: string, fileName: string, originalBytes?: Uint8Array): DocumentState {
    const state: DocumentState = {
      id: documentId,
      fileName,
      originalBytes: originalBytes || null,
      modifications: new Map(),
      isDirty: false,
      lastSaved: new Date(),
      autoSaveEnabled: true
    };

    this.documentStates.set(documentId, state);
    console.log(`创建文档状态: ${documentId}`);
    return state;
  }

  getState(documentId: string): DocumentState | null {
    return this.documentStates.get(documentId) || null;
  }

  applyModification(documentId: string, modification: TextModification): void {
    const state = this.documentStates.get(documentId);
    if (!state) {
      console.error(`文档状态不存在: ${documentId}`);
      return;
    }

    state.modifications.set(modification.id, modification);
    state.isDirty = true;

    console.log(`应用修改: ${modification.id}, 文档: ${documentId}`);

    // 触发自动保存
    if (state.autoSaveEnabled) {
      this.scheduleAutoSave(documentId);
    }
  }

  private scheduleAutoSave(documentId: string): void {
    if (this.autoSaveInterval) {
      clearTimeout(this.autoSaveInterval);
    }

    this.autoSaveInterval = setTimeout(() => {
      this.autoSave(documentId);
    }, this.autoSaveDelay);
  }

  private autoSave(documentId: string): void {
    const state = this.documentStates.get(documentId);
    if (state && state.isDirty) {
      console.log(`自动保存文档: ${documentId}`);
      // 这里实现自动保存逻辑
      state.lastSaved = new Date();
    }
  }

  markClean(documentId: string): void {
    const state = this.documentStates.get(documentId);
    if (state) {
      state.isDirty = false;
      state.lastSaved = new Date();
    }
  }

  removeDocumentState(documentId: string): void {
    this.documentStates.delete(documentId);
    console.log(`移除文档状态: ${documentId}`);
  }

  getAllStates(): DocumentState[] {
    return Array.from(this.documentStates.values());
  }
}

// 字体管理器
export class FontManager {
  private fontCache = new Map<string, string>();

  getFont(fontFamily: string): string {
    const cacheKey = fontFamily;
    
    if (this.fontCache.has(cacheKey)) {
      return this.fontCache.get(cacheKey)!;
    }

    const mappedFont = this.mapToWebFont(fontFamily);
    this.fontCache.set(cacheKey, mappedFont);
    return mappedFont;
  }

  private mapToWebFont(fontFamily: string): string {
    const fontMap: Record<string, string> = {
      'Times-Roman': 'Times, "Times New Roman", serif',
      'Helvetica': 'Arial, "Helvetica Neue", sans-serif',
      'Courier': '"Courier New", Courier, monospace',
      'SimSun': 'SimSun, "宋体", serif',
      'SimHei': 'SimHei, "黑体", sans-serif',
      'Microsoft YaHei': '"Microsoft YaHei", "微软雅黑", sans-serif'
    };

    return fontMap[fontFamily] || 'Arial, sans-serif';
  }

  isStandardFont(fontFamily: string): boolean {
    const standardFonts = [
      'Times-Roman', 'Helvetica', 'Courier',
      'Times-Bold', 'Helvetica-Bold', 'Courier-Bold',
      'Times-Italic', 'Helvetica-Oblique', 'Courier-Oblique'
    ];

    return standardFonts.includes(fontFamily);
  }
}

// 兼容性验证器
export class CompatibilityValidator {
  private fontManager = new FontManager();

  async validateModifications(modifications: Map<string, TextModification>): Promise<ValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    for (const [id, modification] of modifications) {
      // 检查字体兼容性
      if (!this.fontManager.isStandardFont(modification.style.fontFamily)) {
        warnings.push(`修改 ${id}: 非标准字体 ${modification.style.fontFamily} 可能在某些阅读器中显示异常`);
      }

      // 检查文本长度
      if (modification.modifiedText.length > 1000) {
        warnings.push(`修改 ${id}: 文本过长可能影响性能`);
      }

      // 检查特殊字符
      if (this.hasSpecialCharacters(modification.modifiedText)) {
        warnings.push(`修改 ${id}: 包含特殊字符，可能存在编码问题`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  private hasSpecialCharacters(text: string): boolean {
    // 检查是否包含可能有问题的特殊字符
    const problematicChars = /[\u0000-\u001F\u007F-\u009F]/;
    return problematicChars.test(text);
  }
}

// 保存管理器
export class SaveManager {
  private documentStateManager: DocumentStateManager;
  private compatibilityValidator = new CompatibilityValidator();

  constructor(documentStateManager: DocumentStateManager) {
    this.documentStateManager = documentStateManager;
  }

  async saveToMemory(documentId: string): Promise<void> {
    const state = this.documentStateManager.getState(documentId);
    if (!state) {
      throw new Error(`文档状态不存在: ${documentId}`);
    }

    console.log(`保存到内存: ${documentId}, 修改数量: ${state.modifications.size}`);

    // 验证修改
    const validation = await this.compatibilityValidator.validateModifications(state.modifications);
    if (!validation.isValid) {
      console.warn('保存验证警告:', validation.warnings);
    }

    // 标记为已保存
    this.documentStateManager.markClean(documentId);
    
    console.log(`内存保存完成: ${documentId}`);
  }

  async saveToFile(documentId: string, filePath?: string): Promise<void> {
    const state = this.documentStateManager.getState(documentId);
    if (!state) {
      throw new Error(`文档状态不存在: ${documentId}`);
    }

    // 先保存到内存
    await this.saveToMemory(documentId);

    // 模拟文件保存
    const targetPath = filePath || state.fileName;
    console.log(`保存到文件: ${targetPath}`);

    // 在实际实现中，这里会使用PDF-lib序列化文档并写入文件
    // const pdfBytes = await modifiedDocument.save();
    // await fs.writeFile(targetPath, pdfBytes);

    console.log(`文件保存完成: ${targetPath}`);
  }

  async exportAs(documentId: string, filePath: string, options?: ExportOptions): Promise<void> {
    const state = this.documentStateManager.getState(documentId);
    if (!state) {
      throw new Error(`文档状态不存在: ${documentId}`);
    }

    console.log(`导出文档: ${documentId} -> ${filePath}`, options);

    // 应用导出选项
    if (options?.optimizeSize) {
      console.log('应用大小优化');
    }

    if (options?.removeMetadata) {
      console.log('移除元数据');
    }

    if (options?.compressImages) {
      console.log('压缩图片');
    }

    // 模拟导出过程
    console.log(`导出完成: ${filePath}`);
  }

  getModificationCount(documentId: string): number {
    const state = this.documentStateManager.getState(documentId);
    return state ? state.modifications.size : 0;
  }

  isDirty(documentId: string): boolean {
    const state = this.documentStateManager.getState(documentId);
    return state ? state.isDirty : false;
  }
}

// 主要的PDF修改服务
export class PDFModificationService {
  private documentStateManager = new DocumentStateManager();
  private editHistoryManager = new EditHistoryManager();
  private saveManager = new SaveManager(this.documentStateManager);
  private fontManager = new FontManager();

  async loadDocument(documentId: string, fileName: string, fileBytes?: Uint8Array): Promise<void> {
    console.log(`加载文档: ${documentId} (${fileName})`);
    
    this.documentStateManager.createDocumentState(documentId, fileName, fileBytes);
    this.editHistoryManager.clear();
    
    console.log(`文档加载完成: ${documentId}`);
  }

  async modifyText(
    documentId: string,
    pageIndex: number,
    textBlock: TextBlock,
    newText: string
  ): Promise<void> {
    const state = this.documentStateManager.getState(documentId);
    if (!state) {
      throw new Error(`文档未加载: ${documentId}`);
    }

    // 创建修改记录
    const modification: TextModification = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      textBlockId: textBlock.id,
      pageIndex,
      originalText: textBlock.text,
      modifiedText: newText,
      position: {
        x: textBlock.x,
        y: textBlock.y,
        width: textBlock.width,
        height: textBlock.height
      },
      style: {
        fontSize: textBlock.fontSize,
        fontFamily: textBlock.fontFamily,
        color: '#000000'
      },
      timestamp: new Date()
    };

    // 应用修改
    this.documentStateManager.applyModification(documentId, modification);

    // 添加到编辑历史
    const operation: EditOperation = {
      id: modification.id,
      type: EditOperationType.TEXT_MODIFY,
      pageIndex,
      textBlockId: textBlock.id,
      oldValue: textBlock.text,
      newValue: newText,
      timestamp: new Date(),
      position: modification.position
    };

    this.editHistoryManager.addOperation(operation);

    // 更新原始文本块
    textBlock.text = newText;

    console.log(`文本修改完成: ${textBlock.id} -> "${newText}"`);
  }

  async undo(documentId: string): Promise<boolean> {
    const operation = this.editHistoryManager.undo();
    if (!operation) {
      return false;
    }

    const state = this.documentStateManager.getState(documentId);
    if (!state) {
      return false;
    }

    // 移除对应的修改
    state.modifications.delete(operation.id);
    state.isDirty = true;

    console.log(`撤销操作: ${operation.id}`);
    return true;
  }

  async redo(documentId: string): Promise<boolean> {
    const operation = this.editHistoryManager.redo();
    if (!operation) {
      return false;
    }

    // 重新应用修改
    const modification: TextModification = {
      id: operation.id,
      textBlockId: operation.textBlockId,
      pageIndex: operation.pageIndex,
      originalText: operation.oldValue,
      modifiedText: operation.newValue,
      position: operation.position,
      style: {
        fontSize: 12,
        fontFamily: 'Arial',
        color: '#000000'
      },
      timestamp: new Date()
    };

    this.documentStateManager.applyModification(documentId, modification);

    console.log(`重做操作: ${operation.id}`);
    return true;
  }

  canUndo(): boolean {
    return this.editHistoryManager.canUndo();
  }

  canRedo(): boolean {
    return this.editHistoryManager.canRedo();
  }

  async saveToMemory(documentId: string): Promise<void> {
    return this.saveManager.saveToMemory(documentId);
  }

  async saveToFile(documentId: string, filePath?: string): Promise<void> {
    return this.saveManager.saveToFile(documentId, filePath);
  }

  async exportAs(documentId: string, filePath: string, options?: ExportOptions): Promise<void> {
    return this.saveManager.exportAs(documentId, filePath, options);
  }

  getModificationCount(documentId: string): number {
    return this.saveManager.getModificationCount(documentId);
  }

  isDirty(documentId: string): boolean {
    return this.saveManager.isDirty(documentId);
  }

  getEditHistory(): { canUndo: boolean; canRedo: boolean; historySize: number } {
    return {
      canUndo: this.editHistoryManager.canUndo(),
      canRedo: this.editHistoryManager.canRedo(),
      historySize: this.editHistoryManager.getHistorySize()
    };
  }

  unloadDocument(documentId: string): void {
    this.documentStateManager.removeDocumentState(documentId);
    this.editHistoryManager.clear();
    console.log(`卸载文档: ${documentId}`);
  }
}

// 导出单例实例
export const pdfModificationService = new PDFModificationService();