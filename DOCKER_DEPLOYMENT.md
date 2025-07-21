# 🐳 Docker 部署指南

## 📋 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

## 🚀 快速启动

### Windows 用户
```bash
# 双击运行或在命令行执行
start-docker.bat
```

### Linux/Mac 用户
```bash
# 给脚本执行权限
chmod +x start-docker.sh

# 运行启动脚本
./start-docker.sh
```

### 手动启动
```bash
# 构建并启动所有服务
docker-compose up --build -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 🌐 访问地址

启动成功后，可以通过以下地址访问：

- **前端应用**: http://localhost
- **后端API**: http://localhost:3001
- **MinIO控制台**: http://localhost:9001 (minioadmin/minioadmin123)

## 🔑 默认登录信息

- **用户名**: admin
- **密码**: admin123

## 📊 服务架构

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

## 🛠️ 常用命令

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f postgres
docker-compose logs -f minio
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart server
```

### 停止服务
```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

### 更新服务
```bash
# 重新构建并启动
docker-compose up --build -d
```

## 🔧 配置说明

### 环境变量
主要配置在 `docker-compose.yml` 中，包括：

- **数据库配置**: PostgreSQL连接信息
- **存储配置**: MinIO对象存储配置
- **JWT配置**: 认证密钥配置

### 端口配置
- **80**: 前端应用端口
- **3001**: 后端API端口
- **5432**: PostgreSQL数据库端口
- **9000**: MinIO API端口
- **9001**: MinIO控制台端口

### 数据持久化
- **postgres_data**: PostgreSQL数据卷
- **minio_data**: MinIO数据卷

## 🐛 故障排除

### 端口冲突
如果遇到端口冲突，可以修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8080:80"  # 将前端端口改为8080
```

### 内存不足
如果系统内存不足，可以减少服务资源限制或关闭不必要的服务。

### 数据库连接失败
检查PostgreSQL服务是否正常启动：
```bash
docker-compose logs postgres
```

### 文件上传失败
检查MinIO服务是否正常启动：
```bash
docker-compose logs minio
```

## 🔒 生产环境部署

### 安全配置
1. **修改默认密码**:
   - 数据库密码
   - MinIO访问密钥
   - JWT密钥

2. **使用HTTPS**:
   - 配置SSL证书
   - 修改nginx配置

3. **网络安全**:
   - 限制端口访问
   - 配置防火墙规则

### 性能优化
1. **资源限制**:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '0.5'
   ```

2. **数据库优化**:
   - 配置连接池
   - 优化查询索引

## 📝 备份与恢复

### 数据备份
```bash
# 备份PostgreSQL数据
docker exec image-manager-postgres pg_dump -U postgres image_manager > backup.sql

# 备份MinIO数据
docker cp image-manager-minio:/data ./minio-backup
```

### 数据恢复
```bash
# 恢复PostgreSQL数据
docker exec -i image-manager-postgres psql -U postgres image_manager < backup.sql

# 恢复MinIO数据
docker cp ./minio-backup image-manager-minio:/data
```

## 📞 技术支持

如果遇到问题，请检查：
1. Docker和Docker Compose版本
2. 系统资源使用情况
3. 服务日志信息
4. 网络连接状态

---

🎉 **恭喜！你的图片管理系统现在可以在Docker中完美运行了！**