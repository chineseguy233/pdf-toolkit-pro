import React, { useEffect, useState, useCallback } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { pdfRenderingService } from '../../services/PDFRenderingService';

interface ThumbnailPanelProps {
  totalPages: number;
  currentPage: number;
  onPageSelect: (pageNumber: number) => void;
  isVisible: boolean;
}

interface ThumbnailItem {
  pageNumber: number;
  dataUrl: string | null;
  isLoading: boolean;
}

export const ThumbnailPanel: React.FC<ThumbnailPanelProps> = ({
  totalPages,
  currentPage,
  onPageSelect,
  isVisible
}) => {
  const [thumbnails, setThumbnails] = useState<ThumbnailItem[]>([]);

  // 初始化缩略图列表
  useEffect(() => {
    const items: ThumbnailItem[] = [];
    for (let i = 1; i <= totalPages; i++) {
      items.push({
        pageNumber: i,
        dataUrl: null,
        isLoading: false
      });
    }
    setThumbnails(items);
  }, [totalPages]);

  // 生成缩略图
  const generateThumbnail = useCallback(async (pageNumber: number) => {
    setThumbnails(prev => prev.map(item => 
      item.pageNumber === pageNumber 
        ? { ...item, isLoading: true }
        : item
    ));

    try {
      const dataUrl = await pdfRenderingService.generateThumbnail(pageNumber);
      setThumbnails(prev => prev.map(item => 
        item.pageNumber === pageNumber 
          ? { ...item, dataUrl, isLoading: false }
          : item
      ));
    } catch (error) {
      console.error(`Failed to generate thumbnail for page ${pageNumber}:`, error);
      setThumbnails(prev => prev.map(item => 
        item.pageNumber === pageNumber 
          ? { ...item, isLoading: false }
          : item
      ));
    }
  }, []);

  // 懒加载缩略图
  useEffect(() => {
    if (!isVisible) return;

    // 优先加载当前页面和相邻页面的缩略图
    const pagesToLoad = [
      currentPage,
      currentPage - 1,
      currentPage + 1,
      currentPage - 2,
      currentPage + 2
    ].filter(page => page >= 1 && page <= totalPages);

    pagesToLoad.forEach(pageNumber => {
      const thumbnail = thumbnails.find(t => t.pageNumber === pageNumber);
      if (thumbnail && !thumbnail.dataUrl && !thumbnail.isLoading) {
        generateThumbnail(pageNumber);
      }
    });
  }, [currentPage, thumbnails, totalPages, isVisible, generateThumbnail]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-48 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-2">
        <h3 className="text-sm font-medium text-gray-700 mb-3">页面缩略图</h3>
        <div className="space-y-2">
          {thumbnails.map((thumbnail) => (
            <div
              key={thumbnail.pageNumber}
              className={`
                relative cursor-pointer border-2 rounded-lg overflow-hidden
                transition-all duration-200 hover:shadow-md
                ${thumbnail.pageNumber === currentPage 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              onClick={() => onPageSelect(thumbnail.pageNumber)}
            >
              <div className="aspect-[3/4] bg-white flex items-center justify-center">
                {thumbnail.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : thumbnail.dataUrl ? (
                  <img
                    src={thumbnail.dataUrl}
                    alt={`第 ${thumbnail.pageNumber} 页`}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-xs text-center">
                    <div className="text-2xl mb-1">📄</div>
                    <div>第 {thumbnail.pageNumber} 页</div>
                  </div>
                )}
              </div>
              
              {/* 页码标签 */}
              <div className={`
                absolute bottom-0 left-0 right-0 text-xs text-center py-1
                ${thumbnail.pageNumber === currentPage 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-800 bg-opacity-75 text-white'
                }
              `}>
                {thumbnail.pageNumber}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};