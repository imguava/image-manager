const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

const bucketName = process.env.MINIO_BUCKET || 'images';

const initMinio = async () => {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`MinIO bucket '${bucketName}' 创建成功`);
    } else {
      console.log(`MinIO bucket '${bucketName}' 已存在`);
    }
  } catch (error) {
    console.error('MinIO 初始化失败:', error);
    throw error;
  }
};

const uploadFile = async (objectName, buffer, metadata = {}) => {
  try {
    await minioClient.putObject(bucketName, objectName, buffer, metadata);
    return `${bucketName}/${objectName}`;
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
};

const getFileUrl = (objectName) => {
  return minioClient.presignedGetObject(bucketName, objectName, 24 * 60 * 60); // 24小时有效
};

const deleteFile = async (objectName) => {
  try {
    await minioClient.removeObject(bucketName, objectName);
  } catch (error) {
    console.error('文件删除失败:', error);
    throw error;
  }
};

module.exports = {
  minioClient,
  bucketName,
  initMinio,
  uploadFile,
  getFileUrl,
  deleteFile
};