import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { TextEditingOverlay } from './TextEditingOverlay';
import { pdfRenderingService, PDFDocument } from '../../services/PDFRenderingService';
import { 
  textLocationService, 
  TextBlock, 
  CoordinateMapper, 
  Point 
} from '../../services/TextLocationService';

interface EnhancedPDFViewerProps {
  file: File | null;
  onDocumentLoad?: (document: PDFDocument) => void;
  onError?: (error: string) => void;
  enableTextEditing?: boolean;
}

export const EnhancedPDFViewer: React.FC<EnhancedPDFViewerProps> = ({
  file,
  onDocumentLoad,
  onError,
  enableTextEditing = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  
  // 文本编辑相关状态
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [selectedTextBlock, setSelectedTextBlock] = useState<TextBlock | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
  const [textModifications, setTextModifications] = useState<Map<string, string>>(new Map());

  // 加载PDF文档
  const loadDocument = useCallback(async (pdfFile: File) => {
    if (!pdfFile) return;

    setIsLoading(true);
    try {
      const pdfDoc = await pdfRenderingService.loadDocument(pdfFile);
      setDocument(pdfDoc);
      setCurrentPage(1);
      onDocumentLoad?.(pdfDoc);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载PDF失败';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onDocumentLoad, onError]);

  // 提取文本层
  const extractTextLayer = useCallback(async (pageNumber: number) => {
    if (!document) return;

    try {
      const page = await pdfRenderingService.pdfDocument?.getPage(pageNumber);
      if (!page) return;

      const textContent = await textLocationService.extractTextLayer(page);
      const blocks = textLocationService.parseTextBlocks(textContent, pageNumber);
      setTextBlocks(blocks);

      // 设置坐标映射器
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const viewport = { width: canvas.width / zoomLevel, height: canvas.height / zoomLevel };
        const rect = canvas.getBoundingClientRect();
        const mapper = new CoordinateMapper(viewport, rect, zoomLevel);
        textLocationService.setCoordinateMapper(mapper);
        setCanvasRect(rect);
      }
    } catch (error) {
      console.error('Failed to extract text layer:', error);
    }
  }, [document, zoomLevel]);

  // 渲染当前页面
  const renderCurrentPage = useCallback(async () => {
    if (!document || !canvasRef.current) return;

    setIsRendering(true);
    try {
      await pdfRenderingService.renderPage(
        currentPage,
        canvasRef.current,
        { scale: zoomLevel }
      );

      // 提取文本层
      if (enableTextEditing) {
        await extractTextLayer(currentPage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '渲染页面失败';
      onError?.(errorMessage);
    } finally {
      setIsRendering(false);
    }
  }, [document, currentPage, zoomLevel, onError, enableTextEditing, extractTextLayer]);

  // 处理Canvas点击事件
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enableTextEditing || !canvasRef.current || textBlocks.length === 0) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedBlock = textLocationService.findTextAtPoint(x, y, textBlocks);
    
    if (clickedBlock) {
      setSelectedTextBlock(clickedBlock);
      setIsEditingMode(true);
      setCanvasRect(rect);
    } else {
      setSelectedTextBlock(null);
      setIsEditingMode(false);
    }
  }, [enableTextEditing, textBlocks]);

  // 处理文本修改
  const handleTextChange = useCallback((blockId: string, newText: string) => {
    setTextModifications(prev => {
      const updated = new Map(prev);
      updated.set(blockId, newText);
      return updated;
    });

    // 更新文本块
    setTextBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, text: newText } : block
    ));
  }, []);

  // 完成编辑
  const handleEditComplete = useCallback(() => {
    setIsEditingMode(false);
    setSelectedTextBlock(null);
  }, []);

  // 取消编辑
  const handleEditCancel = useCallback(() => {
    setIsEditingMode(false);
    setSelectedTextBlock(null);
  }, []);

  // 页面导航
  const goToPage = useCallback((pageNumber: number) => {
    if (!document) return;
    
    const page = Math.max(1, Math.min(pageNumber, document.totalPages));
    setCurrentPage(page);
    setSelectedTextBlock(null);
    setIsEditingMode(false);
  }, [document]);

  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  // 缩放控制
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.25, 5.0));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.25, 0.25));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1.0);
  }, []);

  const fitToWidth = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const containerWidth = container.clientWidth - 40;
    const canvasWidth = canvas.width;
    
    if (canvasWidth > 0) {
      setZoomLevel(containerWidth / canvasWidth);
    }
  }, []);

  // 切换编辑模式
  const toggleEditingMode = useCallback(() => {
    setIsEditingMode(prev => !prev);
    if (isEditingMode) {
      setSelectedTextBlock(null);
    }
  }, [isEditingMode]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!document) return;

      // 如果正在编辑文本，不处理导航快捷键
      if (isEditingMode) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          goToPreviousPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          goToNextPage();
          break;
        case '0':
          if (event.ctrlKey) {
            event.preventDefault();
            resetZoom();
          }
          break;
        case '=':
        case '+':
          if (event.ctrlKey) {
            event.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (event.ctrlKey) {
            event.preventDefault();
            zoomOut();
          }
          break;
        case 'e':
        case 'E':
          if (event.ctrlKey && enableTextEditing) {
            event.preventDefault();
            toggleEditingMode();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [document, isEditingMode, goToPreviousPage, goToNextPage, resetZoom, zoomIn, zoomOut, enableTextEditing, toggleEditingMode]);

  // 文件变化时加载文档
  useEffect(() => {
    if (file) {
      loadDocument(file);
    }
  }, [file, loadDocument]);

  // 页面或缩放变化时重新渲染
  useEffect(() => {
    if (document) {
      renderCurrentPage();
    }
  }, [document, currentPage, zoomLevel, renderCurrentPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">正在加载PDF文档...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📄</div>
          <p>请选择一个PDF文件进行预览</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        {/* 页面导航 */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
          >
            ←
          </Button>
          <span className="text-sm text-gray-600">
            {currentPage} / {document.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage >= document.totalPages}
          >
            →
          </Button>
        </div>

        {/* 编辑模式切换 */}
        {enableTextEditing && (
          <div className="flex items-center space-x-2">
            <Button
              variant={isEditingMode ? "primary" : "outline"}
              size="sm"
              onClick={toggleEditingMode}
            >
              {isEditingMode ? '退出编辑' : '文本编辑'}
            </Button>
            {textModifications.size > 0 && (
              <span className="text-xs text-orange-500">
                已修改 {textModifications.size} 处
              </span>
            )}
          </div>
        )}

        {/* 缩放控制 */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={zoomOut}>
            -
          </Button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            +
          </Button>
          <Button variant="outline" size="sm" onClick={resetZoom}>
            重置
          </Button>
          <Button variant="outline" size="sm" onClick={fitToWidth}>
            适应宽度
          </Button>
        </div>
      </div>

      {/* PDF内容区域 */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          <div className="relative">
            {isRendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <LoadingSpinner />
              </div>
            )}
            <canvas
              ref={canvasRef}
              className={`border border-gray-300 shadow-lg bg-white ${
                enableTextEditing && isEditingMode ? 'cursor-text' : 'cursor-default'
              }`}
              style={{
                maxWidth: '100%',
                height: 'auto'
              }}
              onClick={handleCanvasClick}
            />
            
            {/* 文本编辑覆盖层 */}
            {enableTextEditing && (
              <TextEditingOverlay
                isVisible={isEditingMode && selectedTextBlock !== null}
                textBlock={selectedTextBlock}
                canvasRect={canvasRect}
                scale={zoomLevel}
                onTextChange={handleTextChange}
                onEditComplete={handleEditComplete}
                onEditCancel={handleEditCancel}
              />
            )}
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      <div className="px-4 py-2 bg-white border-t border-gray-200 text-sm text-gray-600 flex items-center justify-between">
        <div>
          {document.name} - 第 {currentPage} 页，共 {document.totalPages} 页
        </div>
        
        {enableTextEditing && (
          <div className="flex items-center space-x-4">
            {textBlocks.length > 0 && (
              <span>文本块: {textBlocks.length}</span>
            )}
            {isEditingMode && (
              <span className="text-blue-600">编辑模式 (Ctrl+E 切换)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};