import React from 'react'

interface SmartPanelProps {
  'data-testid'?: string
}

export default function SmartPanel({ 'data-testid': testId }: SmartPanelProps) {
  return (
    <div data-testid={testId} className="w-80 bg-card border-l border-border p-4">
      <h2 className="text-lg font-semibold mb-4">智能助手</h2>
      <div className="space-y-4">
        <div className="p-3 bg-muted rounded">
          <h3 className="font-medium mb-2">建议操作</h3>
          <p className="text-sm text-muted-foreground">
            检测到新的PDF文件，建议进行OCR识别
          </p>
        </div>
        <div className="p-3 bg-muted rounded">
          <h3 className="font-medium mb-2">处理历史</h3>
          <p className="text-sm text-muted-foreground">
            最近处理了5个文件
          </p>
        </div>
      </div>
    </div>
  )
}