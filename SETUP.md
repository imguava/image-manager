# 图片管理系统运行指南

## 环境要求

- Node.js 16+ 
- PostgreSQL 数据库 (已配置为 172.10.10.22:5432)
- MinIO 对象存储 (已配置为 172.10.10.22:9000)

## 快速启动步骤

### 1. 安装项目依赖

```bash
# 安装根目录依赖
npm install

# 安装所有依赖（前端+后端）
npm run install:all
```

### 2. 创建 PostgreSQL 数据库

连接到你的 PostgreSQL 服务器并创建数据库：

```sql
-- 连接到 PostgreSQL (172.10.10.22:5432)
-- 用户名: postgres, 密码: layout123

CREATE DATABASE image_manager;
```

### 3. 验证配置文件

检查 `server/.env` 文件配置：

```env
PORT=3001

# MinIO 配置
MINIO_ENDPOINT=172.10.10.22
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=layout123
MINIO_USE_SSL=false
MINIO_BUCKET=images

# PostgreSQL 数据库配置
DB_HOST=172.10.10.22
DB_PORT=5432
DB_NAME=image_manager
DB_USER=postgres
DB_PASSWORD=layout123
```

### 4. 启动开发服务器

```bash
# 同时启动前端和后端
npm run dev
```

或者分别启动：

```bash
# 启动后端 (在 server 目录)
cd server
npm run dev

# 启动前端 (在 client 目录，新终端)
cd client
npm run dev
```

### 5. 访问应用

- 前端应用: http://localhost:3000
- 后端 API: http://localhost:3001
- 健康检查: http://localhost:3001/health

## 验证服务连接

### 检查 PostgreSQL 连接

```bash
# 使用 psql 命令行工具测试连接
psql -h 172.10.10.22 -p 5432 -U postgres -d image_manager

# 或者使用 Node.js 测试脚本
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: '172.10.10.22',
  port: 5432,
  database: 'image_manager',
  user: 'postgres',
  password: 'layout123'
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('数据库连接失败:', err);
  else console.log('数据库连接成功:', res.rows[0]);
  pool.end();
});
"
```

### 检查 MinIO 连接

访问 MinIO 控制台: http://172.10.10.22:9001
- 用户名: minioadmin
- 密码: layout123

或者使用 Node.js 测试：

```bash
node -e "
const Minio = require('minio');
const client = new Minio.Client({
  endPoint: '172.10.10.22',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'layout123'
});
client.listBuckets((err, buckets) => {
  if (err) console.error('MinIO 连接失败:', err);
  else console.log('MinIO 连接成功，存储桶列表:', buckets);
});
"
```

## 常见问题解决

### 1. 数据库连接失败

```bash
# 检查 PostgreSQL 服务是否运行
pg_isready -h 172.10.10.22 -p 5432

# 检查防火墙设置
telnet 172.10.10.22 5432
```

### 2. MinIO 连接失败

```bash
# 检查 MinIO 服务
curl http://172.10.10.22:9000/minio/health/live

# 检查网络连接
telnet 172.10.10.22 9000
```

### 3. 端口冲突

如果端口 3000 或 3001 被占用：

```bash
# 查看端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# 修改端口配置
# 前端: client/package.json 中的 start 脚本
# 后端: server/.env 中的 PORT 变量
```

### 4. 依赖安装失败

```bash
# 清理缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 或使用 yarn
yarn install
```

## 生产环境部署

### 1. 构建前端

```bash
cd client
npm run build
```

### 2. 启动生产服务器

```bash
cd server
npm start
```

### 3. 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server/src/index.js --name image-manager

# 查看状态
pm2 status

# 查看日志
pm2 logs image-manager
```

## 功能测试

启动成功后，你可以测试以下功能：

1. **上传图片**: 点击"上传图片"按钮，拖拽或选择图片文件
2. **查看图片**: 点击缩略图查看原图
3. **搜索图片**: 在搜索框中输入关键词
4. **批量操作**: 选择多张图片进行批量处理
5. **分组管理**: 创建分组并管理图片分组
6. **下载图片**: 单张或批量下载图片

## 日志查看

```bash
# 查看后端日志
cd server
npm run dev

# 查看前端日志
cd client  
npm run dev
```

## 数据库表结构

系统会自动创建以下表：

- `images`: 图片信息表
- `image_groups`: 图片分组表  
- `image_group_relations`: 图片分组关联表

## API 接口测试

```bash
# 健康检查
curl http://localhost:3001/health

# 获取图片列表
curl http://localhost:3001/api/images

# 获取分组列表
curl http://localhost:3001/api/images/groups
```

如果遇到问题，请检查：
1. 网络连接是否正常
2. 数据库和 MinIO 服务是否运行
3. 配置文件是否正确
4. 防火墙设置是否允许连接