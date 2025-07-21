import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { X, Upload, File, CheckCircle, AlertCircle, Image, FileText } from 'lucide-react';
import { UploadProgress } from '../types';
import { imageService } from '../services/imageService';

interface UploadModalProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUploadComplete }) => {
  const [files, setFiles] = useState<UploadProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'text/plain': ['.txt']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const filesToUpload = files.filter(f => f.status === 'pending').map(f => f.file);
    setTotalCount(filesToUpload.length);
    setUploadedCount(0);

    try {
      setFiles(prev => prev.map(f => 
        f.status === 'pending' ? { ...f, status: 'uploading' as const } : f
      ));

      await imageService.uploadImages(filesToUpload, (progress) => {
        setFiles(prev => prev.map(f => 
          f.status === 'uploading' ? { ...f, progress } : f
        ));
      });

      setFiles(prev => prev.map(f => 
        f.status === 'uploading' ? { ...f, status: 'success' as const, progress: 100 } : f
      ));

      setUploadedCount(filesToUpload.length);

      setTimeout(() => {
        onUploadComplete();
      }, 1000);

    } catch (error) {
      console.error('上传失败:', error);
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' ? { 
          ...f, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : '上传失败'
        } : f
      ));
    } finally {
      setUploading(false);
    }
  };

  const allSuccess = files.length > 0 && files.every(f => f.status === 'success');

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
          <h2 className="text-xl font-semibold">上传图片</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {/* 拖拽区域 */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {isDragActive ? '放开以上传文件' : '拖拽图片和描述文件到这里'}
            </p>
            <p className="text-gray-500">
              或者 <span className="text-blue-500 font-medium">点击选择文件</span>
            </p>
            <p className="text-sm text-gray-400 mt-2">
              支持 JPEG、PNG、GIF、WebP 格式的图片文件
            </p>
            <p className="text-sm text-gray-400">
              📝 同时上传同名的 .txt 文件可自动添加图片描述
            </p>
            <p className="text-xs text-gray-400 mt-1">
              💡 最多支持同时上传 200 个文件
            </p>
          </div>

          {/* 文件列表 */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-3">待上传文件 ({files.length})</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                <AnimatePresence>
                  {files.map((fileProgress, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {fileProgress.file.type.startsWith('image/') ? (
                        <Image size={20} className="text-blue-500 flex-shrink-0" />
                      ) : fileProgress.file.name.endsWith('.txt') ? (
                        <FileText size={20} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <File size={20} className="text-gray-400 flex-shrink-0" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fileProgress.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileProgress.file.size)}
                        </p>
                        
                        {/* 进度条 */}
                        {fileProgress.status === 'uploading' && (
                          <div className="mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${fileProgress.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* 错误信息 */}
                        {fileProgress.status === 'error' && fileProgress.error && (
                          <p className="text-xs text-red-500 mt-1">
                            {fileProgress.error}
                          </p>
                        )}
                      </div>

                      {/* 状态图标 */}
                      <div className="flex-shrink-0">
                        {fileProgress.status === 'success' && (
                          <CheckCircle size={20} className="text-green-500" />
                        )}
                        {fileProgress.status === 'error' && (
                          <AlertCircle size={20} className="text-red-500" />
                        )}
                        {fileProgress.status === 'pending' && (
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <X size={16} className="text-gray-400" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {files.length > 0 && (
              <div className="flex items-center space-x-4">
                <span>
                  {files.filter(f => f.status === 'success').length} / {files.length} 完成
                </span>
                {uploading && totalCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>上传中 {files.filter(f => f.status === 'success').length}/{totalCount}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="apple-button-secondary"
              disabled={uploading}
            >
              {allSuccess ? '完成' : '取消'}
            </button>
            
            {!allSuccess && (
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="apple-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? '上传中...' : `上传 ${files.filter(f => f.status === 'pending').length} 个文件`}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UploadModal;