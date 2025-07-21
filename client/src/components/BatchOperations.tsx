import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, FlipHorizontal, Download, Trash2, FolderPlus, Settings } from 'lucide-react';
import { Group, BatchOperation } from '../types';
import { imageService } from '../services/imageService';

interface BatchOperationsProps {
  selectedImages: string[];
  groups: Group[];
  onClose: () => void;
  onComplete: () => void;
}

const BatchOperations: React.FC<BatchOperationsProps> = ({
  selectedImages,
  groups,
  onClose,
  onComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'process' | 'organize' | 'export'>('process');
  const [processing, setProcessing] = useState(false);
  
  // 处理参数
  const [resizeMaxSize, setResizeMaxSize] = useState(8000);
  const [convertFormat, setConvertFormat] = useState('original');
  const [convertQuality, setConvertQuality] = useState(80);
  const [includeDescription, setIncludeDescription] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const handleResize = async () => {
    setProcessing(true);
    try {
      const operations: BatchOperation[] = [{
        type: 'resize',
        params: { maxSize: resizeMaxSize }
      }];
      
      await imageService.batchProcessImages(selectedImages, operations);
      onComplete();
    } catch (error) {
      console.error('批量调整大小失败:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleFlip = async () => {
    setProcessing(true);
    try {
      const operations: BatchOperation[] = [{ type: 'flip' }];
      await imageService.batchProcessImages(selectedImages, operations);
      onComplete();
    } catch (error) {
      console.error('批量翻转失败:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleConvert = async () => {
    setProcessing(true);
    try {
      const operations: BatchOperation[] = [{
        type: 'convert',
        params: { format: convertFormat, quality: convertQuality }
      }];
      
      await imageService.batchProcessImages(selectedImages, operations);
      onComplete();
    } catch (error) {
      console.error('批量转换失败:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddToGroup = async () => {
    if (!selectedGroupId) return;
    
    setProcessing(true);
    try {
      await imageService.addImagesToGroup(selectedGroupId, selectedImages);
      onComplete();
    } catch (error) {
      console.error('添加到分组失败:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchDownload = async () => {
    setProcessing(true);
    try {
      await imageService.batchDownloadImages(selectedImages, {
        format: convertFormat === 'original' ? undefined : convertFormat,
        quality: convertQuality,
        size: resizeMaxSize,
        includeDescription: includeDescription
      });
    } catch (error) {
      console.error('批量下载失败:', error);
      alert('批量下载失败: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`确定要删除选中的 ${selectedImages.length} 张图片吗？此操作不可撤销。`)) {
      return;
    }

    setProcessing(true);
    try {
      await imageService.batchDeleteImages(selectedImages);
      onComplete();
    } catch (error) {
      console.error('批量删除失败:', error);
    } finally {
      setProcessing(false);
    }
  };

  const tabs = [
    { id: 'process', label: '图片处理', icon: Settings },
    { id: 'organize', label: '整理分组', icon: FolderPlus },
    { id: 'export', label: '导出下载', icon: Download },
  ];

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
          <div>
            <h2 className="text-xl font-semibold">批量操作</h2>
            <p className="text-sm text-gray-600">已选择 {selectedImages.length} 张图片</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 内容区域 */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'process' && (
              <motion.div
                key="process"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* 调整大小 */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <Maximize2 size={20} className="text-blue-500" />
                    <h3 className="font-medium">调整图片大小</h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">最大边长 (像素)</label>
                      <input
                        type="number"
                        value={resizeMaxSize}
                        onChange={(e) => setResizeMaxSize(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="100"
                        max="4096"
                      />
                    </div>
                    <button
                      onClick={handleResize}
                      disabled={processing}
                      className="apple-button disabled:opacity-50"
                    >
                      调整大小
                    </button>
                  </div>
                </div>

                {/* 水平翻转 */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FlipHorizontal size={20} className="text-green-500" />
                      <div>
                        <h3 className="font-medium">水平翻转</h3>
                        <p className="text-sm text-gray-600">左右镜像翻转图片</p>
                      </div>
                    </div>
                    <button
                      onClick={handleFlip}
                      disabled={processing}
                      className="apple-button disabled:opacity-50"
                    >
                      翻转
                    </button>
                  </div>
                </div>

                {/* 格式转换 */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <Settings size={20} className="text-purple-500" />
                    <h3 className="font-medium">格式转换</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">目标格式</label>
                      <select
                        value={convertFormat}
                        onChange={(e) => setConvertFormat(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="original">原始格式</option>
                        <option value="jpeg">JPEG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">质量 (%)</label>
                      <input
                        type="number"
                        value={convertQuality}
                        onChange={(e) => setConvertQuality(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleConvert}
                    disabled={processing}
                    className="apple-button mt-3 w-full disabled:opacity-50"
                  >
                    转换格式
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'organize' && (
              <motion.div
                key="organize"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* 添加到分组 */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <FolderPlus size={20} className="text-blue-500" />
                    <h3 className="font-medium">添加到分组</h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <select
                        value={selectedGroupId || ''}
                        onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">选择分组</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>
                            {'  '.repeat(group.level)}{group.level > 0 && '└─ '}{group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleAddToGroup}
                      disabled={processing || !selectedGroupId}
                      className="apple-button disabled:opacity-50"
                    >
                      添加
                    </button>
                  </div>
                </div>

                {/* 批量删除 */}
                <div className="p-4 border border-red-200 rounded-xl bg-red-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Trash2 size={20} className="text-red-500" />
                      <div>
                        <h3 className="font-medium text-red-700">删除图片</h3>
                        <p className="text-sm text-red-600">永久删除选中的图片，此操作不可撤销</p>
                      </div>
                    </div>
                    <button
                      onClick={handleBatchDelete}
                      disabled={processing}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'export' && (
              <motion.div
                key="export"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* 批量下载 */}
                <div className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <Download size={20} className="text-green-500" />
                    <h3 className="font-medium">批量下载 ZIP 包</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">下载格式</label>
                      <select
                        value={convertFormat}
                        onChange={(e) => setConvertFormat(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="original">原始格式</option>
                        <option value="jpeg">JPEG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">图片质量 (%)</label>
                      <input
                        type="number"
                        value={convertQuality}
                        onChange={(e) => setConvertQuality(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">最大尺寸 (像素)</label>
                    <input
                      type="number"
                      value={resizeMaxSize}
                      onChange={(e) => setResizeMaxSize(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="100"
                      max="8000"
                      placeholder="不限制尺寸请留空"
                    />
                  </div>
                  <div className="mb-3 flex items-center">
                    <input
                      type="checkbox"
                      id="includeDescription"
                      checked={includeDescription}
                      onChange={(e) => setIncludeDescription(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="includeDescription" className="ml-2 block text-sm text-gray-600">
                      包含描述文件 (同名 .txt 文件)
                    </label>
                  </div>
                  <button
                    onClick={handleBatchDownload}
                    disabled={processing}
                    className="apple-button w-full disabled:opacity-50"
                  >
                    下载 ZIP 包
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    📦 将下载包含图片和同名描述文件的 ZIP 压缩包
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {processing && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>处理中...</span>
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="apple-button-secondary"
            disabled={processing}
          >
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BatchOperations;