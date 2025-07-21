// 验证工具函数
class Validator {
  // 验证图片文件
  static validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('不支持的文件类型，只支持 JPEG、PNG、GIF、WebP 格式');
    }

    if (file.size > maxSize) {
      throw new Error('文件大小不能超过 50MB');
    }

    return true;
  }

  // 验证批量操作参数
  static validateBatchOperation(operation) {
    const validTypes = ['resize', 'flip', 'convert', 'group', 'delete'];
    
    if (!validTypes.includes(operation.type)) {
      throw new Error(`不支持的操作类型: ${operation.type}`);
    }

    switch (operation.type) {
      case 'resize':
        if (!operation.params?.maxSize || operation.params.maxSize < 100 || operation.params.maxSize > 4096) {
          throw new Error('调整大小参数无效，最大边长应在 100-4096 像素之间');
        }
        break;
      
      case 'convert':
        const validFormats = ['jpeg', 'jpg', 'png', 'webp'];
        if (!operation.params?.format || !validFormats.includes(operation.params.format)) {
          throw new Error('不支持的转换格式');
        }
        if (operation.params.quality && (operation.params.quality < 1 || operation.params.quality > 100)) {
          throw new Error('质量参数应在 1-100 之间');
        }
        break;
    }

    return true;
  }

  // 验证分组名称
  static validateGroupName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('分组名称不能为空');
    }

    if (name.length > 50) {
      throw new Error('分组名称不能超过 50 个字符');
    }

    if (name.trim() !== name) {
      throw new Error('分组名称不能包含前后空格');
    }

    return true;
  }

  // 验证搜索参数
  static validateSearchParams(params) {
    const { page, limit, search } = params;

    if (page && (isNaN(page) || page < 1)) {
      throw new Error('页码参数无效');
    }

    if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
      throw new Error('每页数量参数无效，应在 1-100 之间');
    }

    if (search && search.length > 100) {
      throw new Error('搜索关键词不能超过 100 个字符');
    }

    return true;
  }
}

module.exports = Validator;