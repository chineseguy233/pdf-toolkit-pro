import React, { useState } from 'react'
import { Eye, Download, Copy, Settings } from 'lucide-react'
import type { PDFFile, OCRResult } from '@shared/types'

interface OCRPanelProps {
  file: PDFFile
}

export default function OCRPanel({ file }: OCRPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState('chi_sim+eng')

  const handleStartOCR = async () => {
    setIsProcessing(true)
    
    // 模拟OCR处理
    setTimeout(() => {
      const mockResults: OCRResult[] = [
        {
          text: '这是从PDF中识别出的文本内容。',
          confidence: 0.95,
          bbox: { x: 100, y: 100, width: 300, height: 50 },
          page: 1
        },
        {
          text: 'OCR技术可以将图像中的文字转换为可编辑的文本。',
          confidence: 0.92,
          bbox: { x: 100, y: 200, width: 350, height: 50 },
          page: 1
        },
        {
          text: '支持中英文混合识别，准确率较高。',
          confidence: 0.88,
          bbox: { x: 100, y: 300, width: 280, height: 50 },
          page: 1
        }
      ]
      
      setOcrResults(mockResults)
      setIsProcessing(false)
    }, 3000)
  }

  const handleCopyText = () => {
    const allText = ocrResults.map(result => result.text).join('\n')
    navigator.clipboard.writeText(allText)
  }

  const handleDownloadText = () => {
    const allText = ocrResults.map(result => result.text).join('\n')
    const blob = new Blob([allText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file.name}_ocr.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">OCR文字识别</h2>
          <span className="text-sm text-muted-foreground">{file.name}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="input w-40"
          >
            <option value="chi_sim+eng">中英文</option>
            <option value="chi_sim">简体中文</option>
            <option value="eng">英文</option>
            <option value="chi_tra">繁体中文</option>
          </select>
          
          <button
            onClick={handleStartOCR}
            disabled={isProcessing}
            className="btn btn-primary"
          >
            <Eye size={16} className="mr-2" />
            {isProcessing ? '识别中...' : '开始识别'}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF预览区域 */}
        <div className="w-1/2 border-r border-border p-4">
          <div className="h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Eye size={48} className="mx-auto mb-4 opacity-50" />
              <p>PDF预览区域</p>
              <p className="text-sm">这里会显示PDF页面</p>
            </div>
          </div>
        </div>

        {/* OCR结果区域 */}
        <div className="w-1/2 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-medium">识别结果</h3>
            {ocrResults.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={handleCopyText}
                  className="btn btn-ghost p-2"
                  title="复制文本"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={handleDownloadText}
                  className="btn btn-ghost p-2"
                  title="下载文本"
                >
                  <Download size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {isProcessing ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">正在识别文字...</p>
                </div>
              </div>
            ) : ocrResults.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <Settings size={48} className="mx-auto mb-4 opacity-50" />
                  <p>暂无识别结果</p>
                  <p className="text-sm">点击"开始识别"按钮开始OCR处理</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {ocrResults.map((result, index) => (
                  <div key={index} className="card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        第 {result.page} 页
                      </span>
                      <span className="text-xs text-muted-foreground">
                        置信度: {Math.round(result.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{result.text}</p>
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">完整文本</h4>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {ocrResults.map(result => result.text).join('\n\n')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}