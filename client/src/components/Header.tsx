import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Upload, Settings, Grid, CheckSquare, Square, Tag, User, LogOut } from 'lucide-react';
import { Group, Tag as TagType } from '../types';
import { imageService } from '../services/imageService';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onUpload: () => void;
  onBatchOperations: () => void;
  onGroupManager: () => void;
  groups: Group[];
  selectedGroup: number | null;
  onGroupSelect: (groupId: number | null) => void;
  selectedTags: number[];
  onTagSelect: (tagIds: number[]) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCount,
  totalCount,
  onSelectAll,
  onUpload,
  onBatchOperations,
  onGroupManager,
  groups,
  selectedGroup,
  onGroupSelect,
  selectedTags,
  onTagSelect,
  isLoggedIn,
  onLogin,
  onLogout,
}) => {
  const [tags, setTags] = useState<TagType[]>([]);
  const [showTagFilter, setShowTagFilter] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const allTags = await imageService.getTags();
      setTags(allTags);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const handleTagToggle = (tagId: number) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    onTagSelect(newSelectedTags);
  };
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass-effect border-b border-gray-200"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">图片管理器</h1>
            <div className="text-sm text-gray-500">
              {selectedCount > 0 ? `已选择 ${selectedCount} 张` : `共 ${totalCount} 张图片`}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onUpload}
              className="apple-button flex items-center space-x-2"
            >
              <Upload size={18} />
              <span>上传图片</span>
            </button>

            {selectedCount > 0 && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={onBatchOperations}
                className="apple-button-secondary flex items-center space-x-2"
              >
                <Settings size={18} />
                <span>批量操作</span>
              </motion.button>
            )}

            <button
              onClick={onGroupManager}
              className="apple-button-secondary flex items-center space-x-2"
            >
              <Grid size={18} />
              <span>分组管理</span>
            </button>

            {/* 登录状态 */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-full">
                  <User size={16} className="text-green-600" />
                  <span className="text-sm text-green-700">
                    {(() => {
                      try {
                        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                        return userInfo.username || '已登录';
                      } catch {
                        return '已登录';
                      }
                    })()}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  title="登出"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="apple-button-secondary flex items-center space-x-2"
              >
                <User size={18} />
                <span>登录</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索图片..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 分组筛选 */}
            <select
              value={selectedGroup || ''}
              onChange={(e) => onGroupSelect(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">所有分组</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {'  '.repeat(group.level)}{group.level > 0 && '└─ '}{group.name}
                </option>
              ))}
            </select>

            {/* 标签筛选 */}
            <div className="relative">
              <button
                onClick={() => setShowTagFilter(!showTagFilter)}
                className={`px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center space-x-2 ${
                  selectedTags.length > 0 ? 'bg-blue-50 border-blue-300' : ''
                }`}
              >
                <Tag size={16} />
                <span>标签筛选</span>
                {selectedTags.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {selectedTags.length}
                  </span>
                )}
              </button>

              {/* 标签下拉菜单 */}
              {showTagFilter && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">选择标签</h3>
                    <button
                      onClick={() => setShowTagFilter(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => handleTagToggle(tag.id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                            selectedTags.includes(tag.id)
                              ? 'text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          style={{
                            backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined
                          }}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedTags.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => onTagSelect([])}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        清除所有标签筛选
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 全选按钮 */}
          {totalCount > 0 && (
            <button
              onClick={onSelectAll}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {selectedCount === totalCount ? (
                <CheckSquare size={20} className="text-blue-500" />
              ) : (
                <Square size={20} />
              )}
              <span className="text-sm">
                {selectedCount === totalCount ? '取消全选' : '全选'}
              </span>
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;