
import React, { useState } from 'react';
import MainLayout from './components/layout/MainLayout';
import FileDropZone from './components/common/FileDropZone';
import { EnhancedPDFViewer } from './components/pdf/EnhancedPDFViewer';
import { ThumbnailPanel } from './components/pdf/ThumbnailPanel';
import { useFileStore } from './store/useFileStore';
import { PDFDocument } from './services/FileImportService';
import { PDFDocument as PDFRenderDocument } from './services/PDFRenderingService';
import './assets/index.css';

function App() {
  const { documents, addDocuments, selectedFile } = useFileStore();
  const [pdfDocument, setPdfDocument] = useState<PDFRenderDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showThumbnails, setShowThumbnails] = useState(true);

  const handleFilesImported = (newDocuments: PDFDocument[]) => {
    addDocuments(newDocuments);
  };

  const handleDocumentLoad = (document: PDFRenderDocument) => {
    setPdfDocument(document);
    setCurrentPage(1);
  };

  const handlePageSelect = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleError = (error: string) => {
    console.error('PDF Viewer Error:', error);
    // 这里可以添加错误提示组件
  };

  return (
    <MainLayout>
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        {documents.length === 0 ? (
          // 欢迎界面 - 显示拖拽区域
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF Toolkit Pro</h1>
              <p className="text-lg text-gray-600 mb-8">智能PDF编辑与整理工具</p>
            </div>

            <FileDropZone 
              onFilesImported={handleFilesImported}
              className="mb-6"
            />
            
            <div className="text-center text-sm text-gray-500">
              <p>支持批量导入 • 最大100MB • 自动生成缩略图</p>
            </div>
          </div>
        ) : (
          // 工作界面 - 显示PDF预览区域
          <div className="w-full h-full flex">
            {/* 缩略图面板 */}
            {pdfDocument && selectedFile && (
              <ThumbnailPanel
                totalPages={pdfDocument.totalPages}
                currentPage={currentPage}
                onPageSelect={handlePageSelect}
                isVisible={showThumbnails}
              />
            )}
            
            {/* PDF预览区域 */}
            <div className="flex-1">
              {selectedFile ? (
                <EnhancedPDFViewer
                  file={selectedFile}
                  onDocumentLoad={handleDocumentLoad}
                  onError={handleError}
                  enableTextEditing={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="mb-6">
                      <svg className="w-20 h-20 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">PDF预览区域</h2>
                    <p className="text-gray-500 mb-4">
                      已导入 {documents.length} 个文件，从左侧选择文件开始编辑
                    </p>
                    
                    <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-8">
                      <FileDropZone 
                        onFilesImported={handleFilesImported}
                        className="border-none bg-transparent p-4"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default App;
