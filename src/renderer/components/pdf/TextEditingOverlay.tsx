import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextBlock, Point } from '../../services/TextLocationService';

interface TextEditingOverlayProps {
  isVisible: boolean;
  textBlock: TextBlock | null;
  canvasRect: DOMRect | null;
  scale: number;
  onTextChange: (blockId: string, newText: string) => void;
  onEditComplete: () => void;
  onEditCancel: () => void;
}

interface EditingState {
  isEditing: boolean;
  originalText: string;
  currentText: string;
  position: Point;
  size: { width: number; height: number };
}

export const TextEditingOverlay: React.FC<TextEditingOverlayProps> = ({
  isVisible,
  textBlock,
  canvasRect,
  scale,
  onTextChange,
  onEditComplete,
  onEditCancel
}) => {
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 计算编辑框位置和大小
  const calculateEditingPosition = useCallback((block: TextBlock): EditingState => {
    if (!canvasRect) {
      return {
        isEditing: true,
        originalText: block.text,
        currentText: block.text,
        position: { x: 0, y: 0 },
        size: { width: 200, height: 30 }
      };
    }

    // 将PDF坐标转换为Canvas坐标
    const canvasX = block.x * scale;
    const canvasY = (canvasRect.height / scale - block.y - block.height) * scale;

    // 转换为页面坐标
    const pageX = canvasRect.left + canvasX;
    const pageY = canvasRect.top + canvasY;

    return {
      isEditing: true,
      originalText: block.text,
      currentText: block.text,
      position: { x: pageX, y: pageY },
      size: { 
        width: Math.max(block.width * scale, 100),
        height: Math.max(block.height * scale, 24)
      }
    };
  }, [canvasRect, scale]);

  // 开始编辑
  useEffect(() => {
    if (isVisible && textBlock && !editingState) {
      const newEditingState = calculateEditingPosition(textBlock);
      setEditingState(newEditingState);
    } else if (!isVisible && editingState) {
      setEditingState(null);
    }
  }, [isVisible, textBlock, editingState, calculateEditingPosition]);

  // 自动聚焦到文本框
  useEffect(() => {
    if (editingState && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingState]);

  // 处理文本变化
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editingState) return;
    
    setEditingState(prev => prev ? {
      ...prev,
      currentText: event.target.value
    } : null);
  };

  // 处理键盘事件
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    switch (event.key) {
      case 'Enter':
        if (!event.shiftKey) {
          event.preventDefault();
          handleSave();
        }
        break;
      case 'Escape':
        event.preventDefault();
        handleCancel();
        break;
      case 'Tab':
        event.preventDefault();
        handleSave();
        break;
    }
  };

  // 保存编辑
  const handleSave = () => {
    if (!editingState || !textBlock) return;
    
    if (editingState.currentText !== editingState.originalText) {
      onTextChange(textBlock.id, editingState.currentText);
    }
    
    onEditComplete();
  };

  // 取消编辑
  const handleCancel = () => {
    onEditCancel();
  };

  // 处理点击外部区域
  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      handleSave();
    }
  };

  // 自动调整文本框大小
  const adjustTextareaSize = useCallback(() => {
    if (!textareaRef.current || !editingState) return;

    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    
    const scrollHeight = textarea.scrollHeight;
    const minHeight = editingState.size.height;
    const maxHeight = 200;
    
    textarea.style.height = `${Math.max(minHeight, Math.min(scrollHeight, maxHeight))}px`;
  }, [editingState]);

  // 文本变化时调整大小
  useEffect(() => {
    adjustTextareaSize();
  }, [editingState?.currentText, adjustTextareaSize]);

  if (!isVisible || !editingState || !textBlock) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black bg-opacity-10"
      onClick={handleClickOutside}
    >
      {/* 编辑框 */}
      <div
        className="absolute bg-white border-2 border-blue-500 rounded shadow-lg"
        style={{
          left: editingState.position.x,
          top: editingState.position.y,
          minWidth: editingState.size.width,
          minHeight: editingState.size.height
        }}
      >
        {/* 文本输入区域 */}
        <textarea
          ref={textareaRef}
          value={editingState.currentText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className="w-full p-2 border-none outline-none resize-none bg-transparent"
          style={{
            fontSize: `${Math.max(textBlock.fontSize * scale * 0.8, 12)}px`,
            fontFamily: textBlock.fontFamily || 'Arial, sans-serif',
            minHeight: editingState.size.height,
            lineHeight: '1.2'
          }}
          placeholder="输入文本..."
        />
        
        {/* 工具栏 */}
        <div className="flex items-center justify-between p-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {editingState.currentText.length} 字符
            </span>
            {editingState.currentText !== editingState.originalText && (
              <span className="text-xs text-orange-500">已修改</span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={handleCancel}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
              title="取消 (Esc)"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-2 py-1 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded"
              title="保存 (Enter)"
            >
              保存
            </button>
          </div>
        </div>
      </div>
      
      {/* 快捷键提示 */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
        <div>Enter: 保存</div>
        <div>Esc: 取消</div>
        <div>Shift+Enter: 换行</div>
      </div>
    </div>
  );
};