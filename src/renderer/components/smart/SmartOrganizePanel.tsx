import React, { useState, useEffect } from 'react';
import { DocumentAnalysis } from '../../services/PDFContentAnalyzer';
import { NamingSuggestion, smartRenameEngine } from '../../services/SmartRenameEngine';
import { FolderStructure, OrganizationType, folderOrganizationEngine } from '../../services/FolderOrganizationEngine';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import ProgressBar from '../common/ProgressBar';

interface SmartOrganizePanelProps {
  selectedFiles: string[];
  onOrganizeComplete?: (results: OrganizeResults) => void;
}

interface OrganizeResults {
  renamedFiles: number;
  organizedFiles: number;
  createdFolders: number;
  errors: string[];
}

interface FileAnalysisResult {
  fileId: string;
  fileName: string;
  analysis?: DocumentAnalysis;
  suggestions: NamingSuggestion[];
  selectedSuggestion?: NamingSuggestion;
  error?: string;
}

const SmartOrganizePanel: React.FC<SmartOrganizePanelProps> = ({
  selectedFiles,
  onOrganizeComplete
}) => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'rename' | 'organize'>('analyze');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<FileAnalysisResult[]>([]);
  const [organizationType, setOrganizationType] = useState<OrganizationType>(OrganizationType.BY_CATEGORY);
  const [folderStructure, setFolderStructure] = useState<FolderStructure | null>(null);
  const [progress, setProgress] = useState(0);

  // 分析选中的文件
  const analyzeFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsAnalyzing(true);
    setProgress(0);
    const results: FileAnalysisResult[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileId = selectedFiles[i];
        setProgress((i / selectedFiles.length) * 100);

        try {
          // 这里需要实际的文件分析逻辑
          // 暂时使用模拟数据
          const mockAnalysis: DocumentAnalysis = {
            documentId: fileId,
            metadata: {
              title: `文档 ${i + 1}`,
              pageCount: 5,
              fileSize: 1024 * 1024,
              creationDate: new Date()
            },
            content: {
              keywords: ['关键词1', '关键词2', '关键词3'],
              summary: '这是一个示例文档摘要',
              textLength: 1000,
              pageTexts: ['页面1内容', '页面2内容'],
              hasImages: false,
              hasTables: false,
              mainLanguage: 'zh-CN'
            },
            classification: {
              category: 'report' as any,
              confidence: 0.8,
              features: [],
              alternativeCategories: []
            },
            confidence: 0.8,
            analysisTime: 500
          };

          const suggestions = await smartRenameEngine.generateSuggestions(
            mockAnalysis,
            `文档${i + 1}.pdf`
          );

          results.push({
            fileId,
            fileName: `文档${i + 1}.pdf`,
            analysis: mockAnalysis,
            suggestions,
            selectedSuggestion: suggestions[0]
          });
        } catch (error: any) {
          results.push({
            fileId,
            fileName: `文档${i + 1}.pdf`,
            suggestions: [],
            error: error.message
          });
        }
      }

      setAnalysisResults(results);
      setProgress(100);
    } catch (error: any) {
      console.error('文件分析失败:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 生成文件夹结构
  const generateFolderStructure = async () => {
    const validAnalyses = analysisResults
      .filter(result => result.analysis)
      .map(result => result.analysis!);

    if (validAnalyses.length === 0) return;

    try {
      const structure = await folderOrganizationEngine.generateFolderStructure(
        validAnalyses,
        organizationType
      );
      setFolderStructure(structure);
    } catch (error: any) {
      console.error('生成文件夹结构失败:', error);
    }
  };

  // 执行整理操作
  const executeOrganize = async () => {
    // 这里实现实际的文件重命名和移动逻辑
    const results: OrganizeResults = {
      renamedFiles: 0,
      organizedFiles: 0,
      createdFolders: 0,
      errors: []
    };

    // 模拟执行过程
    for (const result of analysisResults) {
      if (result.selectedSuggestion && result.analysis) {
        results.renamedFiles++;
        results.organizedFiles++;
      }
    }

    if (folderStructure) {
      results.createdFolders = countFolders(folderStructure);
    }

    onOrganizeComplete?.(results);
  };

  // 计算文件夹数量
  const countFolders = (folder: FolderStructure): number => {
    let count = 1;
    folder.children.forEach(child => {
      count += countFolders(child);
    });
    return count;
  };

  useEffect(() => {
    if (selectedFiles.length > 0 && analysisResults.length === 0) {
      analyzeFiles();
    }
  }, [selectedFiles]);

  useEffect(() => {
    if (analysisResults.length > 0 && activeTab === 'organize') {
      generateFolderStructure();
    }
  }, [analysisResults, activeTab, organizationType]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 标签页导航 */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'analyze'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('analyze')}
        >
          内容分析
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'rename'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('rename')}
        >
          智能重命名
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'organize'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('organize')}
        >
          文件夹整理
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-4">
        {/* 分析标签页 */}
        {activeTab === 'analyze' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">文档内容分析</h3>
              <Button
                onClick={analyzeFiles}
                disabled={isAnalyzing || selectedFiles.length === 0}
                className="text-sm"
              >
                {isAnalyzing ? '分析中...' : '重新分析'}
              </Button>
            </div>

            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-gray-600">正在分析文档内容...</span>
                </div>
                <ProgressBar progress={progress} />
              </div>
            )}

            <div className="space-y-3">
              {analysisResults.map((result, index) => (
                <div key={result.fileId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{result.fileName}</h4>
                    {result.analysis && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        置信度: {(result.analysis.confidence * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>

                  {result.error ? (
                    <div className="text-red-600 text-sm">{result.error}</div>
                  ) : result.analysis ? (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">类型:</span>{' '}
                        <span className="text-gray-600">{result.analysis.classification.category}</span>
                      </div>
                      <div>
                        <span className="font-medium">关键词:</span>{' '}
                        <span className="text-gray-600">
                          {result.analysis.content.keywords.join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">摘要:</span>{' '}
                        <span className="text-gray-600">{result.analysis.content.summary}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">等待分析...</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 重命名标签页 */}
        {activeTab === 'rename' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">智能重命名建议</h3>

            <div className="space-y-3">
              {analysisResults.map((result, index) => (
                <div key={result.fileId} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-900 mb-1">原文件名: {result.fileName}</h4>
                    {result.selectedSuggestion && (
                      <div className="text-sm text-green-600">
                        建议: {result.selectedSuggestion.suggestedName}
                      </div>
                    )}
                  </div>

                  {result.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">其他建议:</div>
                      {result.suggestions.slice(1).map((suggestion, idx) => (
                        <div
                          key={suggestion.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            const newResults = [...analysisResults];
                            newResults[index].selectedSuggestion = suggestion;
                            setAnalysisResults(newResults);
                          }}
                        >
                          <span className="text-sm">{suggestion.suggestedName}</span>
                          <span className="text-xs text-gray-500">
                            {(suggestion.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 整理标签页 */}
        {activeTab === 'organize' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">文件夹整理</h3>
              <select
                value={organizationType}
                onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}
                className="text-sm border border-gray-300 rounded px-3 py-1"
              >
                <option value={OrganizationType.BY_CATEGORY}>按类型整理</option>
                <option value={OrganizationType.BY_DATE}>按日期整理</option>
                <option value={OrganizationType.BY_PROJECT}>按项目整理</option>
              </select>
            </div>

            {folderStructure && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">建议的文件夹结构:</h4>
                <FolderTreeView folder={folderStructure} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部操作按钮 */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            已选择 {selectedFiles.length} 个文件
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setAnalysisResults([])}>
              重置
            </Button>
            <Button
              onClick={executeOrganize}
              disabled={analysisResults.length === 0}
            >
              执行整理
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartOrganizePanel;

// 文件夹树形视图组件
const FolderTreeView: React.FC<{ folder: FolderStructure; level?: number }> = ({
  folder,
  level = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  return (
    <div className={`${level > 0 ? 'ml-4' : ''}`}>
      <div
        className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-50 rounded"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {folder.children.length > 0 && (
          <span className="text-gray-400">
            {isExpanded ? '📂' : '📁'}
          </span>
        )}
        <span className="text-sm font-medium">{folder.name}</span>
        {folder.suggestedFiles.length > 0 && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {folder.suggestedFiles.length} 个文件
          </span>
        )}
      </div>

      {isExpanded && folder.children.length > 0 && (
        <div className="mt-1">
          {folder.children.map((child) => (
            <FolderTreeView key={child.id} folder={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};