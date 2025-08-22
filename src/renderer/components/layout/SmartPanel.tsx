import React, { useState } from 'react';
import Button from '../common/Button';
import OCRPanel from '../ocr/OCRPanel';
import { OCRResultViewer } from '../ocr/OCRResultViewer';
import LoadingSpinner from '../common/LoadingSpinner';
import BatchProcessingPanel from '../batch/BatchProcessingPanel';
import { SmartOrganizePanel } from '../smart/SmartOrganizePanel';

interface SmartPanelProps {
  className?: string;
}

export const SmartPanel: React.FC<SmartPanelProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'organize' | 'batch' | 'ocr' | 'properties' | 'history'>('organize');
  const [ocrResults, setOcrResults] = useState<any[]>([]);

  const handleOCRComplete = (results: any[]) => {
    setOcrResults(results);
    console.log('OCR识别完成，结果数量:', results.length);
  };

  const tabs = [
    { id: 'organize', label: '智能整理', icon: 'folder' },
    { id: 'batch', label: '批量处理', icon: 'sparkles' },
    { id: 'ocr', label: 'OCR识别', icon: 'scan' },
    { id: 'properties', label: '属性', icon: 'info' },
    { id: 'history', label: '历史', icon: 'clock' }
  ];

  const renderIcon = (iconType: string) => {
    const iconClass = "w-4 h-4";
    switch (iconType) {
      case 'sparkles':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case 'scan':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        );
      case 'info':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'folder':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      case 'clock':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderOrganizeTab = () => (
    <div className="h-full">
      <SmartOrganizePanel selectedFiles={[]} />
    </div>
  );

  const renderBatchTab = () => (
    <div className="h-full">
      <BatchProcessingPanel files={[]} />
    </div>
  );

  const renderOCRTab = () => (
    <div className="space-y-4">
      <OCRPanel file={null as any} />
      {ocrResults.length > 0 && (
        <OCRResultViewer 
          results={ocrResults}
          onWordSelect={(word: any) => {
            console.log('选中单词:', word);
          }}
          onTextEdit={(pageNumber: any, newText: any) => {
            console.log('编辑文本:', pageNumber, newText);
          }}
        />
      )}
    </div>
  );

  const renderPropertiesTab = () => (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">文件信息</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">文件名:</span>
            <span>未选择文件</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">大小:</span>
            <span>-</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">页数:</span>
            <span>-</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">创建时间:</span>
            <span>-</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">操作历史将显示在这里</div>
    </div>
  );

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* 标签页导航 */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 px-2 text-xs font-medium transition-colors ${
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
        {activeTab === 'organize' && renderOrganizeTab()}
        {activeTab === 'batch' && renderBatchTab()}
        {activeTab === 'ocr' && renderOCRTab()}
        {activeTab === 'properties' && renderPropertiesTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </div>
    </div>
  );
};

export default SmartPanel;