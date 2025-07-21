# 图片管理系统 - Python 后端

这是图片管理系统的Python后端，使用FastAPI框架开发，支持图片上传、管理、AI描述生成等功能。

## 功能特性

- 🔐 JWT认证系统
- 📸 图片上传和管理
- 🏷️ 标签和分组系统
- 🤖 AI图片描述生成
- 🔄 图片处理（翻转、调整大小、格式转换）
- 📦 批量操作支持
- 📝 描述文件支持

## 技术栈

- **FastAPI**: Web框架
- **SQLAlchemy**: ORM
- **PostgreSQL**: 数据库
- **MinIO**: 对象存储
- **Pillow**: 图片处理
- **PyTorch/Transformers**: AI模型

## 快速开始

### 使用Docker

```bash
docker-compose up -d
```

### 本地开发

1. 创建虚拟环境

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows
```

2. 安装依赖

```bash
pip install -r requirements.txt
```

3. 配置环境变量

```bash
cp .env.example .env
# 编辑.env文件
```

4. 运行应用

```bash
uvicorn app.main:app --reload
```

## API文档

启动应用后，访问以下URL查看API文档：

- Swagger UI: http://localhost:3001/docs
- ReDoc: http://localhost:3001/redoc

## 目录结构

```
python_server/
├── app/
│   ├── api/
│   │   └── routes/       # API路由
│   ├── core/             # 核心配置
│   ├── db/               # 数据库配置
│   ├── models/           # 数据模型
│   ├── schemas/          # Pydantic模型
│   ├── services/         # 服务层
│   ├── utils/            # 工具函数
│   └── main.py           # 应用入口
├── tests/                # 测试
├── .env.example          # 环境变量示例
├── Dockerfile            # Docker配置
└── requirements.txt      # 依赖列表
```

## AI图片描述

系统支持使用AI模型自动生成图片描述。要启用此功能，请在.env文件中设置：

```
USE_AI_DESCRIPTION=True
```

默认使用Microsoft的GIT模型，您也可以指定自定义模型：

```
AI_MODEL_PATH=path/to/custom/model
```

## 测试

运行测试：

```bash
pytest
```

## 许可证

MIT