import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainLayout from '../../../../src/renderer/components/layout/MainLayout';

// Mock子组件
jest.mock('../../../../src/renderer/components/layout/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

jest.mock('../../../../src/renderer/components/layout/Toolbar', () => {
  return function MockToolbar({ onToggleSidebar, onToggleSmartPanel }: any) {
    return (
      <div data-testid="toolbar">
        <button onClick={onToggleSidebar} data-testid="toggle-sidebar">
          Toggle Sidebar
        </button>
        <button onClick={onToggleSmartPanel} data-testid="toggle-smart-panel">
          Toggle Smart Panel
        </button>
      </div>
    );
  };
});

jest.mock('../../../../src/renderer/components/layout/SmartPanel', () => {
  return function MockSmartPanel() {
    return <div data-testid="smart-panel">Smart Panel</div>;
  };
});

describe('MainLayout', () => {
  const renderMainLayout = (children = <div>Test Content</div>) => {
    return render(<MainLayout>{children}</MainLayout>);
  };

  test('renders main layout with all components', () => {
    renderMainLayout();
    
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('smart-panel')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('toggles sidebar visibility', () => {
    renderMainLayout();
    
    const toggleButton = screen.getByTestId('toggle-sidebar');
    const sidebar = screen.getByTestId('sidebar');
    
    expect(sidebar).toBeVisible();
    
    fireEvent.click(toggleButton);
    
    // 侧边栏应该被隐藏
    expect(sidebar).not.toBeInTheDocument();
  });

  test('toggles smart panel visibility', () => {
    renderMainLayout();
    
    const toggleButton = screen.getByTestId('toggle-smart-panel');
    const smartPanel = screen.getByTestId('smart-panel');
    
    expect(smartPanel).toBeVisible();
    
    fireEvent.click(toggleButton);
    
    // 智能面板应该被隐藏
    expect(smartPanel).not.toBeInTheDocument();
  });

  test('renders children content', () => {
    const testContent = <div data-testid="custom-content">Custom Content</div>;
    renderMainLayout(testContent);
    
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  test('has correct layout structure', () => {
    const { container } = renderMainLayout();
    
    // 检查基本布局结构
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('flex', 'flex-col', 'h-screen');
  });
});