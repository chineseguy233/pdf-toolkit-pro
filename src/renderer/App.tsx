import React, { useState, useEffect } from 'react'
import MainLayout from './components/layout/MainLayout'
import PDFViewer from './components/pdf/PDFViewer'
import OCRPanel from './components/ocr/OCRPanel'
import BatchProcessingPanel from './components/batch/BatchProcessingPanel'
import SmartOrganizePanel from './components/smart/SmartOrganizePanel'
import FileDropZone from './components/common/FileDropZone'
import Toast from './components/common/Toast'
import { useFileStore } from './store/useFileStore'
import type { PDFFile } from '@shared/types'

export default function App() {
  const [activeTab, setActiveTab] = useState<'pdf' | 'ocr' | 'batch' | 'smart'>('pdf')
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
        path: (file as any).path || '',
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
        file: file,
        pages: 0,
        createdAt: new Date(),
        modifiedAt: new Date()
      }))
      
      addFiles(pdfFiles)
      
      if (!currentFile && pdfFiles.length > 0) {
        setCurrentFile(pdfFiles[0])
      }
      
      showToast(`成功导入 ${pdfFiles.length} 个文件`, 'success')
    } catch (error) {
      console.error('文件导入失败:', error)
      showToast('文件导入失败', 'error')
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
      case 'smart':
        return <SmartOrganizePanel selectedFiles={files.map(f => f.id)} />
      default:
        return null
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <main className="flex-1 flex flex-col overflow-hidden">
          {renderMainContent()}
        </main>
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