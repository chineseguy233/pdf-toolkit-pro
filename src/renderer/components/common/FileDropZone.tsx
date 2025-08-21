import React, { useState, useCallback } from 'react'
import { Upload, FileText } from 'lucide-react'

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void
  className?: string
  accept?: string
  multiple?: boolean
}

export default function FileDropZone({ 
  onFilesSelected, 
  className = '', 
  accept = '.pdf',
  multiple = true 
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    )
    
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }, [onFilesSelected])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }, [onFilesSelected])

  return (
    <div
      className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 rounded-full bg-primary/10">
          <Upload size={32} className="text-primary" />
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">拖拽PDF文件到这里</h3>
          <p className="text-muted-foreground mb-4">
            或者点击下方按钮选择文件
          </p>
        </div>
        
        <label className="btn btn-primary cursor-pointer">
          <FileText size={16} className="mr-2" />
          选择PDF文件
          <input
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
        
        <p className="text-xs text-muted-foreground">
          支持 PDF 格式文件
        </p>
      </div>
    </div>
  )
}