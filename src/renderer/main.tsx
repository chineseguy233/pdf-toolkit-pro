import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/index.css'

// 确保DOM已加载
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root')
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  }
})

// 如果DOM已经加载完成，直接渲染
if (document.readyState === 'loading') {
  // DOM还在加载中，等待DOMContentLoaded事件
} else {
  // DOM已经加载完成
  const root = document.getElementById('root')
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  }
}