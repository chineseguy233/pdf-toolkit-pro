import React, { useState, useCallback } from 'react';
import { FileImportService, PDFDocument } from '../../services/FileImportService';
import LoadingSpinner from './LoadingSpinner';
import Toast from './Toast';

interface FileDropZoneProps {
  onFilesImported: (documents: PDFDocument[]) => void;
  className?: string;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onFilesImported, className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      setToast({ message: '请拖拽PDF文件到此处', type: 'warning' });
      return;
    }

    if (pdfFiles.length !== files.length) {
      setToast({ message: `已过滤非PDF文件，将导入${pdfFiles.length}个PDF文件`, type: 'info' });
    }

    await importFiles(pdfFiles);
  }, []);

  const handleFileSelect = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const files = Array.from(target.files);
        await importFiles(files);
      }
    };
    
    input.click();
  }, []);

  const importFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsImporting(true);
    try {
      const documents = await FileImportService.importFiles(files);
      onFilesImported(documents);
      setToast({ 
        message: `成功导入${documents.length}个PDF文件`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('文件导入失败:', error);
      setToast({ 
        message: error instanceof Error ? error.message : '文件导入失败', 
        type: 'error' 
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-primary bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isImporting ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          ${className}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        {isImporting ? (
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600">正在导入文件...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
              isDragOver ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                {isDragOver ? '释放文件以导入' : '拖拽PDF文件到此处'}
              </p>
              <p className="text-sm text-gray-500">
                或者 <span className="text-primary font-medium">点击选择文件</span>
              </p>
            </div>
            
            <div className="text-xs text-gray-400">
              <p>支持格式：PDF</p>
              <p>最大大小：100MB</p>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default FileDropZone;