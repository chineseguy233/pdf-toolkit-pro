import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/index.css'

console.log('🚀 Starting PDF Toolkit Pro React app...')

// 清理可能的全局污染
if (typeof window !== 'undefined') {
  // 清理可能导致dragEvent错误的全局变量
  delete (window as any).dragEvent
  
  // 定义dragEvent以防止错误
  if (!(window as any).dragEvent) {
    (window as any).dragEvent = null
  }
  
  // 设置全局错误处理
  window.onerror = (message, source, lineno, colno, error) => {
    if (typeof message === 'string' && message.includes('dragEvent')) {
      console.log('已拦截dragEvent错误:', message)
      return true // 阻止错误传播
    }
    console.error('Global error:', { message, source, lineno, colno, error })
    return false
  }
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
  })
}

const root = document.getElementById('root')
if (root) {
  console.log('✅ Root element found, rendering Minimal App...')
  root.innerHTML = '' // 清空内容
  
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
    console.log('✅ PDF Toolkit Pro App rendered successfully!')
  } catch (error) {
    console.error('❌ Error rendering PDF Toolkit Pro App:', error)
    // 回退到纯HTML界面
    root.innerHTML = `
      <div style="width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; font-family: system-ui;">
        <div style="padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
          <h1 style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem; color: #1f2937;">PDF Toolkit Pro</h1>
          <p style="color: #ef4444;">React渲染失败，请检查控制台错误</p>
          <p style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">错误: ${error instanceof Error ? error.message : '未知错误'}</p>
        </div>
      </div>
    `
  }
} else {
  console.error('❌ Root element not found!')
}
