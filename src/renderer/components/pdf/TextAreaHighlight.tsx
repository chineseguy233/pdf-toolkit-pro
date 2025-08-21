import React from 'react';
import { EditableTextArea } from '../../services/EditableAreaRecognitionService';

interface TextAreaHighlightProps {
  area: EditableTextArea | null;
  isVisible: boolean;
  canvasRect: DOMRect | null;
  scale: number;
  onAreaClick?: (area: EditableTextArea) => void;
}

export const TextAreaHighlight: React.FC<TextAreaHighlightProps> = ({
  area,
  isVisible,
  canvasRect,
  scale,
  onAreaClick
}) => {
  if (!isVisible || !area || !canvasRect) {
    return null;
  }

  // 计算高亮区域的位置和大小
  const calculatePosition = () => {
    // 将PDF坐标转换为Canvas坐标
    const canvasX = area.bbox.left * scale;
    const canvasY = (canvasRect.height / scale - area.bbox.top) * scale;
    
    // 转换为页面坐标
    const pageX = canvasRect.left + canvasX;
    const pageY = canvasRect.top + canvasY;
    
    const width = (area.bbox.right - area.bbox.left) * scale;
    const height = (area.bbox.top - area.bbox.bottom) * scale;
    
    return {
      left: pageX,
      top: pageY,
      width: Math.max(width, 20), // 最小宽度
      height: Math.max(height, 16) // 最小高度
    };
  };

  const position = calculatePosition();

  // 根据区域类型和可编辑性确定样式
  const getHighlightStyle = () => {
    const baseStyle = {
      position: 'fixed' as const,
      left: position.left,
      top: position.top,
      width: position.width,
      height: position.height,
      pointerEvents: 'none' as const,
      borderRadius: '2px',
      transition: 'all 0.2s ease-in-out',
      zIndex: 1000
    };

    if (area.isEditable) {
      // 可编辑区域样式
      return {
        ...baseStyle,
        backgroundColor: 'rgba(0, 123, 255, 0.15)',
        border: '1px solid rgba(0, 123, 255, 0.5)',
        boxShadow: '0 0 0 1px rgba(0, 123, 255, 0.2)'
      };
    } else {
      // 不可编辑区域样式
      return {
        ...baseStyle,
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        border: '1px solid rgba(220, 53, 69, 0.3)',
        boxShadow: '0 0 0 1px rgba(220, 53, 69, 0.1)'
      };
    }
  };

  // 获取置信度指示器
  const getConfidenceIndicator = () => {
    const confidence = Math.round(area.confidence * 100);
    let color = '#28a745'; // 绿色 - 高置信度
    
    if (confidence < 50) {
      color = '#dc3545'; // 红色 - 低置信度
    } else if (confidence < 75) {
      color = '#ffc107'; // 黄色 - 中等置信度
    }
    
    return (
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: 0,
          backgroundColor: color,
          color: 'white',
          fontSize: '10px',
          padding: '2px 4px',
          borderRadius: '2px',
          whiteSpace: 'nowrap'
        }}
      >
        {confidence}%
      </div>
    );
  };

  // 获取类别标签
  const getCategoryLabel = () => {
    const categoryLabels = {
      title: '标题',
      body: '正文',
      caption: '说明',
      watermark: '水印',
      form_field: '表单',
      annotation: '注释'
    };
    
    return categoryLabels[area.category] || area.category;
  };

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (area.isEditable && onAreaClick) {
      onAreaClick(area);
    }
  };

  return (
    <div
      style={getHighlightStyle()}
      onClick={handleClick}
      title={`${getCategoryLabel()} - ${area.isEditable ? '可编辑' : '不可编辑'}`}
    >
      {/* 置信度指示器 */}
      {getConfidenceIndicator()}
      
      {/* 编辑状态图标 */}
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: area.isEditable ? '#28a745' : '#dc3545',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '8px',
            fontWeight: 'bold'
          }}
        >
          {area.isEditable ? '✓' : '✗'}
        </span>
      </div>
      
      {/* 类别标签 */}
      <div
        style={{
          position: 'absolute',
          bottom: -18,
          left: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          fontSize: '10px',
          padding: '1px 4px',
          borderRadius: '2px',
          whiteSpace: 'nowrap'
        }}
      >
        {getCategoryLabel()}
      </div>
    </div>
  );
};

// 高亮管理器组件
interface HighlightManagerProps {
  areas: EditableTextArea[];
  hoveredArea: EditableTextArea | null;
  selectedArea: EditableTextArea | null;
  canvasRect: DOMRect | null;
  scale: number;
  showAllAreas?: boolean;
  onAreaClick?: (area: EditableTextArea) => void;
}

export const HighlightManager: React.FC<HighlightManagerProps> = ({
  areas,
  hoveredArea,
  selectedArea,
  canvasRect,
  scale,
  showAllAreas = false,
  onAreaClick
}) => {
  return (
    <>
      {/* 显示所有区域（调试模式） */}
      {showAllAreas && areas.map(area => (
        <TextAreaHighlight
          key={`all-${area.id}`}
          area={area}
          isVisible={true}
          canvasRect={canvasRect}
          scale={scale}
          onAreaClick={onAreaClick}
        />
      ))}
      
      {/* 悬停高亮 */}
      {hoveredArea && !showAllAreas && (
        <TextAreaHighlight
          key={`hover-${hoveredArea.id}`}
          area={hoveredArea}
          isVisible={true}
          canvasRect={canvasRect}
          scale={scale}
          onAreaClick={onAreaClick}
        />
      )}
      
      {/* 选中高亮 */}
      {selectedArea && (
        <div
          style={{
            position: 'fixed',
            left: canvasRect ? canvasRect.left + selectedArea.bbox.left * scale : 0,
            top: canvasRect ? canvasRect.top + (canvasRect.height / scale - selectedArea.bbox.top) * scale : 0,
            width: (selectedArea.bbox.right - selectedArea.bbox.left) * scale,
            height: (selectedArea.bbox.top - selectedArea.bbox.bottom) * scale,
            backgroundColor: 'rgba(0, 123, 255, 0.25)',
            border: '2px solid #007bff',
            borderRadius: '3px',
            pointerEvents: 'none',
            zIndex: 1001,
            animation: 'pulse 1s infinite'
          }}
        />
      )}
      
      {/* CSS动画 */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  );
};