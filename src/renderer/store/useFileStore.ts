import { create } from 'zustand'
import type { PDFFile } from '@shared/types'

interface FileStore {
  files: PDFFile[]
  currentFile: PDFFile | null
  setCurrentFile: (file: PDFFile | null) => void
  addFiles: (files: PDFFile[]) => void
  removeFile: (fileId: string) => void
  updateFile: (fileId: string, updates: Partial<PDFFile>) => void
  clearFiles: () => void
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  currentFile: null,
  
  setCurrentFile: (file) => set({ currentFile: file }),
  
  addFiles: (newFiles) => set((state) => ({
    files: [...state.files, ...newFiles]
  })),
  
  removeFile: (fileId) => set((state) => ({
    files: state.files.filter(f => f.id !== fileId),
    currentFile: state.currentFile?.id === fileId ? null : state.currentFile
  })),
  
  updateFile: (fileId, updates) => set((state) => ({
    files: state.files.map(f => f.id === fileId ? { ...f, ...updates } : f),
    currentFile: state.currentFile?.id === fileId 
      ? { ...state.currentFile, ...updates } 
      : state.currentFile
  })),
  
  clearFiles: () => set({ files: [], currentFile: null })
}))