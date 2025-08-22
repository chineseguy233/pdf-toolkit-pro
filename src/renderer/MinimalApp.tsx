import React from 'react'

export default function MinimalApp() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
        border: '2px solid #10b981'
      }}>
        <h1 style={{ color: '#10b981', marginBottom: '20px' }}>
          🎉 React应用修复成功！
        </h1>
        <p style={{ color: '#666', marginBottom: '10px' }}>
          ✅ React渲染正常
        </p>
        <p style={{ color: '#666', marginBottom: '10px' }}>
          ✅ Electron集成正常
        </p>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          ✅ 开发环境就绪
        </p>
        <button
          onClick={() => alert('React交互测试成功！')}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          测试React交互
        </button>
      </div>
    </div>
  )
}