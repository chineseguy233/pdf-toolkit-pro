import React, { useState, useEffect } from 'react';
import { ocrService, OCRTask, OCRBatchResult } from '../../services/OCRService';
import { OCRProgress } from '../../services/OCREngine';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface OCRPanelProps {
  onOCRComplete?: (results: any[]) => void;
  className?: string;
}

interface OCRStatus {
  isInitialized: boolean;
  isProcessing: boolean;
  currentTask?: string;
  progress: OCRProgress | null;
  batchProgress?: {
    totalPages: number;
    completedPages: number;
    currentPage: number;
    overallProgress: number;
  };
}

export const OCRPanel: React.FC<OCRPanelProps> = ({
  onOCRComplete,
  className = ''
}) => {
  const [status, setStatus] = useState<OCRStatus>({
    isInitialized: false,
    isProcessing: false,
    progress: null
  });
  
  const [selectedLanguage, setSelectedLanguage] = useState('chi_sim+eng');
  const [results, setResults] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    initializeOCR();
    return () => {
      ocrService.cleanup();
    };
  }, []);

  const initializeOCR = async () => {
    try {
      setStatus(prev => ({ ...prev, isProcessing: true }));
      
      await ocrService.initialize((progress) => {
        setStatus(prev => ({ ...prev, progress }));
      });
      
      setStatus(prev => ({ 
        ...prev, 
        isInitialized: true, 
        isProcessing: false,
        progress: null
      }));
      
      console.log('OCR面板初始化完成');
    } catch (error) {
      console.error('OCR初始化失败:', error);
      setStatus(prev => ({ 
        ...prev, 
        isProcessing: false,
        progress: {
          status: 'error',
          progress: 0,
          message: '初始化失败'
        }
      }));
    }
  };

  const handleSinglePageOCR = async () => {
    if (!status.isInitialized) {
      await initializeOCR();
    }

    try {
      setStatus(prev => ({ ...prev, isProcessing: true, currentTask: 'single' }));
      
      // 创建模拟图像数据
      const mockImageData = createMockImageData();
      
      const result = await ocrService.recognizePage(
        mockImageData,
        1,
        (progress) => {
          setStatus(prev => ({ ...prev, progress }));
        }
      );
      
      setResults([result]);
      setStatus(prev => ({ 
        ...prev, 
        isProcessing: false, 
        currentTask: undefined,
        progress: null
      }));
      
      updateStatistics();
      setShowResults(true);
      
      if (onOCRComplete) {
        onOCRComplete([result]);
      }
      
    } catch (error) {
      console.error('单页OCR失败:', error);
      setStatus(prev => ({ 
        ...prev, 
        isProcessing: false,
        currentTask: undefined,
        progress: {
          status: 'error',
          progress: 0,
          message: '识别失败'
        }
      }));
    }
  };

  const handleBatchOCR = async () => {
    if (!status.isInitialized) {
      await initializeOCR();
    }

    try {
      setStatus(prev => ({ ...prev, isProcessing: true, currentTask: 'batch' }));
      
      // 创建模拟的多页数据
      const mockPages = Array.from({ length: 3 }, (_, i) => ({
        imageData: createMockImageData(),
        pageNumber: i + 1
      }));
      
      const batchResult = await ocrService.recognizeBatch(
        mockPages,
        (batchProgress) => {
          setStatus(prev => ({ 
            ...prev, 
            batchProgress,
            progress: batchProgress.currentPageProgress
          }));
        }
      );
      
      setResults(batchResult.results);
      setStatus(prev => ({ 
        ...prev, 
        isProcessing: false, 
        currentTask: undefined,
        progress: null,
        batchProgress: undefined
      }));
      
      updateStatistics();
      setShowResults(true);
      
      if (onOCRComplete) {
        onOCRComplete(batchResult.results);
      }
      
    } catch (error) {
      console.error('批量OCR失败:', error);
      setStatus(prev => ({ 
        ...prev, 
        isProcessing: false,
        currentTask: undefined,
        progress: {
          status: 'error',
          progress: 0,
          message: '批量识别失败'
        },
        batchProgress: undefined
      }));
    }
  };

  const updateStatistics = () => {
    const stats = ocrService.getStatistics();
    setStatistics(stats);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    ocrService.setLanguage(language);
  };

  const handleExportResults = (format: 'json' | 'txt' | 'csv') => {
    const exportData = ocrService.exportResults(format);
    
    // 创建下载链接
    const blob = new Blob([exportData], { 
      type: format === 'json' ? 'application/json' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-results.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const createMockImageData = (): ImageData => {
    // 创建模拟的图像数据用于测试
    const width = 800;
    const height = 600;
    const data = new Uint8ClampedArray(width * height * 4);
    
    // 填充白色背景
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
      data[i + 3] = 255; // A
    }
    
    return new ImageData(data, width, height);
  };

  const renderProgress = () => {
    if (!status.progress) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm font-medium text-blue-800">
            {status.progress.message}
          </span>
        </div>
        <ProgressBar 
          progress={status.progress.progress} 
          className="mb-2"
        />
        {status.batchProgress && (
          <div className="text-xs text-blue-600">
            批量进度: {status.batchProgress.completedPages}/{status.batchProgress.totalPages} 页
            (当前: 第{status.batchProgress.currentPage}页)
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!showResults || results.length === 0) return null;

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">识别结果</h4>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportResults('txt')}
            >
              导出TXT
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportResults('json')}
            >
              导出JSON
            </Button>
          </div>
        </div>
        
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  页面 {result.pageNumber}
                </span>
                <span className="text-xs text-gray-500">
                  置信度: {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                {result.text || '未识别到文字'}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>单词数: {result.words.length}</span>
                <span>处理时间: {result.processingTime.toFixed(0)}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-800 mb-2">统计信息</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-green-600">总任务数:</span>
            <span className="ml-2 font-medium">{statistics.totalTasks}</span>
          </div>
          <div>
            <span className="text-green-600">成功任务:</span>
            <span className="ml-2 font-medium">{statistics.completedTasks}</span>
          </div>
          <div>
            <span className="text-green-600">平均置信度:</span>
            <span className="ml-2 font-medium">
              {(statistics.averageConfidence * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-green-600">平均耗时:</span>
            <span className="ml-2 font-medium">
              {statistics.averageProcessingTime.toFixed(0)}ms
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">OCR文字识别</h3>
        <div className="flex items-center gap-2">
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
            disabled={status.isProcessing}
          >
            <option value="chi_sim">简体中文</option>
            <option value="eng">英文</option>
            <option value="chi_sim+eng">中英文混合</option>
          </select>
          <div className={`w-2 h-2 rounded-full ${
            status.isInitialized ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
      </div>

      {renderProgress()}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          onClick={handleSinglePageOCR}
          disabled={status.isProcessing}
          className="w-full"
        >
          {status.isProcessing && status.currentTask === 'single' ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              识别中...
            </>
          ) : (
            '单页识别'
          )}
        </Button>
        
        <Button
          onClick={handleBatchOCR}
          disabled={status.isProcessing}
          variant="outline"
          className="w-full"
        >
          {status.isProcessing && status.currentTask === 'batch' ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              批量识别中...
            </>
          ) : (
            '批量识别'
          )}
        </Button>
      </div>

      {renderResults()}
      
      {statistics && (
        <div className="mt-4">
          {renderStatistics()}
        </div>
      )}

      {!status.isInitialized && !status.isProcessing && (
        <div className="text-center py-8 text-gray-500">
          <p>OCR引擎未初始化</p>
          <Button
            onClick={initializeOCR}
            size="sm"
            className="mt-2"
          >
            重新初始化
          </Button>
        </div>
      )}
    </div>
  );
};