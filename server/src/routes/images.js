const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const archiver = require('archiver');

const { query } = require('../database/init');
const { uploadFile, getFileUrl, deleteFile } = require('../storage/minio');
const ImageProcessor = require('../utils/imageProcessor');
const { authenticateToken } = require('./auth');

const router = express.Router();

// 根据分辨率获取标签
function getResolutionTag(width, height) {
  const maxDimension = Math.max(width, height);
  if (maxDimension >= 7680) return '8K';
  if (maxDimension >= 6144) return '7K';
  if (maxDimension >= 5120) return '6K';
  if (maxDimension >= 4096) return '5K';
  if (maxDimension >= 3072) return '4K';
  if (maxDimension >= 2048) return '3K';
  if (maxDimension >= 1536) return '2K';
  if (maxDimension >= 1024) return '1K';
  return null;
}

// 配置 multer 用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    // 修复中文文件名编码问题
    if (file.originalname) {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    }

    const extname = path.extname(file.originalname).toLowerCase();

    // 检查是否为支持的图片格式
    const isImage = ['.jpeg', '.jpg', '.png', '.gif', '.webp'].includes(extname);

    // 检查是否为txt文件（放宽MIME类型检查）
    const isText = extname === '.txt';

    if (isImage || isText) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件 (jpeg, jpg, png, gif, webp) 和描述文件 (txt)'));
    }
  }
});

