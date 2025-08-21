import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TextBlock } from '../../services/TextLocationService';

interface InlineTextEditorProps {
  textBlock: TextBlock;
  isVisible: boolean;
  canvasRect: DOMRect | null;
  scale: number;
  onSave: (newText: string) => void;
  onCancel: () => void;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  textBlock,
  isVisible,
  canvasRect,
  scale,
  onSave,
  onCancel
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentText, setCurrentText] = useState(textBlock.text);
  const [isComposing, setIsComposing] = useState(false);

  // 计算编辑器位置
  const calculatePosition = useCallback(() => {
    if (!canvasRect) return { left: 0, top: 0, width: 200, height: 30 };

    // 将PDF坐标转换为Canvas坐标
    const canvasX = textBlock.x * scale;
    const canvasY = (canvasRect.height / scale - textBlock.y) * scale;
    
    // 转换为页面坐标
    const pageX = canvasRect.left + canvasX;
    const pageY = canvasRect.top + canvasY;
    
    const width = Math.max(textBlock.width * scale, 100);
    const height = Math.max(textBlock.height * scale, 24);
    
    return {
      left: pageX,
      top: pageY - height, // 调整Y坐标使文本对齐
      width,
      height
    };
  }, [textBlock, canvasRect, scale]);

  // 将PDF样式转换为CSS样式
  const getEditorStyle = useCallback(() => {
    const position = calculatePosition();
    
    return {
      position: 'fixed' as const,
      left: position.left,
      top: position.top,
      width: position.width,
      height: position.height,
      fontSize: `${textBlock.fontSize * scale}px`,
      fontFamily: mapFontFamily(textBlock.fontFamily),
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: '2px solid #007bff',
      borderRadius: '3px',
      padding: '2px 4px',
      margin: 0,
      outline: 'none',
      resize: 'none' as const,
      overflow: 'hidden',
      zIndex: 2000,
      lineHeight: '1.2',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
    };
  }, [textBlock, scale, calculatePosition]);

  // 字体映射
  const mapFontFamily = (pdfFont: string): string => {
    const fontMap: Record<string, string> = {
      'Times-Roman': 'Times, "Times New Roman", serif',
      'Helvetica': 'Arial, "Helvetica Neue", sans-serif',
      'Courier': '"Courier New", Courier, monospace',
      'SimSun': 'SimSun, "宋体", serif',
      'SimHei': 'SimHei, "黑体", sans-serif',
      'Microsoft YaHei': '"Microsoft YaHei", "微软雅黑", sans-serif'
    };
    
    return fontMap[pdfFont] || 'Arial, sans-serif';
  };

  // 键盘事件处理
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onCancel();
        break;
      case 'Enter':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onSave(currentText);
        }
        // 普通Enter键允许换行
        break;
      case 'Tab':
        event.preventDefault();
        // 插入制表符
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newText = currentText.substring(0, start) + '\t' + currentText.substring(end);
          setCurrentText(newText);
          
          // 设置光标位置
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          }, 0);
        }
        break;
    }
  }, [currentText, onSave, onCancel]);

  // 处理文本输入
  const handleInput = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isComposing) {
      setCurrentText(event.target.value);
    }
  }, [isComposing]);

  // 中文输入法支持
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback((event: React.CompositionEvent) => {
    setIsComposing(false);
    setCurrentText(event.currentTarget.value);
  }, []);

  // 点击外部区域完成编辑
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
      onSave(currentText);
    }
  }, [currentText, onSave]);

  // 自动调整高度
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 24)}px`;
    }
  }, []);

  // 组件挂载时的初始化
  useEffect(() => {
    if (isVisible && textareaRef.current) {
      const textarea = textareaRef.current;
      
      // 聚焦并选中所有文本
      textarea.focus();
      textarea.select();
      
      // 调整高度
      adjustHeight();
      
      // 添加全局点击监听
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isVisible, handleClickOutside, adjustHeight]);

  // 文本变化时调整高度
  useEffect(() => {
    adjustHeight();
  }, [currentText, adjustHeight]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <textarea
        ref={textareaRef}
        value={currentText}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        style={getEditorStyle()}
        placeholder="输入文本..."
        spellCheck={false}
      />
      
      {/* 编辑提示 */}
      <div
        style={{
          position: 'fixed',
          left: calculatePosition().left,
          top: calculatePosition().top - 25,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          fontSize: '11px',
          padding: '2px 6px',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          zIndex: 2001,
          pointerEvents: 'none'
        }}
      >
        Ctrl+Enter保存 | ESC取消
      </div>
    </>
  );
};

// 编辑状态管理Hook
export const useTextEditing = () => {
  const [editingTextBlock, setEditingTextBlock] = useState<TextBlock | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = useCallback((textBlock: TextBlock) => {
    setEditingTextBlock(textBlock);
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingTextBlock(null);
    setIsEditing(false);
  }, []);

  const saveEdit = useCallback((newText: string) => {
    if (editingTextBlock) {
      // 更新文本块内容
      editingTextBlock.text = newText;
      
      // 触发保存事件（这里可以添加更复杂的保存逻辑）
      console.log('保存文本编辑:', {
        blockId: editingTextBlock.id,
        oldText: editingTextBlock.text,
        newText
      });
    }
    
    stopEditing();
  }, [editingTextBlock, stopEditing]);

  const cancelEdit = useCallback(() => {
    stopEditing();
  }, [stopEditing]);

  return {
    editingTextBlock,
    isEditing,
    startEditing,
    stopEditing,
    saveEdit,
    cancelEdit
  };
};

// 编辑历史管理
interface EditOperation {
  id: string;
  timestamp: number;
  textBlockId: string;
  oldText: string;
  newText: string;
}

export class EditHistory {
  private operations: EditOperation[] = [];
  private maxHistorySize = 50;

  addOperation(textBlockId: string, oldText: string, newText: string): void {
    const operation: EditOperation = {
      id: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      textBlockId,
      oldText,
      newText
    };

    this.operations.push(operation);

    // 限制历史记录大小
    if (this.operations.length > this.maxHistorySize) {
      this.operations = this.operations.slice(-this.maxHistorySize);
    }
  }

  getLastOperation(): EditOperation | null {
    return this.operations.length > 0 ? this.operations[this.operations.length - 1] : null;
  }

  getOperationsForTextBlock(textBlockId: string): EditOperation[] {
    return this.operations.filter(op => op.textBlockId === textBlockId);
  }

  clear(): void {
    this.operations = [];
  }

  getOperationCount(): number {
    return this.operations.length;
  }
}

export const editHistory = new EditHistory();