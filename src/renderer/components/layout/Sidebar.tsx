import React from 'react'
import { FileText, Eye, Zap, Plus, X } from 'lucide-react'
import type { PDFFile } from '@shared/types'

interface SidebarProps {
  files: PDFFile[]
  currentFile: PDFFile | null
  activeTab: 'pdf' | 'ocr' | 'batch'
  onTabChange: (tab: 'pdf' | 'ocr' | 'batch') => void
  onFileSelect: (file: PDFFile) => void
  onFileRemove: (fileId: string) => void
  onFilesAdd: (files: File[]) => void
}

export default function Sidebar({
  files,
  currentFile,
  activeTab,
  onTabChange,
  onFileSelect,
  onFileRemove,
  onFilesAdd
}: SidebarProps) {
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    onFilesAdd(selectedFiles)
  }

  const tabs = [
    { id: 'pdf' as const, label: 'PDF查看', icon: Eye },
    { id: 'ocr' as const, label: 'OCR识别', icon: FileText },
    { id: 'batch' as const, label: '批量处理', icon: Zap }
  ]

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      {/* 标签页 */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border">
          <label className="btn btn-primary w-full cursor-pointer">
            <Plus size={16} className="mr-2" />
            添加PDF文件
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {files.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>暂无PDF文件</p>
              <p className="text-sm">点击上方按钮添加文件</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`group p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentFile?.id === file.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border hover:bg-accent'
                  }`}
                  onClick={() => onFileSelect(file)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {file.pages > 0 && ` • ${file.pages} 页`}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onFileRemove(file.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}