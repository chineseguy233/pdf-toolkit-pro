import React, { useState, useEffect } from 'react'
import MainLayout from './components/layout/MainLayout'
import Sidebar from './components/layout/Sidebar'
import PDFViewer from './components/pdf/PDFViewer'
import OCRPanel from './components/ocr/OCRPanel'
import BatchProcessingPanel from './components/batch/BatchProcessingPanel'
import FileDropZone from './components/common/FileDropZone'
import Toast from './components/common/Toast'
import { useFileStore } from './store/useFileStore'
import type { PDFFile } from '@shared/types'

export default function App() {
  const [activeTab, setActiveTab] = useState<'pdf' | 'ocr' | 'batch'>('pdf')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  
  const { 
    files, 
    currentFile, 
    setCurrentFile, 
    addFiles, 
    removeFile 
  } = useFileStore()

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleFilesSelected = async (selectedFiles: File[]) => {
    try {
      const pdfFiles: PDFFile[] = selectedFiles.map(file => ({
        id: crypto.randomUUID(),
        name: file.name,
        path: file.path || '',
        size: file.size,
        pages: 0, // 将在加载时计算
        createdAt: new Date(),
        modifiedAt: new Date()
      }))
      
      addFiles(pdfFiles)
      
      if (pdfFiles.length > 0 && !currentFile) {
        setCurrentFile(pdfFiles[0])
      }
      
      showToast(`成功添加 ${pdfFiles.length} 个文件`, 'success')
    } catch (error) {
      console.error('Error processing files:', error)
      showToast('文件处理失败', 'error')
    }
  }

  const handleFileSelect = (file: PDFFile) => {
    setCurrentFile(file)
  }

  const handleFileRemove = (fileId: string) => {
    removeFile(fileId)
    if (currentFile?.id === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId)
      setCurrentFile(remainingFiles.length > 0 ? remainingFiles[0] : null)
    }
  }

  const renderMainContent = () => {
    if (!currentFile) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <FileDropZone
            onFilesSelected={handleFilesSelected}
            className="w-96 h-64"
          />
        </div>
      )
    }

    switch (activeTab) {
      case 'pdf':
        return <PDFViewer file={currentFile} />
      case 'ocr':
        return <OCRPanel file={currentFile} />
      case 'batch':
        return <BatchProcessingPanel files={files} />
      default:
        return null
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <MainLayout>
        <div className="flex h-full">
          <Sidebar
            files={files}
            currentFile={currentFile}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            onFilesAdd={handleFilesSelected}
          />
          
          <main className="flex-1 flex flex-col overflow-hidden">
            {renderMainContent()}
          </main>
        </div>
      </MainLayout>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}