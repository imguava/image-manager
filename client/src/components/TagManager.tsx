import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag as TagIcon, Check } from 'lucide-react';
import { Tag } from '../types';
import { imageService } from '../services/imageService';

interface TagManagerProps {
  imageId: string;
  currentTags: Tag[];
  onClose: () => void;
  onUpdate: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({
  imageId,
  currentTags,
  onClose,
  onUpdate,
}) => {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTags();
    setSelectedTagIds(currentTags.map(tag => tag.id));
  }, [currentTags]);

  const loadTags = async () => {
    try {
      const tags = await imageService.getTags();
      setAllTags(tags);
    } catch (error) {
      console.error('加载标签失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 找出需要添加和移除的标签
      const currentTagIds = currentTags.map(tag => tag.id);
      const toAdd = selectedTagIds.filter(id => !currentTagIds.includes(id));
      const toRemove = currentTagIds.filter(id => !selectedTagIds.includes(id));

      // 添加新标签
      if (toAdd.length > 0) {
        await imageService.addTagsToImage(imageId, toAdd);
      }

      // 移除标签
      for (const tagId of toRemove) {
        await imageService.removeTagFromImage(imageId, tagId);
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('保存标签失败:', error);
      alert('保存标签失败: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // 按类别分组标签
  const systemTags = allTags.filter(tag => tag.is_system);
  const userTags = allTags.filter(tag => !tag.is_system);

  const renderTagGroup = (tags: Tag[], title: string) => (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <motion.button
            key={tag.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTagToggle(tag.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
              selectedTagIds.includes(tag.id)
                ? 'text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : undefined
            }}
          >
            <span>{tag.name}</span>
            {selectedTagIds.includes(tag.id) && <Check size={12} />}
          </motion.button>
        ))}
      </div>
    </div>
  );

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
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <TagIcon size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">管理标签</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {renderTagGroup(systemTags, '系统标签')}
              {userTags.length > 0 && renderTagGroup(userTags, '自定义标签')}
            </>
          )}
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            已选择 {selectedTagIds.length} 个标签
          </div>
          
          <div className="flex space-x-3">
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
              className="apple-button disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TagManager;