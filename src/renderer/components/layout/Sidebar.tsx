import React, { useState } from 'react';
import { Button } from '../common/Button';
import { FileList } from '../common/FileList';
import { FileDropZone } from '../common/FileDropZone';
import { useFileStore } from '../../store/useFileStore';
import { PDFDocument } from '../../services/FileImportService';

const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('files');
  const { documents, selectedDocumentId, addDocuments, selectDocument } = useFileStore();

  const tabs = [
    { id: 'files', label: '文件', icon: 'folder' },
    { id: 'recent', label: '最近', icon: 'clock' },
    { id: 'bookmarks', label: '书签', icon: 'bookmark' }
  ];

  const handleFilesImported = (newDocuments: PDFDocument[]) => {
    addDocuments(newDocuments);
  };

  const handleDocumentSelect = (document: PDFDocument) => {
    selectDocument(document.id);
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const files = Array.from(target.files);
        // 这里会触发FileDropZone的导入逻辑
        const event = new CustomEvent('fileSelect', { detail: files });
        document.dispatchEvent(event);
      }
    };
    
    input.click();
  };

  const renderIcon = (iconType: string) => {
    const iconClass = "w-4 h-4";
    switch (iconType) {
      case 'folder':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      case 'clock':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'bookmark':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 标签页导航 */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {renderIcon(tab.icon)}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'files' && (
          <div className="space-y-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={handleFileSelect}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              打开文件
            </Button>
            
            {documents.length > 0 && (
              <>
                <div className="text-xs text-gray-500 mb-2">
                  已导入文件 ({documents.length})
                </div>
                <FileList
                  documents={documents}
                  selectedDocumentId={selectedDocumentId}
                  onDocumentSelect={handleDocumentSelect}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">最近打开的文件将显示在这里</div>
            {documents.slice(0, 5).map((doc) => (
              <div key={doc.id} className="p-2 rounded hover:bg-gray-100 cursor-pointer text-sm">
                <div className="font-medium truncate">{doc.fileName}</div>
                <div className="text-xs text-gray-500">
                  {new Intl.DateTimeFormat('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(doc.modifiedAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">书签功能即将推出</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