// 批量上传图片
router.post('/upload', authenticateToken, upload.array('files', 200), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    // 分离图片文件和描述文件
    const imageFiles = [];
    const descriptionFiles = new Map(); // key: 文件名(不含扩展名), value: 描述内容

    for (const file of files) {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const baseName = path.parse(file.originalname).name;

      if (['.jpeg', '.jpg', '.png', '.gif', '.webp'].includes(fileExtension)) {
        imageFiles.push(file);
      } else if (fileExtension === '.txt') {
        // 读取txt文件内容作为描述
        const description = file.buffer.toString('utf8').trim();
        descriptionFiles.set(baseName, description);
      }
    }

    if (imageFiles.length === 0) {
      return res.status(400).json({ error: '没有找到有效的图片文件' });
    }

    const results = [];

    for (const file of imageFiles) {
      const imageId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const baseName = path.parse(file.originalname).name;
      const filename = `${imageId}${fileExtension}`;
      const thumbnailFilename = `thumb_${filename}`;

      // 获取对应的描述文件内容
      const description = descriptionFiles.get(baseName) || null;

      // 获取图片信息
      const imageInfo = await ImageProcessor.getImageInfo(file.buffer);

      // 生成缩略图
      const thumbnailBuffer = await ImageProcessor.generateThumbnail(file.buffer);

      // 上传原图和缩略图到 MinIO
      const originalPath = await uploadFile(`originals/${filename}`, file.buffer);
      const thumbnailPath = await uploadFile(`thumbnails/${thumbnailFilename}`, thumbnailBuffer);

      // 保存到数据库，包含描述
      await query(`
        INSERT INTO images (id, filename, original_name, description, file_size, width, height, format, thumbnail_path, original_path)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        imageId,
        filename,
        file.originalname,
        description,
        file.size,
        imageInfo.width,
        imageInfo.height,
        imageInfo.format,
        thumbnailPath,
        originalPath
      ]);

      // 自动添加分辨率标签
      const resolutionTag = getResolutionTag(imageInfo.width, imageInfo.height);
      if (resolutionTag) {
        const tagResult = await query('SELECT id FROM image_tags WHERE name = $1', [resolutionTag]);
        if (tagResult.rows.length > 0) {
          await query(
            'INSERT INTO image_tag_relations (image_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [imageId, tagResult.rows[0].id]
          );
        }
      }

      results.push({
        id: imageId,
        filename: file.originalname,
        size: file.size,
        dimensions: `${imageInfo.width}x${imageInfo.height}`,
        format: imageInfo.format,
        description: description,
        hasDescription: !!description
      });
    }

    const imageCount = results.length;
    const descriptionCount = results.filter(r => r.hasDescription).length;

    res.json({
      message: `成功上传 ${imageCount} 张图片${descriptionCount > 0 ? `，其中 ${descriptionCount} 张包含描述` : ''}`,
      images: results
    });

  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ error: '上传失败: ' + error.message });
  }
});

// 获取图片列表
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 20, groupId, tagIds } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(i.original_name ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex + 1})`);
      params.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }

    if (groupId && groupId !== 'null' && groupId !== '') {
      conditions.push(`igr.group_id = $${paramIndex}`);
      params.push(parseInt(groupId));
      paramIndex++;
    }

    if (tagIds && tagIds.length > 0) {
      const tagIdArray = Array.isArray(tagIds) ? tagIds : [tagIds];
      const tagPlaceholders = tagIdArray.map(() => `$${paramIndex++}`).join(',');
      conditions.push(`itr.tag_id IN (${tagPlaceholders})`);
      params.push(...tagIdArray.map(id => parseInt(id)));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countQuery = `
      SELECT COUNT(DISTINCT i.id) as total
      FROM images i
      LEFT JOIN image_group_relations igr ON i.id = igr.image_id
      LEFT JOIN image_groups ig ON igr.group_id = ig.id
      LEFT JOIN image_tag_relations itr ON i.id = itr.image_id
      LEFT JOIN image_tags it ON itr.tag_id = it.id
      ${whereClause}
    `;

    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // 获取图片列表
    const listQuery = `
      SELECT i.*, 
             STRING_AGG(DISTINCT ig.name, ',') as groups,
             COALESCE(
               JSONB_AGG(
                 DISTINCT JSONB_BUILD_OBJECT(
                   'id', it.id, 
                   'name', it.name, 
                   'color', it.color, 
                   'is_system', it.is_system
                 )
               ) FILTER (WHERE it.id IS NOT NULL),
               '[]'::jsonb
             ) as tags
      FROM images i
      LEFT JOIN image_group_relations igr ON i.id = igr.image_id
      LEFT JOIN image_groups ig ON igr.group_id = ig.id
      LEFT JOIN image_tag_relations itr ON i.id = itr.image_id
      LEFT JOIN image_tags it ON itr.tag_id = it.id
      ${whereClause}
      GROUP BY i.id, i.filename, i.original_name, i.description, i.file_size, i.width, i.height, i.format, i.thumbnail_path, i.original_path, i.created_at, i.updated_at
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit), offset);
    const result = await query(listQuery, params);

    // 为每张图片生成预签名URL
    const images = await Promise.all(result.rows.map(async (row) => {
      const thumbnailUrl = await getFileUrl(`thumbnails/thumb_${row.filename}`);
      const originalUrl = await getFileUrl(`originals/${row.filename}`);

      return {
        ...row,
        thumbnailUrl,
        originalUrl,
        groups: row.groups ? row.groups.split(',') : [],
        tags: Array.isArray(row.tags) ? row.tags : []
      };
    }));

    res.json({
      images,
      total,
      page: parseInt(page),
      totalPages,
      hasMore: page < totalPages
    });

  } catch (error) {
    console.error('获取图片列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新图片描述
router.put('/:id/description', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    console.log('更新图片描述:', { id, description });

    const result = await query(
      'UPDATE images SET description = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [description, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '图片不存在' });
    }

    res.json({ message: '描述更新成功', description });
  } catch (error) {
    console.error('更新描述失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新图片名称
router.put('/:id/name', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: '图片名称不能为空' });
    }

    const result = await query(
      'UPDATE images SET original_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [name.trim(), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '图片不存在' });
    }

    res.json({ message: '图片名称更新成功', name: name.trim() });
  } catch (error) {
    console.error('更新图片名称失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取所有标签
router.get('/tags', async (req, res) => {
  try {
    const result = await query('SELECT * FROM image_tags ORDER BY is_system DESC, name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('获取标签失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 为图片添加标签
router.post('/:id/tags', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tagIds } = req.body;

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: '请提供标签ID列表' });
    }

    // 使用事务批量插入
    const client = await require('../database/init').pool.connect();
    try {
      await client.query('BEGIN');

      for (const tagId of tagIds) {
        await client.query(
          'INSERT INTO image_tag_relations (image_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, parseInt(tagId)]
        );
      }

      await client.query('COMMIT');
      res.json({ message: `成功为图片添加 ${tagIds.length} 个标签` });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('添加标签失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 移除图片标签
router.delete('/:id/tags/:tagId', authenticateToken, async (req, res) => {
  try {
    const { id, tagId } = req.params;

    const result = await query(
      'DELETE FROM image_tag_relations WHERE image_id = $1 AND tag_id = $2',
      [id, parseInt(tagId)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '标签关联不存在' });
    }

    res.json({ message: '标签移除成功' });
  } catch (error) {
    console.error('移除标签失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 批量下载图片和描述文件
router.post('/batch-download', authenticateToken, async (req, res) => {
  try {
    const {
      imageIds,
      format = 'original',
      quality = 80,
      size = 8000,
      includeDescription = true
    } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: '请选择要下载的图片' });
    }

    // 设置响应头
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="images.zip"');

    // 创建 zip 压缩流
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const imageId of imageIds) {
      try {
        // 获取图片信息
        const result = await query('SELECT * FROM images WHERE id = $1', [imageId]);
        const image = result.rows[0];

        if (!image) continue;

        // 获取原图
        const originalUrl = await getFileUrl(`originals/${image.filename}`);
        const response = await fetch(originalUrl);
        let buffer = Buffer.from(await response.arrayBuffer());

        // 处理图片
        if (size) {
          buffer = await ImageProcessor.resizeImage(buffer, parseInt(size));
        }

        if (format !== 'original' && format !== image.format) {
          buffer = await ImageProcessor.convertFormat(buffer, format, parseInt(quality));
        }

        // 确定文件名
        const fileExtension = format === 'original' ? path.extname(image.original_name) : `.${format}`;
        const baseName = path.parse(image.original_name).name;
        const imageFileName = `${baseName}${fileExtension}`;

        // 添加图片到 zip
        archive.append(buffer, { name: imageFileName });

        // 如果有描述且用户选择包含描述文件，创建同名的 txt 文件
        if (includeDescription && image.description && image.description.trim()) {
          const txtFileName = `${baseName}.txt`;
          archive.append(image.description, { name: txtFileName });
        }

      } catch (error) {
        console.error(`处理图片 ${imageId} 失败:`, error);
      }
    }

    archive.finalize();

  } catch (error) {
    console.error('批量下载失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 图片翻转功能
router.post('/:id/flip', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { direction = 'horizontal' } = req.body;

    // 获取原图信息
    const result = await query('SELECT * FROM images WHERE id = $1', [id]);
    const image = result.rows[0];

    if (!image) {
      return res.status(404).json({ error: '图片不存在' });
    }

    // 从 MinIO 获取原图
    const originalUrl = await getFileUrl(`originals/${image.filename}`);
    const response = await fetch(originalUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    // 翻转图片
    const flippedBuffer = await ImageProcessor.flipHorizontal(buffer);

    // 生成新的文件名
    const fileExtension = path.extname(image.original_name);
    const baseName = path.parse(image.original_name).name;
    const newOriginalName = `flip_${image.original_name}`;
    const newImageId = uuidv4();
    const newFilename = `${newImageId}${fileExtension}`;
    const newThumbnailFilename = `thumb_${newFilename}`;

    // 生成新缩略图
    const newThumbnailBuffer = await ImageProcessor.generateThumbnail(flippedBuffer);

    // 上传翻转后的图片
    const newOriginalPath = await uploadFile(`originals/${newFilename}`, flippedBuffer);
    const newThumbnailPath = await uploadFile(`thumbnails/${newThumbnailFilename}`, newThumbnailBuffer);

    // 获取新图片信息
    const newImageInfo = await ImageProcessor.getImageInfo(flippedBuffer);

    // 保存新图片到数据库
    await query(`
      INSERT INTO images (id, filename, original_name, description, file_size, width, height, format, thumbnail_path, original_path)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      newImageId,
      newFilename,
      newOriginalName,
      image.description,
      flippedBuffer.length,
      newImageInfo.width,
      newImageInfo.height,
      newImageInfo.format,
      newThumbnailPath,
      newOriginalPath
    ]);

    // 复制原图的分组关系
    await query(`
      INSERT INTO image_group_relations (image_id, group_id)
      SELECT $1, group_id FROM image_group_relations WHERE image_id = $2
    `, [newImageId, id]);

    // 复制原图的标签关系
    await query(`
      INSERT INTO image_tag_relations (image_id, tag_id)
      SELECT $1, tag_id FROM image_tag_relations WHERE image_id = $2
    `, [newImageId, id]);

    // 添加"水平翻转"标签
    const flipTagResult = await query('SELECT id FROM image_tags WHERE name = $1', ['水平翻转']);
    let flipTagId;

    if (flipTagResult.rows.length === 0) {
      // 如果标签不存在，创建它
      const newTagResult = await query(
        'INSERT INTO image_tags (name, color, is_system) VALUES ($1, $2, $3) RETURNING id',
        ['水平翻转', '#9333EA', true]
      );
      flipTagId = newTagResult.rows[0].id;
    } else {
      flipTagId = flipTagResult.rows[0].id;
    }

    // 添加水平翻转标签到新图片
    await query(
      'INSERT INTO image_tag_relations (image_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [newImageId, flipTagId]
    );

    res.json({
      message: '图片翻转成功',
      newImageId,
      originalName: newOriginalName
    });

  } catch (error) {
    console.error('图片翻转失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建分组
router.post('/groups', authenticateToken, async (req, res) => {
  try {
    const { name, description, parentId } = req.body;

    if (!name) {
      return res.status(400).json({ error: '分组名称不能为空' });
    }

    const result = await query(
      'INSERT INTO image_groups (name, description, parent_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, parentId || null]
    );

    const newGroup = result.rows[0];
    res.json({
      ...newGroup,
      message: '分组创建成功'
    });
  } catch (error) {
    console.error('创建分组失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取所有分组（树形结构）
router.get('/groups', async (req, res) => {
  try {
    const result = await query(`
      WITH RECURSIVE group_tree AS (
        SELECT id, name, description, parent_id, created_at, 0 as level, 
               ARRAY[id] as path, CAST(name AS VARCHAR) as full_path
        FROM image_groups 
        WHERE parent_id IS NULL
        
        UNION ALL
        
        SELECT g.id, g.name, g.description, g.parent_id, g.created_at, gt.level + 1,
               gt.path || g.id, CAST(gt.full_path || ' / ' || g.name AS VARCHAR) as full_path
        FROM image_groups g
        JOIN group_tree gt ON g.parent_id = gt.id
      )
      SELECT * FROM group_tree ORDER BY path
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('获取分组失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 批量添加图片到分组
router.post('/groups/:groupId/images', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { imageIds } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: '请提供图片ID列表' });
    }

    // 使用事务批量插入
    const client = await require('../database/init').pool.connect();
    try {
      await client.query('BEGIN');

      for (const imageId of imageIds) {
        await client.query(
          'INSERT INTO image_group_relations (image_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [imageId, parseInt(groupId)]
        );
      }

      await client.query('COMMIT');
      res.json({ message: `成功将 ${imageIds.length} 张图片添加到分组` });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('添加到分组失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 批量处理图片
router.post('/batch-process', authenticateToken, async (req, res) => {
  try {
    const { imageIds, operations } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: '请选择要处理的图片' });
    }

    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({ error: '请指定处理操作' });
    }

    const results = [];

    for (const imageId of imageIds) {
      try {
        // 获取图片信息
        const result = await query('SELECT * FROM images WHERE id = $1', [imageId]);
        const image = result.rows[0];

        if (!image) {
          results.push({ imageId, error: '图片不存在' });
          continue;
        }

        // 从 MinIO 获取原图
        const originalUrl = await getFileUrl(`originals/${image.filename}`);
        const response = await fetch(originalUrl);
        const buffer = Buffer.from(await response.arrayBuffer());

        // 处理图片
        const processedBuffers = await ImageProcessor.batchProcess([buffer], operations);
        const processedBuffer = processedBuffers[0];

        // 生成新的文件名
        const timestamp = Date.now();
        const newFilename = `processed_${timestamp}_${image.filename}`;
        const newThumbnailFilename = `thumb_${newFilename}`;

        // 生成新缩略图
        const newThumbnailBuffer = await ImageProcessor.generateThumbnail(processedBuffer);

        // 上传处理后的图片
        const newOriginalPath = await uploadFile(`originals/${newFilename}`, processedBuffer);
        const newThumbnailPath = await uploadFile(`thumbnails/${newThumbnailFilename}`, newThumbnailBuffer);

        // 获取新图片信息
        const newImageInfo = await ImageProcessor.getImageInfo(processedBuffer);

        // 保存新图片到数据库
        const newImageId = uuidv4();
        await query(`
          INSERT INTO images (id, filename, original_name, description, file_size, width, height, format, thumbnail_path, original_path)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          newImageId,
          newFilename,
          `processed_${image.original_name}`,
          `${image.description || ''} (已处理)`,
          processedBuffer.length,
          newImageInfo.width,
          newImageInfo.height,
          newImageInfo.format,
          newThumbnailPath,
          newOriginalPath
        ]);

        results.push({
          originalId: imageId,
          newId: newImageId,
          filename: newFilename,
          success: true
        });

      } catch (error) {
        results.push({
          imageId,
          error: error.message
        });
      }
    }

    res.json({
      message: '批量处理完成',
      results
    });

  } catch (error) {
    console.error('批量处理失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 批量删除图片
router.delete('/batch', authenticateToken, async (req, res) => {
  try {
    const { imageIds } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: '请选择要删除的图片' });
    }

    const results = [];

    for (const imageId of imageIds) {
      try {
        // 获取图片信息
        const result = await query('SELECT * FROM images WHERE id = $1', [imageId]);
        const image = result.rows[0];

        if (!image) {
          results.push({ imageId, error: '图片不存在' });
          continue;
        }

        // 从 MinIO 删除文件
        await deleteFile(`originals/${image.filename}`);
        await deleteFile(`thumbnails/thumb_${image.filename}`);

        // 从数据库删除记录（关联记录会因为外键约束自动删除）
        await query('DELETE FROM images WHERE id = $1', [imageId]);

        results.push({ imageId, success: true });

      } catch (error) {
        results.push({ imageId, error: error.message });
      }
    }

    res.json({
      message: '批量删除完成',
      results
    });

  } catch (error) {
    console.error('批量删除失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 下载图片
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const { format, quality } = req.query;

    // 获取图片信息
    const result = await query('SELECT * FROM images WHERE id = $1', [id]);
    const image = result.rows[0];

    if (!image) {
      return res.status(404).json({ error: '图片不存在' });
    }

    // 获取原图URL
    const originalUrl = await getFileUrl(`originals/${image.filename}`);
    const response = await fetch(originalUrl);
    let buffer = Buffer.from(await response.arrayBuffer());

    // 如果指定了格式转换
    if (format && format !== image.format) {
      buffer = await ImageProcessor.convertFormat(buffer, format, quality ? parseInt(quality) : 80);
    }

    // 设置下载头，处理中文文件名
    const downloadFilename = format ?
      `${path.parse(image.original_name).name}.${format}` :
      image.original_name;

    // 处理中文文件名编码
    const encodedFilename = encodeURIComponent(downloadFilename);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', `image/${format || image.format}`);
    res.send(buffer);

  } catch (error) {
    console.error('下载失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;