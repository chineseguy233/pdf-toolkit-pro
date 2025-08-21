import React from 'react';
import { PDFDocument } from '../../services/FileImportService';

interface FileListProps {
  documents: PDFDocument[];
  onDocumentSelect?: (document: PDFDocument) => void;
  selectedDocumentId?: string;
}

const FileList: React.FC<FileListProps> = ({ 
  documents, 
  onDocumentSelect, 
  selectedDocumentId 
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>暂无PDF文件</p>
        <p className="text-sm">拖拽或选择文件开始使用</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className={`
            flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200
            ${selectedDocumentId === doc.id 
              ? 'border-primary bg-blue-50 shadow-sm' 
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
          onClick={() => onDocumentSelect?.(doc)}
        >
          {/* 缩略图 */}
          <div className="flex-shrink-0 w-12 h-12 mr-3">
            {doc.thumbnail ? (
              <img 
                src={doc.thumbnail} 
                alt={doc.fileName}
                className="w-full h-full object-cover rounded border"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded border flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* 文件信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 truncate pr-2">
                {doc.fileName}
              </h4>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatFileSize(doc.fileSize)}
              </span>
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                {doc.pageCount} 页
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(doc.modifiedAt)}
              </p>
            </div>
          </div>

          {/* 选中指示器 */}
          {selectedDocumentId === doc.id && (
            <div className="flex-shrink-0 ml-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FileList;