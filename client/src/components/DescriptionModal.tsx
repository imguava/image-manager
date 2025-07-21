import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { ImageData } from '../types';
import { imageService } from '../services/imageService';

interface DescriptionModalProps {
  image: ImageData;
  onClose: () => void;
  onUpdate: () => void;
}

const DescriptionModal: React.FC<DescriptionModalProps> = ({
  image,
  onClose,
  onUpdate,
}) => {
  const [description, setDescription] = useState(image.description || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDescription(image.description || '');
  }, [image.description]);

  const handleSave = async () => {
    if (saving) return;
    
    setSaving(true);
    try {
      console.log('保存描述:', { imageId: image.id, description });
      await imageService.updateImageDescription(image.id, description);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('更新描述失败:', error);
      alert('更新描述失败: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">编辑图片描述</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 图片预览 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <img
              src={image.thumbnailUrl}
              alt={image.original_name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate" title={image.original_name}>
                {image.original_name}
              </h3>
              <p className="text-sm text-gray-500">
                {image.width} × {image.height} • {image.format.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* 描述编辑区域 */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            图片描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="为这张图片添加描述..."
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-2">
            提示：按 Ctrl+Enter 快速保存，按 Esc 取消
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end space-x-3 p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={saving}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="apple-button flex items-center space-x-2 disabled:opacity-50"
          >
            <Save size={16} />
            <span>{saving ? '保存中...' : '保存'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DescriptionModal;