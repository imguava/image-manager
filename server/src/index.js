const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const imageRoutes = require('./routes/images');
const { router: authRoutes } = require('./routes/auth');
const { initDatabase } = require('./database/init');
const { initMinio } = require('./storage/minio');

const app = express();
const PORT = process.env.PORT || 3002;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 初始化数据库和存储
async function initializeApp() {
  try {
    await initDatabase();
    await initMinio();
    console.log('数据库和存储初始化完成');
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: '图片管理系统运行正常' });
});

// 启动服务器
initializeApp().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
});