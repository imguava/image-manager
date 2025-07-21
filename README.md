# 🖼️ 图片管理系统

一个功能完整的现代化图片管理系统，支持图片上传、分类、标签管理、批量操作等功能。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## ✨ 功能特性

### 🎨 用户界面
- ✅ 现代化响应式设计
- ✅ 无限滚动加载
- ✅ 拖拽上传支持
- ✅ 实时搜索过滤
- ✅ 批量操作界面
- ✅ 移动端适配

### 📸 图片管理
- ✅ 多格式支持 (JPEG, PNG, GIF, WebP)
- ✅ 自动缩略图生成
- ✅ 图片信息显示 (尺寸、格式、大小)
- ✅ 图片预览和查看
- ✅ 图片重命名
- ✅ 图片描述编辑
- ✅ 图片水平翻转

### 🏷️ 分类管理
- ✅ 多级分组支持
- ✅ 标签系统
- ✅ 智能标签 (自动分辨率标签)
- ✅ 颜色标签
- ✅ 批量标签管理

### 📦 批量操作
- ✅ 批量上传 (最多200个文件)
- ✅ 批量下载 (ZIP格式)
- ✅ 批量删除
- ✅ 批量标签管理
- ✅ 批量分组管理
- ✅ 上传进度显示

### 🔐 用户认证
- ✅ JWT认证系统
- ✅ 密码加密存储
- ✅ 会话管理
- ✅ 权限控制
- ✅ 自动登出

### 📝 描述文件支持
- ✅ 同名txt文件自动作为图片描述
- ✅ 批量描述文件上传
- ✅ 描述文件导出

## 🏗️ 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Framer Motion** - 动画库
- **Axios** - HTTP客户端

### 后端
- **Node.js** - 运行时环境
- **Express** - Web框架
- **PostgreSQL** - 数据库
- **MinIO** - 对象存储
- **JWT** - 身份认证
- **Bcrypt** - 密码加密
- **Multer** - 文件上传
- **Sharp** - 图片处理

### 部署
- **Docker** - 容器化
- **Docker Compose** - 服务编排
- **Nginx** - 反向代理

## 🚀 快速开始

### 方式一：Docker部署（推荐）

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/image-manager.git
   cd image-manager
   ```

2. **启动服务**
   ```bash
   # Windows
   start-docker.bat
   
   # Linux/Mac
   chmod +x start-docker.sh
   ./start-docker.sh
   ```

3. **访问应用**
   - 前端: http://localhost
   - 后端API: http://localhost:3001
   - MinIO控制台: http://localhost:9001

### 方式二：本地开发

#### 环境要求
- Node.js 18+
- PostgreSQL 13+
- MinIO Server

#### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/image-manager.git
   cd image-manager
   ```

2. **安装后端依赖**
   ```bash
   cd server
   npm install
   ```

3. **安装前端依赖**
   ```bash
   cd ../client
   npm install
   ```

4. **配置环境变量**
   ```bash
   # 复制环境变量模板
   cp .env.example .env
   
   # 编辑配置文件
   nano .env
   ```

5. **启动数据库和MinIO**
   ```bash
   # 使用Docker启动依赖服务
   docker-compose up postgres minio -d
   ```

6. **启动后端服务**
   ```bash
   cd server
   npm start
   ```

7. **启动前端服务**
   ```bash
   cd client
   npm start
   ```

## 🔑 默认登录信息

- **用户名**: admin
- **密码**: admin123

## 📖 使用指南

### 上传图片
1. 点击"上传图片"按钮
2. 选择图片文件或拖拽到上传区域
3. 可同时上传同名的.txt文件作为描述
4. 查看上传进度
5. 上传完成后自动刷新列表

### 管理图片
1. **查看图片**: 点击图片预览
2. **编辑名称**: 点击图片名称进行编辑
3. **添加描述**: 点击描述区域进行编辑
4. **管理标签**: 点击标签按钮管理标签
5. **图片翻转**: 点击翻转按钮进行水平翻转

### 批量操作
1. 选择多张图片（点击图片左上角的选择框）
2. 点击"批量操作"按钮
3. 选择操作类型：
   - **图片处理**: 调整大小、翻转、格式转换
   - **整理分组**: 添加到分组、批量删除
   - **导出下载**: 批量下载ZIP包

### 分组管理
1. 点击"分组管理"按钮
2. 创建新分组或编辑现有分组
3. 支持多级分组结构
4. 将图片添加到分组中

## 🐳 Docker部署

详细的Docker部署说明请参考 [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

### 快速启动
```bash
docker-compose up --build -d
```

### 服务架构
```
┌─────────────────┐    ┌─────────────────┐
│   Nginx (80)    │────│  React Frontend │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ Node.js (3001)  │────│   Express API   │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│PostgreSQL(5432) │    │  MinIO (9000)   │
│   数据库存储     │    │   文件存储      │
└─────────────────┘    └─────────────────┘
```

## 🛠️ 开发指南

### 项目结构
```
image-manager/
├── client/                 # 前端React应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── services/       # API服务
│   │   ├── types/          # TypeScript类型
│   │   └── App.tsx         # 主应用组件
│   ├── Dockerfile          # 前端Docker配置
│   └── nginx.conf          # Nginx配置
├── server/                 # 后端Node.js应用
│   ├── src/
│   │   ├── routes/         # API路由
│   │   ├── database/       # 数据库配置
│   │   ├── storage/        # 存储配置
│   │   └── utils/          # 工具函数
│   └── Dockerfile          # 后端Docker配置
├── docker-compose.yml      # Docker编排配置
└── README.md              # 项目说明
```

### API文档

#### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

#### 图片接口
- `GET /api/images` - 获取图片列表
- `POST /api/images/upload` - 上传图片
- `PUT /api/images/:id/description` - 更新图片描述
- `PUT /api/images/:id/name` - 更新图片名称
- `POST /api/images/:id/flip` - 图片翻转
- `DELETE /api/images/batch` - 批量删除图片

#### 分组接口
- `GET /api/images/groups` - 获取分组列表
- `POST /api/images/groups` - 创建分组
- `POST /api/images/groups/:id/images` - 添加图片到分组

#### 标签接口
- `GET /api/images/tags` - 获取标签列表
- `POST /api/images/:id/tags` - 为图片添加标签
- `DELETE /api/images/:id/tags/:tagId` - 移除图片标签

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 更新日志

### v1.0.0 (2024-01-XX)
- ✨ 初始版本发布
- 🎨 完整的图片管理功能
- 🔐 用户认证系统
- 🐳 Docker支持
- 📱 响应式设计

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面框架
- [Node.js](https://nodejs.org/) - JavaScript运行时
- [PostgreSQL](https://www.postgresql.org/) - 数据库
- [MinIO](https://min.io/) - 对象存储
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Framer Motion](https://www.framer.com/motion/) - 动画库

## 📞 支持

如果你觉得这个项目有用，请给它一个 ⭐️！

如果遇到问题或有建议，请创建一个 [Issue](https://github.com/yourusername/image-manager/issues)。

---

**🎉 享受使用图片管理系统！**