import React, { useEffect } from 'react'

export default function SimpleTest() {
  useEffect(() => {
    console.log('SimpleTest component mounted successfully')
    
    // 清理可能的全局错误
    window.onerror = (message, source, lineno, colno, error) => {
      console.error('Global error caught:', { message, source, lineno, colno, error })
      return false
    }
    
    // 清理未处理的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
    })
    
    return () => {
      window.onerror = null
    }
  }, [])
  
  const handleTestClick = () => {
    console.log('Test button clicked - React events working!')
    alert('React应用交互正常！')
  }
  
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      flexDirection: 'column'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
        border: '2px solid #007bff',
        maxWidth: '500px'
      }}>
        <h1 style={{
          color: '#007bff',
          fontSize: '24px',
          marginBottom: '20px'
        }}>
          🎉 PDF Toolkit Pro
        </h1>
        <p style={{
          color: '#666',
          fontSize: '16px',
          marginBottom: '10px'
        }}>
          ✅ React应用正常运行！
        </p>
        <p style={{
          color: '#28a745',
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          ✅ Electron + React 集成成功
        </p>
        <p style={{
          color: '#999',
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          时间: {new Date().toLocaleString()}
        </p>
        
        <button
          onClick={handleTestClick}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '10px'
          }}
        >
          测试React交互
        </button>
        
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#6c757d'
        }}>
          <p>✅ Electron主进程: 正常</p>
          <p>✅ React渲染: 正常</p>
          <p>✅ 开发者工具: 可用</p>
          <p>🔄 准备切换到完整应用...</p>
        </div>
      </div>
    </div>
  )
}
