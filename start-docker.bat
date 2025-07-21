@echo off
chcp 65001 >nul

echo 🚀 启动图片管理系统 Docker 容器...

REM 检查Docker是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未运行，请先启动 Docker
    pause
    exit /b 1
)

REM 停止并删除现有容器
echo 🧹 清理现有容器...
docker-compose down

REM 构建并启动服务
echo 🔨 构建并启动服务...
docker-compose up --build -d

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 10 /nobreak >nul

REM 检查服务状态
echo 📊 检查服务状态...
docker-compose ps

echo.
echo ✅ 图片管理系统已启动！
echo.
echo 🌐 访问地址：
echo    前端应用: http://localhost
echo    后端API: http://localhost:3001/docs
echo    MinIO控制台: http://localhost:9001
echo.
echo 🔑 默认登录信息：
echo    用户名: admin
echo    密码: admin123
echo.
echo 🤖 AI图片描述功能：
echo    默认关闭，如需启用，请修改docker-compose.yml中的环境变量：
echo    USE_AI_DESCRIPTION: "True"
echo    AI_MODEL_PATH: "/app/models/Janus-Pro-7B"
echo.
echo 📝 查看日志：
echo    docker-compose logs -f
echo.
echo 🛑 停止服务：
echo    docker-compose down
echo.
pause