import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import SmartPanel from './SmartPanel';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [smartPanelVisible, setSmartPanelVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);

  const handleSidebarResize = (newWidth: number) => {
    setSidebarWidth(Math.max(200, Math.min(500, newWidth)));
  };

  return (
    <div className="flex flex-col h-screen bg-background text-gray-900">
      {/* 顶部工具栏 */}
      <Toolbar 
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        onToggleSmartPanel={() => setSmartPanelVisible(!smartPanelVisible)}
        sidebarVisible={sidebarVisible}
        smartPanelVisible={smartPanelVisible}
      />
      
      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧边栏 */}
        {sidebarVisible && (
          <div 
            className="bg-surface border-r border-gray-200 flex-shrink-0 relative"
            style={{ width: `${sidebarWidth}px` }}
          >
            <Sidebar />
            {/* 拖拽调整手柄 */}
            <div
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-gray-300 hover:bg-primary opacity-0 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => {
                const startX = e.clientX;
                const startWidth = sidebarWidth;
                
                const handleMouseMove = (e: MouseEvent) => {
                  const newWidth = startWidth + (e.clientX - startX);
                  handleSidebarResize(newWidth);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
          </div>
        )}
        
        {/* 主内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
        
        {/* 右侧智能面板 */}
        {smartPanelVisible && (
          <div className="w-80 bg-surface border-l border-gray-200 flex-shrink-0">
            <SmartPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default MainLayout;