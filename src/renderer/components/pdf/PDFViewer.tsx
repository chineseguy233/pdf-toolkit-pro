import React, { useState, useEffect, useRef } from 'react'
import { ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react'
import type { PDFFile } from '@shared/types'

interface PDFViewerProps {
  file: PDFFile
}

export default function PDFViewer({ file }: PDFViewerProps) {
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleDownload = () => {
    // 实现下载功能
    console.log('Download PDF:', file.name)
  }

  // 模拟PDF渲染
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // 设置画布大小
        canvas.width = 800 * scale
        canvas.height = 1000 * scale
        
        // 清空画布
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // 绘制边框
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 2
        ctx.strokeRect(0, 0, canvas.width, canvas.height)
        
        // 绘制文本
        ctx.fillStyle = '#374151'
        ctx.font = `${16 * scale}px Arial`
        ctx.textAlign = 'center'
        ctx.fillText(
          `PDF预览 - ${file.name}`,
          canvas.width / 2,
          50 * scale
        )
        
        ctx.fillText(
          `第 ${currentPage} 页 / 共 ${totalPages || 1} 页`,
          canvas.width / 2,
          100 * scale
        )
        
        // 绘制示例内容
        ctx.font = `${12 * scale}px Arial`
        ctx.textAlign = 'left'
        const lines = [
          '这是PDF文档的示例内容。',
          '在实际应用中，这里会显示真实的PDF内容。',
          '您可以使用工具栏进行缩放、旋转等操作。',
          '',
          '功能特性：',
          '• PDF文档查看',
          '• 文本编辑',
          '• OCR识别',
          '• 批量处理'
        ]
        
        lines.forEach((line, index) => {
          ctx.fillText(line, 50 * scale, (150 + index * 25) * scale)
        })
      }
    }
  }, [file, scale, rotation, currentPage, totalPages])

  // 模拟获取PDF页数
  useEffect(() => {
    setTotalPages(Math.floor(Math.random() * 10) + 1)
  }, [file])

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{file.name}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="btn btn-ghost p-2"
            title="缩小"
          >
            <ZoomOut size={16} />
          </button>
          
          <span className="text-sm px-2">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="btn btn-ghost p-2"
            title="放大"
          >
            <ZoomIn size={16} />
          </button>
          
          <div className="w-px h-6 bg-border mx-2" />
          
          <button
            onClick={handleRotate}
            className="btn btn-ghost p-2"
            title="旋转"
          >
            <RotateCw size={16} />
          </button>
          
          <button
            onClick={handleDownload}
            className="btn btn-ghost p-2"
            title="下载"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* PDF内容区域 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="shadow-lg bg-white"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
          />
        </div>
      </div>

      {/* 页面导航 */}
      <div className="flex items-center justify-center p-4 bg-card border-t border-border">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="btn btn-outline disabled:opacity-50"
          >
            上一页
          </button>
          
          <span className="text-sm">
            第 {currentPage} 页 / 共 {totalPages} 页
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="btn btn-outline disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  )
}