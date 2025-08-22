import React, { useState } from 'react';
import { OCRResult, OCRWord, OCRLine, OCRParagraph } from '../../services/OCREngine';
import Button from '../common/Button';

interface OCRResultViewerProps {
  results: OCRResult[];
  onWordSelect?: (word: OCRWord) => void;
  onTextEdit?: (pageNumber: number, newText: string) => void;
  className?: string;
}

type ViewMode = 'text' | 'words' | 'lines' | 'paragraphs' | 'structured';

export const OCRResultViewer: React.FC<OCRResultViewerProps> = ({
  results,
  onWordSelect,
  onTextEdit,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('text');
  const [selectedPage, setSelectedPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  if (results.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500">暂无OCR识别结果</p>
      </div>
    );
  }

  const currentResult = results[selectedPage];

  const handleStartEdit = (pageNumber: number, text: string) => {
    setEditingPage(pageNumber);
    setEditText(text);
  };

  const handleSaveEdit = () => {
    if (editingPage !== null && onTextEdit) {
      onTextEdit(editingPage, editText);
    }
    setEditingPage(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingPage(null);
    setEditText('');
  };

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const renderTextView = () => {
    const isEditing = editingPage === currentResult.pageNumber;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">
            页面 {currentResult.pageNumber} - 文本内容
          </h4>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartEdit(currentResult.pageNumber, currentResult.text)}
              >
                编辑
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                >
                  保存
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  取消
                </Button>
              </>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="编辑识别的文本..."
          />
        ) : (
          <div 
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-40 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ 
              __html: highlightSearchTerm(currentResult.text || '未识别到文字') 
            }}
          />
        )}
        
        <div className="flex gap-4 text-sm text-gray-500">
          <span>置信度: {(currentResult.confidence * 100).toFixed(1)}%</span>
          <span>单词数: {currentResult.words.length}</span>
          <span>处理时间: {currentResult.processingTime.toFixed(0)}ms</span>
        </div>
      </div>
    );
  };

  const renderWordsView = () => {
    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">
          页面 {currentResult.pageNumber} - 单词级别 ({currentResult.words.length} 个单词)
        </h4>
        
        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
          {currentResult.words.map((word, index) => (
            <div
              key={word.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                searchTerm && word.text.toLowerCase().includes(searchTerm.toLowerCase())
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => onWordSelect?.(word)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{word.text}</span>
                <span className="text-sm text-gray-500">
                  {(word.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                位置: ({word.boundingBox.x}, {word.boundingBox.y}) 
                大小: {word.boundingBox.width}×{word.boundingBox.height}
                {word.fontFamily && ` 字体: ${word.fontFamily}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLinesView = () => {
    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">
          页面 {currentResult.pageNumber} - 行级别 ({currentResult.lines.length} 行)
        </h4>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {currentResult.lines.map((line, index) => (
            <div
              key={line.id}
              className={`p-3 border rounded-lg ${
                searchTerm && line.text.toLowerCase().includes(searchTerm.toLowerCase())
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">行 {index + 1}</span>
                <span className="text-sm text-gray-500">
                  {(line.confidence * 100).toFixed(1)}% ({line.words.length} 词)
                </span>
              </div>
              <div 
                className="text-gray-900"
                dangerouslySetInnerHTML={{ 
                  __html: highlightSearchTerm(line.text) 
                }}
              />
              <div className="text-xs text-gray-400 mt-1">
                位置: ({line.boundingBox.x}, {line.boundingBox.y}) 
                大小: {line.boundingBox.width}×{line.boundingBox.height}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderParagraphsView = () => {
    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">
          页面 {currentResult.pageNumber} - 段落级别 ({currentResult.paragraphs.length} 段)
        </h4>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {currentResult.paragraphs.map((paragraph, index) => (
            <div
              key={paragraph.id}
              className={`p-4 border rounded-lg ${
                searchTerm && paragraph.text.toLowerCase().includes(searchTerm.toLowerCase())
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">段落 {index + 1}</span>
                <span className="text-sm text-gray-500">
                  {(paragraph.confidence * 100).toFixed(1)}% ({paragraph.lines.length} 行)
                </span>
              </div>
              <div 
                className="text-gray-900 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                  __html: highlightSearchTerm(paragraph.text) 
                }}
              />
              <div className="text-xs text-gray-400 mt-2">
                位置: ({paragraph.boundingBox.x}, {paragraph.boundingBox.y}) 
                大小: {paragraph.boundingBox.width}×{paragraph.boundingBox.height}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStructuredView = () => {
    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">
          页面 {currentResult.pageNumber} - 结构化数据
        </h4>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(currentResult, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'words':
        return renderWordsView();
      case 'lines':
        return renderLinesView();
      case 'paragraphs':
        return renderParagraphsView();
      case 'structured':
        return renderStructuredView();
      case 'text':
      default:
        return renderTextView();
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* 头部控制栏 */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">OCR识别结果</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="搜索文本..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* 页面选择器 */}
        {results.length > 1 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">页面:</span>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              {results.map((result, index) => (
                <option key={index} value={index}>
                  第 {result.pageNumber} 页
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* 视图模式选择器 */}
        <div className="flex gap-1">
          {[
            { key: 'text', label: '文本' },
            { key: 'words', label: '单词' },
            { key: 'lines', label: '行' },
            { key: 'paragraphs', label: '段落' },
            { key: 'structured', label: '结构' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key as ViewMode)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                viewMode === key
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="p-4">
        {renderContent()}
      </div>
    </div>
  );
};