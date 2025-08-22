import React from 'react'
import Button from '../common/Button'

interface ToolbarProps {
  'data-testid'?: string
  onToggleSidebar: () => void
  onToggleSmartPanel: () => void
}

export default function Toolbar({ 'data-testid': testId, onToggleSidebar, onToggleSmartPanel }: ToolbarProps) {
  return (
    <div data-testid={testId} className="h-10 bg-muted border-b border-border flex items-center px-4 gap-2">
      <Button
        data-testid="toggle-sidebar"
        variant="ghost"
        size="sm"
        onClick={onToggleSidebar}
      >
        侧边栏
      </Button>
      
      <Button
        data-testid="toggle-smart-panel"
        variant="ghost"
        size="sm"
        onClick={onToggleSmartPanel}
      >
        智能面板
      </Button>
    </div>
  )
}