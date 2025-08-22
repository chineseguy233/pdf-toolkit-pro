import React from 'react'

export default function SimpleApp() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      fontFamily: 'system-ui'
    }}>
      <div style={{
        padding: '2rem',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#1f2937'
        }}>
          PDF Toolkit Pro
        </h1>
        <p style={{ color: '#10b981', fontSize: '1.2rem' }}>
          ✅ React应用成功加载！
        </p>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '1rem' }}>
          开发环境就绪，可以开始开发
        </p>
      </div>
    </div>
  )
}