import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { pdfRenderingService, PDFDocument } from '../../services/PDFRenderingService';

interface PDFViewerProps {
  file: File | null;
  onDocumentLoad?: (document: PDFDocument) => void;
  onError?: (error: string) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  onDocumentLoad,
  onError
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '渲染页面失败';
      onError?.(errorMessage);
    } finally {
      setIsRendering(false);
    }
  }, [document, currentPage, zoomLevel, onError]);

  // 页面导航
  const goToPage = useCallback((pageNumber: number) => {
    if (!document) return;
    
    const page = Math.max(1, Math.min(pageNumber, document.totalPages));
    setCurrentPage(page);
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
    if (!canvasRef.current) return;
    const container = canvasRef.current.parentElement;
    if (!container) return;
    
    // 简单的适应宽度计算
    const containerWidth = container.clientWidth - 40; // 留出边距
    const canvasWidth = canvasRef.current.width;
    if (canvasWidth > 0) {
      setZoomLevel(containerWidth / canvasWidth);
    }
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!document) return;

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [document, goToPreviousPage, goToNextPage, resetZoom, zoomIn, zoomOut]);

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
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          <div className="relative">
            {isRendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <LoadingSpinner />
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="border border-gray-300 shadow-lg bg-white"
              style={{
                maxWidth: '100%',
                height: 'auto'
              }}
            />
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      <div className="px-4 py-2 bg-white border-t border-gray-200 text-sm text-gray-600">
        {document.name} - 第 {currentPage} 页，共 {document.totalPages} 页
      </div>
    </div>
  );
};