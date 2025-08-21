import React, { useState } from 'react'
import { Play, Plus, Trash2, Settings, Download } from 'lucide-react'
import type { PDFFile, BatchProcessingTask, BatchOperation } from '@shared/types'

interface BatchProcessingPanelProps {
  files: PDFFile[]
}

export default function BatchProcessingPanel({ files }: BatchProcessingPanelProps) {
  const [tasks, setTasks] = useState<BatchProcessingTask[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [selectedOperations, setSelectedOperations] = useState<BatchOperation[]>([])

  const availableOperations = [
    { type: 'ocr' as const, name: 'OCR文字识别', description: '提取PDF中的文字内容' },
    { type: 'compress' as const, name: '压缩优化', description: '减小PDF文件大小' },
    { type: 'merge' as const, name: '合并文档', description: '将多个PDF合并为一个' },
    { type: 'split' as const, name: '拆分文档', description: '将PDF拆分为多个文件' }
  ]

  const handleFileToggle = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleOperationToggle = (operation: BatchOperation) => {
    setSelectedOperations(prev => {
      const exists = prev.find(op => op.type === operation.type)
      if (exists) {
        return prev.filter(op => op.type !== operation.type)
      } else {
        return [...prev, operation]
      }
    })
  }

  const handleCreateTask = () => {
    if (selectedFiles.length === 0 || selectedOperations.length === 0) {
      return
    }

    const newTask: BatchProcessingTask = {
      id: crypto.randomUUID(),
      name: `批处理任务 ${tasks.length + 1}`,
      files: selectedFiles,
      operations: selectedOperations,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    }

    setTasks(prev => [...prev, newTask])
    setSelectedFiles([])
    setSelectedOperations([])
  }

  const handleStartTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'running' as const }
        : task
    ))

    // 模拟任务执行
    const interval = setInterval(() => {
      setTasks(prev => prev.map(task => {
        if (task.id === taskId && task.status === 'running') {
          const newProgress = Math.min(task.progress + 10, 100)
          return {
            ...task,
            progress: newProgress,
            status: newProgress === 100 ? 'completed' as const : 'running' as const
          }
        }
        return task
      }))
    }, 500)

    setTimeout(() => {
      clearInterval(interval)
    }, 5000)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  const getStatusColor = (status: BatchProcessingTask['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'running': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
    }
  }

  const getStatusText = (status: BatchProcessingTask['status']) => {
    switch (status) {
      case 'pending': return '等待中'
      case 'running': return '执行中'
      case 'completed': return '已完成'
      case 'failed': return '失败'
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <h2 className="text-lg font-semibold">批量处理</h2>
        <button
          onClick={handleCreateTask}
          disabled={selectedFiles.length === 0 || selectedOperations.length === 0}
          className="btn btn-primary disabled:opacity-50"
        >
          <Plus size={16} className="mr-2" />
          创建任务
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 配置区域 */}
        <div className="w-1/3 border-r border-border flex flex-col">
          {/* 文件选择 */}
          <div className="p-4 border-b border-border">
            <h3 className="font-medium mb-3">选择文件</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map(file => (
                <label key={file.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => handleFileToggle(file.id)}
                    className="rounded"
                  />
                  <span className="text-sm truncate" title={file.name}>
                    {file.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 操作选择 */}
          <div className="p-4 flex-1">
            <h3 className="font-medium mb-3">选择操作</h3>
            <div className="space-y-3">
              {availableOperations.map(operation => (
                <label key={operation.type} className="block cursor-pointer">
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedOperations.some(op => op.type === operation.type)}
                      onChange={() => handleOperationToggle({ type: operation.type, params: {} })}
                      className="mt-1 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{operation.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {operation.description}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 任务列表 */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium">任务列表</h3>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {tasks.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <Settings size={48} className="mx-auto mb-4 opacity-50" />
                  <p>暂无批处理任务</p>
                  <p className="text-sm">选择文件和操作后创建任务</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task.id} className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {task.files.length} 个文件 • {task.operations.length} 个操作
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                        
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleStartTask(task.id)}
                            className="btn btn-ghost p-2"
                            title="开始任务"
                          >
                            <Play size={16} />
                          </button>
                        )}
                        
                        {task.status === 'completed' && (
                          <button
                            className="btn btn-ghost p-2"
                            title="下载结果"
                          >
                            <Download size={16} />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="btn btn-ghost p-2 text-destructive"
                          title="删除任务"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {task.status === 'running' && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>进度</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      <div className="mb-1">
                        <strong>操作:</strong> {task.operations.map(op => 
                          availableOperations.find(ao => ao.type === op.type)?.name
                        ).join(', ')}
                      </div>
                      <div>
                        <strong>创建时间:</strong> {task.createdAt.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}