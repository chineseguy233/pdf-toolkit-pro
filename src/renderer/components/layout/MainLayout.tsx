import React, { useState } from 'react'
import Toolbar from './Toolbar'
import Sidebar from './Sidebar'
import SmartPanel from './SmartPanel'

interface MainLayoutProps {
  children: React.ReactNode
  activeTab?: 'pdf' | 'ocr' | 'batch' | 'smart'
  onTabChange?: (tab: 'pdf' | 'ocr' | 'batch' | 'smart') => void
}

export default function MainLayout({ children, activeTab, onTabChange }: MainLayoutProps) {
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [smartPanelVisible, setSmartPanelVisible] = useState(true)

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-12 bg-card border-b border-border flex items-center px-4">
        <h1 className="text-lg font-semibold text-foreground">PDF Toolkit Pro</h1>
      </header>
      
      <Toolbar 
        data-testid="toolbar"
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        onToggleSmartPanel={() => setSmartPanelVisible(!smartPanelVisible)}
      />
      
      <div className="flex-1 overflow-hidden flex">
        {sidebarVisible && (
        <Sidebar 
          data-testid="sidebar" 
          activeTab={activeTab || 'pdf'}
          onTabChange={onTabChange || (() => {})}
        />
        )}
        
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
        
        {smartPanelVisible && (
          <SmartPanel data-testid="smart-panel" />
        )}
      </div>
    </div>
  )
}
