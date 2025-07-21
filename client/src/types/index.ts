export interface ImageData {
  id: string;
  filename: string;
  original_name: string;
  description?: string;
  file_size: number;
  width: number;
  height: number;
  format: string;
  thumbnail_path: string;
  original_path: string;
  thumbnailUrl: string;
  originalUrl: string;
  groups: string[];
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  is_system: boolean;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  parent_id?: number | null;
  level: number;
  full_path: string;
  created_at: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface BatchOperation {
  type: 'resize' | 'flip' | 'convert' | 'group' | 'delete';
  params?: {
    maxSize?: number;
    format?: string;
    quality?: number;
    groupId?: number;
  };
}

export interface ProcessingResult {
  originalId: string;
  newId?: string;
  filename?: string;
  success: boolean;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  groupId?: number | null;
}

export interface ImageListResponse {
  images: ImageData[];
  total: number;
  page: number;
  totalPages: number;
}