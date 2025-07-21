const sharp = require('sharp');

class ImageProcessor {
  // 生成缩略图
  static async generateThumbnail(buffer, width = 300, height = 300) {
    return await sharp(buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  // 调整图片大小
  static async resizeImage(buffer, maxSize) {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    const { width, height } = metadata;
    const maxDimension = Math.max(width, height);
    
    if (maxDimension <= maxSize) {
      return buffer; // 不需要调整
    }
    
    const ratio = maxSize / maxDimension;
    const newWidth = Math.round(width * ratio);
    const newHeight = Math.round(height * ratio);
    
    return await image
      .resize(newWidth, newHeight)
      .toBuffer();
  }

  // 水平翻转
  static async flipHorizontal(buffer) {
    return await sharp(buffer)
      .flop()
      .toBuffer();
  }

  // 转换格式
  static async convertFormat(buffer, format, quality = 80) {
    const image = sharp(buffer);
    
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        return await image.jpeg({ quality }).toBuffer();
      case 'png':
        return await image.png({ quality }).toBuffer();
      case 'webp':
        return await image.webp({ quality }).toBuffer();
      default:
        throw new Error(`不支持的格式: ${format}`);
    }
  }

  // 获取图片信息
  static async getImageInfo(buffer) {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size
    };
  }

  // 批量处理图片
  static async batchProcess(buffers, operations) {
    const results = [];
    
    for (const buffer of buffers) {
      let processedBuffer = buffer;
      
      for (const operation of operations) {
        switch (operation.type) {
          case 'resize':
            processedBuffer = await this.resizeImage(processedBuffer, operation.maxSize);
            break;
          case 'flip':
            processedBuffer = await this.flipHorizontal(processedBuffer);
            break;
          case 'convert':
            processedBuffer = await this.convertFormat(processedBuffer, operation.format, operation.quality);
            break;
        }
      }
      
      results.push(processedBuffer);
    }
    
    return results;
  }
}

module.exports = ImageProcessor;