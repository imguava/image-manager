# 🚀 图片管理系统 - 快速启动指南

## 📋 前置条件检查

确保以下服务正在运行：
- ✅ PostgreSQL 数据库 (172.10.10.22:5432)
- ✅ MinIO 对象存储 (172.10.10.22:9000)

## 🔧 第一步：安装依赖

### Python后端
```bash
# 1. 创建虚拟环境
python -m venv venv

# 2. 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. 安装依赖
cd server
pip install -r requirements.txt
```

### React前端
```bash
# 安装前端依赖
cd client
npm install
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

## 🧪 第三步：配置环境变量

### 后端配置
复制示例配置文件并修改：

```bash
# 进入服务器目录
cd server

# 复制示例配置
cp .env.example .env

# 编辑配置文件，设置数据库和MinIO连接信息
```

### 前端配置
```bash
# 进入前端目录
cd client

# 复制示例配置
cp .env.example .env

# 编辑配置文件，设置API地址
```

## 🚀 第四步：启动应用

### 方式一：使用Docker（推荐）
```bash
# Windows
start-docker.bat

# Linux/Mac
./start-docker.sh
```

### 方式二：本地开发环境
```bash
# 终端1 - 启动后端
cd server
uvicorn app.main:app --reload --host 0.0.0.0 --port 3001

# 终端2 - 启动前端
cd client
npm run dev
```

## 🌐 第五步：访问应用

- **前端应用**: http://localhost:3000 (开发) 或 http://localhost (Docker)
- **后端API**: http://localhost:3001
- **API文档**: http://localhost:3001/docs
- **健康检查**: http://localhost:3001/health

## 🤖 AI图片描述功能

系统支持使用Janus-Pro-7B模型自动生成图片描述。

### 启用AI功能
修改`.env`文件中的配置：
```
USE_AI_DESCRIPTION=True
AI_MODEL_PATH=/path/to/Janus-Pro-7B
AI_PROMPT=请描述这张图片的内容，使用简洁的关键词
AI_TEMPERATURE=0.1
AI_TOP_P=0.95
```

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

6. **标签管理** 🏷️
   - 创建和管理标签
   - 为图片添加标签
   - 按标签筛选图片

7. **AI描述** 🤖
   - 上传图片时自动生成描述
   - 查看和编辑AI生成的描述

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

### 问题4：AI模型加载失败
```bash
# 检查模型路径是否正确
# 确保有足够的内存和GPU资源
# 查看日志中的错误信息
```

## 📊 系统监控

### 查看日志
```bash
# 后端日志
cd server
uvicorn app.main:app --reload --log-level debug

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
curl http://localhost:3001/api/groups
```

## 🔧 配置文件说明

### server/.env
```env
# 服务器设置
DEBUG=False
SERVER_HOST=0.0.0.0
SERVER_PORT=3001

# 数据库设置
DB_HOST=172.10.10.22
DB_PORT=5432
DB_NAME=image_manager
DB_USER=postgres
DB_PASSWORD=password

# MinIO设置
MINIO_ENDPOINT=172.10.10.22
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=layout123
MINIO_USE_SSL=False

# JWT设置
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# AI模型设置
USE_AI_DESCRIPTION=False
AI_MODEL_PATH=/path/to/Janus-Pro-7B
AI_PROMPT=请描述这张图片的内容，使用简洁的关键词
AI_TEMPERATURE=0.1
AI_TOP_P=0.95
```

## 🎯 下一步

系统启动成功后，你可以：

1. 上传一些测试图片
2. 创建图片分组和标签
3. 尝试批量操作功能
4. 测试搜索和筛选功能
5. 体验AI图片描述功能
6. 体验苹果风格的用户界面

## 📞 技术支持

如果遇到问题：
1. 检查日志输出中的错误信息
2. 确认网络连接和服务状态
3. 验证配置文件中的参数
4. 查看API文档了解接口使用方法

---

🎉 **恭喜！你的图片管理系统已经准备就绪！**