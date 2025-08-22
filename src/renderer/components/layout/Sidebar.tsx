import React from 'react'

interface SidebarProps {
  'data-testid'?: string
  activeTab?: 'pdf' | 'ocr' | 'batch' | 'smart'
  onTabChange?: (tab: 'pdf' | 'ocr' | 'batch' | 'smart') => void
}

export default function Sidebar({ 
  'data-testid': testId, 
  activeTab = 'pdf',
  onTabChange 
}: SidebarProps) {
  const tabs = [
    { id: 'pdf' as const, label: '文件预览', icon: '📄' },
    { id: 'ocr' as const, label: 'OCR识别', icon: '🔍' },
    { id: 'batch' as const, label: '批量处理', icon: '📦' },
    { id: 'smart' as const, label: '智能整理', icon: '🤖' }
  ]

  return (
    <div data-testid={testId} className="w-64 bg-card border-r border-border p-4">
      <h2 className="text-lg font-semibold mb-4">工具栏</h2>
      <nav className="space-y-2">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            className={`p-3 rounded cursor-pointer transition-colors ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
            onClick={() => onTabChange?.(tab.id)}
          >
            <div className="flex items-center space-x-2">
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          </div>
        ))}
      </nav>
    </div>
  )
}
