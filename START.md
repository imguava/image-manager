# 🚀 图片管理系统 - 快速启动指南

## 📋 前置条件检查

确保以下服务正在运行：
- ✅ PostgreSQL 数据库 (172.10.10.22:5432)
- ✅ MinIO 对象存储 (172.10.10.22:9000)

## 🔧 第一步：安装依赖

```bash
# 1. 安装根目录依赖
npm install

# 2. 安装所有项目依赖（前端+后端）
npm run install:all
```

## 🗄️ 第二步：准备数据库

连接到 PostgreSQL 并创建数据库：

```bash
# 使用 psql 连接
psql -h 172.10.10.22 -p 5432 -U postgres

# 在 psql 中执行
CREATE DATABASE image_manager;
\q
```

## 🧪 第三步：测试连接

```bash
# 进入服务器目录
cd server

# 测试数据库和 MinIO 连接
npm run test:connections
```

如果看到以下输出说明连接成功：
```
✅ PostgreSQL 连接成功!
✅ MinIO 连接成功!
```

## 🚀 第四步：启动应用

### 方式一：同时启动前后端（推荐）
```bash
# 在项目根目录执行
npm run dev
```

### 方式二：分别启动
```bash
# 终端1 - 启动后端
cd server
npm run dev

# 终端2 - 启动前端
cd client
npm run dev
```

## 🌐 第五步：访问应用

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001
- **健康检查**: http://localhost:3001/health

## ✅ 功能验证

启动成功后测试以下功能：

1. **上传图片** 📸
   - 点击"上传图片"按钮
   - 拖拽图片文件到上传区域
   - 支持 JPEG、PNG、GIF、WebP 格式

2. **浏览图片** 🖼️
   - 查看缩略图网格
   - 点击图片查看原图
   - 使用左右箭头键切换图片

3. **搜索功能** 🔍
   - 在搜索框输入文件名或描述
   - 实时搜索结果

4. **批量操作** ⚡
   - 选择多张图片（点击左上角圆圈）
   - 点击"批量操作"进行：
     - 调整大小
     - 水平翻转
     - 格式转换
     - 批量下载
     - 批量删除

5. **分组管理** 📁
   - 点击"分组管理"创建分组
   - 批量添加图片到分组
   - 按分组筛选图片

## 🐛 常见问题解决

### 问题1：数据库连接失败
```bash
# 检查 PostgreSQL 服务
pg_isready -h 172.10.10.22 -p 5432

# 检查网络连通性
telnet 172.10.10.22 5432
```

### 问题2：MinIO 连接失败
```bash
# 检查 MinIO 服务
curl http://172.10.10.22:9000/minio/health/live

# 访问 MinIO 控制台
# http://172.10.10.22:9001
# 用户名: minioadmin, 密码: layout123
```

### 问题3：端口被占用
```bash
# Windows 查看端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# 杀死占用进程
taskkill /PID <进程ID> /F
```

### 问题4：依赖安装失败
```bash
# 清理并重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📊 系统监控

### 查看日志
```bash
# 后端日志
cd server
npm run dev

# 前端日志  
cd client
npm run dev
```

### API 测试
```bash
# 健康检查
curl http://localhost:3001/health

# 获取图片列表
curl http://localhost:3001/api/images

# 获取分组列表
curl http://localhost:3001/api/images/groups
```

## 🔧 配置文件说明

### server/.env
```env
PORT=3001                          # 后端端口
MINIO_ENDPOINT=172.10.10.22       # MinIO 地址
MINIO_PORT=9000                   # MinIO 端口
MINIO_ACCESS_KEY=minioadmin       # MinIO 用户名
MINIO_SECRET_KEY=layout123        # MinIO 密码
MINIO_BUCKET=images               # 存储桶名称
DB_HOST=172.10.10.22             # 数据库地址
DB_PORT=5432                     # 数据库端口
DB_NAME=image_manager            # 数据库名称
DB_USER=postgres                 # 数据库用户名
DB_PASSWORD=layout123            # 数据库密码
```

## 🎯 下一步

系统启动成功后，你可以：

1. 上传一些测试图片
2. 创建图片分组
3. 尝试批量操作功能
4. 测试搜索和筛选功能
5. 体验苹果风格的用户界面

## 📞 技术支持

如果遇到问题：
1. 首先运行连接测试：`cd server && npm run test:connections`
2. 检查日志输出中的错误信息
3. 确认网络连接和服务状态
4. 验证配置文件中的参数

---

🎉 **恭喜！你的图片管理系统已经准备就绪！**