import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Folder, Edit3, Trash2 } from 'lucide-react';
import { Group } from '../types';
import { imageService } from '../services/imageService';

interface GroupManagerProps {
  groups: Group[];
  onClose: () => void;
  onGroupsChange: () => void;
}

const GroupManager: React.FC<GroupManagerProps> = ({
  groups,
  onClose,
  onGroupsChange,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setCreating(true);
    try {
      await imageService.createGroup(newGroupName.trim(), newGroupDescription.trim() || undefined, selectedParentId);
      setNewGroupName('');
      setNewGroupDescription('');
      setSelectedParentId(null);
      setShowCreateForm(false);
      onGroupsChange();
    } catch (error) {
      console.error('创建分组失败:', error);
      alert('创建分组失败: ' + (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN');
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
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">分组管理</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="apple-button flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>新建分组</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* 创建分组表单 */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50"
              >
                <h3 className="font-medium mb-3">创建新分组</h3>
                <form onSubmit={handleCreateGroup} className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">分组名称 *</label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="输入分组名称"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">父分组</label>
                    <select
                      value={selectedParentId || ''}
                      onChange={(e) => setSelectedParentId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">无（顶级分组）</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {'  '.repeat(group.level)}{group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">描述</label>
                    <textarea
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                      placeholder="输入分组描述（可选）"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="submit"
                      disabled={creating || !newGroupName.trim()}
                      className="apple-button disabled:opacity-50"
                    >
                      {creating ? '创建中...' : '创建'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewGroupName('');
                        setNewGroupDescription('');
                      }}
                      className="apple-button-secondary"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 分组列表 */}
          <div className="space-y-3">
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="mx-auto mb-3 text-gray-400" size={48} />
                <p className="text-gray-500 mb-4">还没有创建任何分组</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="apple-button"
                >
                  创建第一个分组
                </button>
              </div>
            ) : (
              <AnimatePresence>
                {groups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Folder className="text-blue-500 mt-1 flex-shrink-0" size={20} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate" style={{ paddingLeft: `${group.level * 20}px` }}>
                            {group.level > 0 && '└─ '}{group.name}
                          </h3>
                          {group.description && (
                            <p className="text-sm text-gray-600 mt-1" style={{ paddingLeft: `${group.level * 20}px` }}>
                              {group.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2" style={{ paddingLeft: `${group.level * 20}px` }}>
                            创建于 {formatDate(group.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 ml-3">
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="编辑分组"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除分组"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            共 {groups.length} 个分组
          </div>

          <button
            onClick={onClose}
            className="apple-button-secondary"
          >
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GroupManager;