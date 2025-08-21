import React from 'react'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-12 bg-card border-b border-border flex items-center px-4">
        <h1 className="text-lg font-semibold text-foreground">PDF Toolkit Pro</h1>
      </header>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}