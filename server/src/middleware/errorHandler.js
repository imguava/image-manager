// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Multer 错误处理
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: '文件大小超过限制 (50MB)',
      code: 'FILE_TOO_LARGE'
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: '文件数量超过限制 (20个)',
      code: 'TOO_MANY_FILES'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: '不支持的文件类型',
      code: 'INVALID_FILE_TYPE'
    });
  }

  // 数据库错误
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      error: '数据约束错误',
      code: 'CONSTRAINT_ERROR'
    });
  }

  // MinIO 错误
  if (err.code === 'NoSuchBucket') {
    return res.status(500).json({
      error: '存储桶不存在',
      code: 'STORAGE_ERROR'
    });
  }

  // 默认错误
  res.status(500).json({
    error: err.message || '服务器内部错误',
    code: 'INTERNAL_ERROR'
  });
};

module.exports = errorHandler;