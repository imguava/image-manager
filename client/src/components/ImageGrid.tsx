import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Download, Edit, Check, Tag, FlipHorizontal, FileText } from 'lucide-react';
import { ImageData } from '../types';
import { imageService } from '../services/imageService';
import DescriptionModal from './DescriptionModal';
import TagManager from './TagManager';

interface ImageGridProps {
  images: ImageData[];
  selectedImages: string[];
  onImageSelect: (imageId: string) => void;
  onImageView: (image: ImageData) => void;
  onImageUpdate?: () => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  selectedImages,
  onImageSelect,
  onImageView,
  onImageUpdate,
}) => {
  const [editingImage, setEditingImage] = useState<ImageData | null>(null);
  const [managingTagsImage, setManagingTagsImage] = useState<ImageData | null>(null);
  const [editingNameImage, setEditingNameImage] = useState<ImageData | null>(null);
  const [nameValue, setNameValue] = useState('');

  const handleDescriptionEdit = (image: ImageData) => {
    console.log('打开描述编辑弹窗:', image.id);
    setEditingImage(image);
  };

  const handleDescriptionModalClose = () => {
    setEditingImage(null);
  };

  const handleDescriptionUpdate = () => {
    if (onImageUpdate) {
      onImageUpdate();
    }
    setEditingImage(null);
  };

  const handleTagManage = (image: ImageData) => {
    setManagingTagsImage(image);
  };

  const handleTagManagerClose = () => {
    setManagingTagsImage(null);
  };

  const handleTagUpdate = () => {
    if (onImageUpdate) {
      onImageUpdate();
    }
    setManagingTagsImage(null);
  };

  const handleNameEdit = (image: ImageData) => {
    setEditingNameImage(image);
    setNameValue(image.original_name);
  };

  const handleNameSave = async (imageId: string) => {
    try {
      await imageService.updateImageName(imageId, nameValue);
      setEditingNameImage(null);
      if (onImageUpdate) {
        onImageUpdate();
      }
    } catch (error) {
      console.error('更新图片名称失败:', error);
      alert('更新图片名称失败: ' + (error as Error).message);
    }
  };

  const handleFlip = async (image: ImageData) => {
    try {
      await imageService.flipImage(image.id);
      if (onImageUpdate) {
        onImageUpdate();
      }
    } catch (error) {
      console.error('翻转图片失败:', error);
      alert('翻转图片失败: ' + (error as Error).message);
    }
  };

  const handleDownload = async (image: ImageData) => {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <AnimatePresence>
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`apple-card overflow-hidden cursor-pointer group relative ${
              selectedImages.includes(image.id) ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {/* 选择复选框 */}
            <div className="absolute top-3 left-3 z-10">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onImageSelect(image.id);
                }}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedImages.includes(image.id)
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 hover:border-blue-500'
                }`}
              >
                {selectedImages.includes(image.id) && <Check size={14} />}
              </motion.button>
            </div>

            {/* 图片 */}
            <div 
              className="aspect-square overflow-hidden bg-gray-100"
              onClick={() => onImageView(image)}
            >
              <img
                src={image.thumbnailUrl}
                alt={image.original_name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
            </div>

            {/* 悬浮操作按钮 - 只覆盖图片区域 */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
              <div className="flex space-x-2 pointer-events-auto">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageView(image);
                  }}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                >
                  <Eye size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(image);
                  }}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                >
                  <Download size={16} />
                </motion.button>
              </div>
            </div>

            {/* 图片信息 */}
            <div className="p-4">
              {/* 文件名编辑 */}
              {editingNameImage?.id === image.id ? (
                <div className="mb-2">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleNameSave(image.id);
                      }
                    }}
                    onBlur={() => handleNameSave(image.id)}
                    className="w-full text-sm font-medium border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="mb-1 flex items-center justify-between">
                  <h3 
                    className="font-medium text-gray-900 truncate flex-1 cursor-pointer hover:text-blue-600"
                    title={image.original_name}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNameEdit(image);
                    }}
                  >
                    {image.original_name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNameEdit(image);
                    }}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="编辑文件名"
                  >
                    <FileText size={12} />
                  </button>
                </div>
              )}
              
              {/* 描述显示 */}
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-gray-600 truncate flex-1">
                  {image.description || '暂无描述'}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDescriptionEdit(image);
                  }}
                  className="ml-2 p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                  title="编辑描述"
                >
                  <Edit size={12} />
                </button>
              </div>

              {/* 操作按钮行 */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTagManage(image);
                    }}
                    className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="管理标签"
                  >
                    <Tag size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlip(image);
                    }}
                    className="p-1.5 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="水平翻转"
                  >
                    <FlipHorizontal size={12} />
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  <span>{image.width} × {image.height}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-2">
                <span>{formatFileSize(image.file_size)}</span>
              </div>

              {/* 标签显示 */}
              {image.tags && image.tags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {image.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 text-xs rounded-full text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* 分组显示 */}
              {image.groups.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {image.groups.map((group, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {group}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 描述编辑弹窗 */}
      <AnimatePresence>
        {editingImage && (
          <DescriptionModal
            image={editingImage}
            onClose={handleDescriptionModalClose}
            onUpdate={handleDescriptionUpdate}
          />
        )}
      </AnimatePresence>

      {/* 标签管理弹窗 */}
      <AnimatePresence>
        {managingTagsImage && (
          <TagManager
            imageId={managingTagsImage.id}
            currentTags={managingTagsImage.tags || []}
            onClose={handleTagManagerClose}
            onUpdate={handleTagUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageGrid;