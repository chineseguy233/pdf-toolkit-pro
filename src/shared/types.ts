export interface PDFFile {
  id: string
  name: string
  path: string
  size: number
  pages: number
  createdAt: Date
  modifiedAt: Date
}

export interface OCRResult {
  text: string
  confidence: number
  bbox: {
    x: number
    y: number
    width: number
    height: number
  }
  page: number
}

export interface TextEdit {
  id: string
  page: number
  x: number
  y: number
  width: number
  height: number
  originalText: string
  newText: string
  fontSize: number
  fontFamily: string
  color: string
}

export interface BatchProcessingTask {
  id: string
  name: string
  files: string[]
  operations: BatchOperation[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  createdAt: Date
}

export interface BatchOperation {
  type: 'ocr' | 'text-edit' | 'merge' | 'split' | 'compress'
  params: Record<string, any>
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'zh-CN' | 'en-US'
  ocrEngine: 'tesseract' | 'paddle'
  autoSave: boolean
  maxFileSize: number
}