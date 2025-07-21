import axios from 'axios';
import { ImageData, Group, BatchOperation } from '../types';

const API_BASE = '/api';

// 添加请求拦截器，自动添加认证头
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 添加响应拦截器，处理认证错误
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并刷新页面
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

class ImageService {
  // 获取图片列表
  async getImages(params: {
    search?: string;
    page?: number;
    limit?: number;
    groupId?: number | null;
    tagIds?: number[];
  } = {}): Promise<{ images: ImageData[]; total: number; hasMore: boolean; page: number; totalPages: number }> {
    const response = await axios.get(`${API_BASE}/images`, { params });
    return response.data;
  }

  // 上传图片
  async uploadImages(files: File[], onProgress?: (progress: number) => void): Promise<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await axios.post(`${API_BASE}/images/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // 更新图片描述
  async updateImageDescription(imageId: string, description: string): Promise<void> {
    await axios.put(`${API_BASE}/images/${imageId}/description`, { description });
  }

  // 获取分组列表
  async getGroups(): Promise<Group[]> {
    const response = await axios.get(`${API_BASE}/images/groups`);
    return response.data;
  }

  // 创建分组
  async createGroup(name: string, description?: string, parentId?: number | null): Promise<Group> {
    const response = await axios.post(`${API_BASE}/images/groups`, { name, description, parentId });
    return response.data;
  }

  // 添加图片到分组
  async addImagesToGroup(groupId: number, imageIds: string[]): Promise<void> {
    await axios.post(`${API_BASE}/images/groups/${groupId}/images`, { imageIds });
  }

  // 批量处理图片
  async batchProcessImages(imageIds: string[], operations: BatchOperation[]): Promise<any> {
    const response = await axios.post(`${API_BASE}/images/batch-process`, {
      imageIds,
      operations,
    });
    return response.data;
  }

  // 批量删除图片
  async batchDeleteImages(imageIds: string[]): Promise<any> {
    const response = await axios.delete(`${API_BASE}/images/batch`, {
      data: { imageIds },
    });
    return response.data;
  }

  // 下载图片
  async downloadImage(imageId: string, format?: string, quality?: number): Promise<Blob> {
    const params = new URLSearchParams();
    if (format) params.append('format', format);
    if (quality) params.append('quality', quality.toString());

    const response = await axios.get(`${API_BASE}/images/${imageId}/download?${params}`, {
      responseType: 'blob',
    });

    return response.data;
  }

  // 批量下载图片和描述文件为ZIP
  async batchDownloadImages(imageIds: string[], options: {
    format?: string;
    quality?: number;
    size?: number;
    includeDescription?: boolean;
  } = {}): Promise<void> {
    try {
      const response = await axios.post(`${API_BASE}/images/batch-download`, {
        imageIds,
        ...options
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `images_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('批量下载失败:', error);
      throw error;
    }
  }

  // 更新图片名称
  async updateImageName(imageId: string, name: string): Promise<void> {
    await axios.put(`${API_BASE}/images/${imageId}/name`, { name });
  }

  // 获取所有标签
  async getTags(): Promise<any[]> {
    const response = await axios.get(`${API_BASE}/images/tags`);
    return response.data;
  }

  // 为图片添加标签
  async addTagsToImage(imageId: string, tagIds: number[]): Promise<void> {
    await axios.post(`${API_BASE}/images/${imageId}/tags`, { tagIds });
  }

  // 移除图片标签
  async removeTagFromImage(imageId: string, tagId: number): Promise<void> {
    await axios.delete(`${API_BASE}/images/${imageId}/tags/${tagId}`);
  }

  // 翻转图片
  async flipImage(imageId: string, direction: string = 'horizontal'): Promise<any> {
    const response = await axios.post(`${API_BASE}/images/${imageId}/flip`, { direction });
    return response.data;
  }
}

export const imageService = new ImageService();