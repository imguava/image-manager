import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import ImageGrid from './components/ImageGrid';
import ImageViewer from './components/ImageViewer';
import UploadModal from './components/UploadModal';
import BatchOperations from './components/BatchOperations';
import GroupManager from './components/GroupManager';
import LoginModal from './components/LoginModal';
import { ImageData, Group } from './types';
import { imageService } from './services/imageService';

function App() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBatchOperations, setShowBatchOperations] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 加载图片列表
  const loadImages = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      
      const response = await imageService.getImages({
        search: searchQuery,
        groupId: selectedGroup,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        page,
        limit: 20
      });
      
      if (append) {
        setImages(prev => [...prev, ...response.images]);
      } else {
        setImages(response.images);
      }
      
      setHasMore(response.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('加载图片失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 加载更多图片
  const loadMoreImages = async () => {
    if (!loadingMore && hasMore) {
      await loadImages(currentPage + 1, true);
    }
  };

  // 加载分组列表
  const loadGroups = async () => {
    try {
      const groupsData = await imageService.getGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error('加载分组失败:', error);
    }
  };

  useEffect(() => {
    loadImages();
    loadGroups();
  }, [searchQuery, selectedGroup, selectedTags]);

  // 滚动监听，实现无限滚动
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 && // 提前1000px开始加载
        !loadingMore && hasMore
      ) {
        loadMoreImages();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, currentPage]);

  // 处理图片选择
  const handleImageSelect = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  // 处理全选
  const handleSelectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map(img => img.id));
    }
  };

  // 处理上传完成
  const handleUploadComplete = () => {
    setShowUploadModal(false);
    loadImages();
  };

  // 处理批量操作完成
  const handleBatchOperationComplete = () => {
    setSelectedImages([]);
    loadImages();
  };

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // 处理登录
  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '登录失败');
      }

      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data.user));
      setIsLoggedIn(true);
      setShowLoginModal(false);
    } catch (error) {
      throw error;
    }
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      setIsLoggedIn(false);
      setSelectedImages([]);
    }
  };

  // 需要登录的操作检查
  const requireAuth = (callback: () => void) => {
    if (isLoggedIn) {
      callback();
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCount={selectedImages.length}
        totalCount={images.length}
        onSelectAll={handleSelectAll}
        onUpload={() => requireAuth(() => setShowUploadModal(true))}
        onBatchOperations={() => requireAuth(() => setShowBatchOperations(true))}
        onGroupManager={() => requireAuth(() => setShowGroupManager(true))}
        isLoggedIn={isLoggedIn}
        onLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        groups={groups}
        selectedGroup={selectedGroup}
        onGroupSelect={setSelectedGroup}
        selectedTags={selectedTags}
        onTagSelect={setSelectedTags}
      />

      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-64"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ImageGrid
                images={images}
                selectedImages={selectedImages}
                onImageSelect={handleImageSelect}
                onImageView={setCurrentImage}
                onImageUpdate={loadImages}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 加载更多提示 */}
        {loadingMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-8"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">加载更多图片...</span>
          </motion.div>
        )}

        {/* 没有更多数据提示 */}
        {!hasMore && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <p className="text-gray-500">已加载全部图片</p>
          </motion.div>
        )}

        {/* 空状态提示 */}
        {images.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              还没有图片
            </h3>
            <p className="text-gray-500 mb-6">
              上传一些图片开始管理您的图片库
            </p>
            <button
              onClick={() => requireAuth(() => setShowUploadModal(true))}
              className="apple-button"
            >
              上传图片
            </button>
          </motion.div>
        )}
      </main>

      {/* 图片查看器 */}
      <AnimatePresence>
        {currentImage && (
          <ImageViewer
            image={currentImage}
            onClose={() => setCurrentImage(null)}
            onNext={() => {
              const currentIndex = images.findIndex(img => img.id === currentImage.id);
              const nextIndex = (currentIndex + 1) % images.length;
              setCurrentImage(images[nextIndex]);
            }}
            onPrevious={() => {
              const currentIndex = images.findIndex(img => img.id === currentImage.id);
              const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
              setCurrentImage(images[prevIndex]);
            }}
            onImageUpdate={loadImages}
          />
        )}
      </AnimatePresence>

      {/* 上传模态框 */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onUploadComplete={handleUploadComplete}
          />
        )}
      </AnimatePresence>

      {/* 批量操作面板 */}
      <AnimatePresence>
        {showBatchOperations && selectedImages.length > 0 && (
          <BatchOperations
            selectedImages={selectedImages}
            groups={groups}
            onClose={() => setShowBatchOperations(false)}
            onComplete={handleBatchOperationComplete}
          />
        )}
      </AnimatePresence>

      {/* 分组管理器 */}
      <AnimatePresence>
        {showGroupManager && (
          <GroupManager
            groups={groups}
            onClose={() => setShowGroupManager(false)}
            onGroupsChange={loadGroups}
          />
        )}
      </AnimatePresence>

      {/* 登录模态框 */}
      <AnimatePresence>
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onLogin={handleLogin}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;