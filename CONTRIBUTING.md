# 🤝 贡献指南

感谢你对图片管理系统项目的关注！我们欢迎所有形式的贡献。

## 📋 贡献方式

### 🐛 报告Bug
- 使用 [GitHub Issues](https://github.com/yourusername/image-manager/issues) 报告bug
- 请详细描述问题和复现步骤
- 包含系统信息和错误日志

### 💡 功能建议
- 使用 [GitHub Issues](https://github.com/yourusername/image-manager/issues) 提出功能建议
- 详细描述功能需求和使用场景
- 解释为什么这个功能对用户有价值

### 🔧 代码贡献

#### 开发环境设置
1. Fork 项目到你的GitHub账户
2. 克隆你的fork到本地
   ```bash
   git clone https://github.com/yourusername/image-manager.git
   cd image-manager
   ```
3. 添加上游仓库
   ```bash
   git remote add upstream https://github.com/originalowner/image-manager.git
   ```
4. 安装依赖
   ```bash
   # 后端
   cd server && npm install
   
   # 前端
   cd ../client && npm install
   ```

#### 开发流程
1. 创建新分支
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. 进行开发
3. 运行测试
   ```bash
   # 后端测试
   cd server && npm test
   
   # 前端测试
   cd client && npm test
   ```
4. 提交更改
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```
5. 推送到你的fork
   ```bash
   git push origin feature/your-feature-name
   ```
6. 创建Pull Request

## 📝 代码规范

### 提交信息格式
使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型包括：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 代码风格
- **JavaScript/TypeScript**: 使用ESLint和Prettier
- **缩进**: 2个空格
- **分号**: 必须使用
- **引号**: 单引号
- **命名**: camelCase for variables, PascalCase for components

### 文件结构
```
src/
├── components/     # React组件
├── services/       # API服务
├── types/          # TypeScript类型定义
├── utils/          # 工具函数
└── hooks/          # 自定义Hooks
```

## 🧪 测试

### 运行测试
```bash
# 后端测试
cd server && npm test

# 前端测试
cd client && npm test

# 端到端测试
npm run test:e2e
```

### 测试覆盖率
- 新功能必须包含测试
- 保持测试覆盖率在80%以上
- 包含单元测试和集成测试

## 📖 文档

### 更新文档
- 新功能需要更新README.md
- API变更需要更新API文档
- 重要变更需要更新CHANGELOG.md

### 文档风格
- 使用清晰的标题结构
- 包含代码示例
- 添加适当的emoji增加可读性

## 🔍 代码审查

### Pull Request要求
- 清晰的标题和描述
- 关联相关的Issue
- 包含测试用例
- 通过所有CI检查
- 至少一个维护者的审查

### 审查标准
- 代码质量和可读性
- 性能影响
- 安全考虑
- 向后兼容性
- 测试覆盖率

## 🚀 发布流程

### 版本号规则
遵循 [Semantic Versioning](https://semver.org/)：
- `MAJOR`: 不兼容的API变更
- `MINOR`: 向后兼容的功能新增
- `PATCH`: 向后兼容的问题修正

### 发布步骤
1. 更新版本号
2. 更新CHANGELOG.md
3. 创建发布标签
4. 发布到GitHub Releases

## 🎯 优先级

### 高优先级
- 安全漏洞修复
- 关键bug修复
- 性能优化

### 中优先级
- 新功能开发
- 用户体验改进
- 代码重构

### 低优先级
- 文档改进
- 代码风格调整
- 依赖更新

## 💬 沟通

### 讨论渠道
- GitHub Issues: 功能讨论和bug报告
- GitHub Discussions: 一般讨论和问答
- Pull Request: 代码审查和技术讨论

### 行为准则
- 保持友善和专业
- 尊重不同观点
- 建设性的反馈
- 帮助新贡献者

## 🏆 贡献者认可

### 贡献类型
- 代码贡献
- 文档改进
- bug报告
- 功能建议
- 测试和反馈

### 认可方式
- 贡献者列表
- 发布说明致谢
- 特殊贡献徽章

## 📞 获取帮助

如果你需要帮助：
1. 查看现有的Issues和Discussions
2. 创建新的Issue描述你的问题
3. 在Pull Request中@维护者

感谢你的贡献！🎉