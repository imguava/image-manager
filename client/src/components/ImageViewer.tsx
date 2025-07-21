import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Info, Edit } from 'lucide-react';
import { ImageData } from '../types';
import { imageService } from '../services/imageService';
import DescriptionModal from './DescriptionModal';

interface ImageViewerProps {
  image: ImageData;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onImageUpdate?: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  onClose,
  onNext,
  onPrevious,
  onImageUpdate,
}) => {
  const [showInfo, setShowInfo] = React.useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrevious();
          break;
        case 'ArrowRight':
          onNext();
          break;
        case 'i':
        case 'I':
          setShowInfo(!showInfo);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose, onNext, onPrevious, showInfo]);

  const handleDownload = async () => {
    try {
      const blob = await imageService.downloadImage(image.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 工具栏 */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-4">
          <h2 className="text-white text-lg font-medium truncate max-w-md">
            {image.original_name}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setEditingDescription(true);
            }}
            className="p-2 bg-blue-500 bg-opacity-90 rounded-full text-white hover:bg-opacity-100 transition-all"
            title="编辑描述"
          >
            <Edit size={20} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(!showInfo);
            }}
            className="p-2 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition-all"
          >
            <Info size={20} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-2 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition-all"
          >
            <Download size={20} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition-all"
          >
            <X size={20} />
          </motion.button>
        </div>
      </div>

      {/* 导航按钮 */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onPrevious();
        }}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition-all z-10"
      >
        <ChevronLeft size={24} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition-all z-10"
      >
        <ChevronRight size={24} />
      </motion.button>

      {/* 图片 */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.originalUrl}
          alt={image.original_name}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
      </motion.div>

      {/* 信息面板 */}
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: showInfo ? 0 : 300, opacity: showInfo ? 1 : 0 }}
        className="absolute right-4 top-20 bottom-4 w-80 bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">图片信息</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">文件名</label>
            <p className="text-gray-900 break-all">{image.original_name}</p>
          </div>

          {image.description && (
            <div>
              <label className="text-sm font-medium text-gray-600">描述</label>
              <p className="text-gray-900">{image.description}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-600">尺寸</label>
            <p className="text-gray-900">{image.width} × {image.height} 像素</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">文件大小</label>
            <p className="text-gray-900">{formatFileSize(image.file_size)}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">格式</label>
            <p className="text-gray-900 uppercase">{image.format}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">上传时间</label>
            <p className="text-gray-900">{formatDate(image.created_at)}</p>
          </div>

          {image.groups.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600">分组</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {image.groups.map((group, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                  >
                    {group}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            快捷键：ESC 关闭，← → 切换图片，I 显示/隐藏信息
          </p>
        </div>
      </motion.div>

      {/* 描述编辑弹窗 */}
      <AnimatePresence>
        {editingDescription && (
          <DescriptionModal
            image={image}
            onClose={() => setEditingDescription(false)}
            onUpdate={() => {
              if (onImageUpdate) {
                onImageUpdate();
              }
              setEditingDescription(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ImageViewer;