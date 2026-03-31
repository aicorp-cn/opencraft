# 贡献指南

感谢您有兴趣为 OpenCraft 做出贡献！本文档将帮助您了解如何参与项目开发。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境搭建](#开发环境搭建)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [问题反馈](#问题反馈)

---

## 行为准则

本项目采用贡献者公约作为行为准则。参与本项目即表示您同意遵守其条款。请阅读 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 了解详情。

---

## 如何贡献

### 报告 Bug

如果您发现了 Bug，请通过 [GitHub Issues](https://github.com/aicorp-cn/opencraft/issues) 提交报告。

**Bug 报告模板**：

```markdown
**描述**
清晰简洁地描述 Bug。

**复现步骤**
1. 进入 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

**期望行为**
描述您期望发生的事情。

**截图**
如果适用，添加截图帮助解释问题。

**环境**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 22]

**其他信息**
添加有关问题的任何其他信息。
```

### 提出新功能

欢迎提出新功能建议！请在 Issue 中详细描述：

1. 功能描述
2. 使用场景
3. 预期效果
4. 可能的实现方案（可选）

### 改进文档

文档改进包括：

- 修正拼写或语法错误
- 添加缺失的文档
- 改进现有文档的清晰度
- 翻译文档

---

## 开发环境搭建

### 前置要求

- Node.js >= 18.0
- Python >= 3.11
- Git
- Docker（可选）

### Fork 并克隆仓库

```bash
# 1. Fork 仓库后克隆
git clone https://github.com/YOUR_USERNAME/opencraft.git
cd opencraft

# 2. 添加上游仓库
git remote add upstream https://github.com/aicorp-cn/opencraft.git

# 3. 安装前端依赖
cd frontend-react && npm install

# 4. 安装后端依赖
cd ../server-python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 5. 配置环境变量
cp .env.example .env
# 编辑 .env 配置 LLM API
```

### 启动开发环境

```bash
# 使用启动脚本
./dev.sh start

# 或手动启动
# 终端 1 - 后端
cd server-python && source .venv/bin/activate && uvicorn app.main:app --reload --port 3000

# 终端 2 - 前端
cd frontend-react && npm run dev
```

---

## 代码规范

### TypeScript/React

- 使用 **函数组件** + **Hooks**
- 使用 **TypeScript** 严格模式
- 遵循 **ESLint** 规则
- 组件命名使用 **PascalCase**
- 函数/变量命名使用 **camelCase**
- 常量使用 **UPPER_SNAKE_CASE**

**组件结构**：

```typescript
/**
 * ComponentName - 组件简介
 * 
 * 职责：
 * 1. 职责一
 * 2. 职责二
 */

import { useState, useEffect } from 'react'

interface ComponentProps {
  /** 属性说明 */
  title: string
}

export const ComponentName: React.FC<ComponentProps> = ({ title }) => {
  // 1. Hooks
  const [state, setState] = useState(null)
  
  // 2. Effects
  useEffect(() => {
    // ...
  }, [])
  
  // 3. Handlers
  const handleClick = () => {
    // ...
  }
  
  // 4. Render
  return (
    <div onClick={handleClick}>
      {title}
    </div>
  )
}
```

### Python

- 遵循 **PEP 8** 规范
- 使用 **类型注解**
- 使用 **async/await** 异步编程
- 函数/变量命名使用 **snake_case**
- 类命名使用 **PascalCase**

**代码结构**：

```python
"""
模块简介
"""

from typing import Optional

class ServiceName:
    """类简介"""
    
    def __init__(self, config: Config):
        """初始化方法"""
        self._config = config
    
    async def process_item(self, item_id: str) -> Optional[dict]:
        """
        处理项目
        
        Args:
            item_id: 项目 ID
            
        Returns:
            处理结果，失败返回 None
        """
        # 实现
        pass
```

### 通用规范

- **注释**：复杂逻辑添加注释说明
- **文档字符串**：公共 API 必须添加文档
- **错误处理**：合理处理异常，避免静默失败
- **测试**：新功能需添加测试用例

---

## 提交规范

本项目采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 (type)

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具相关 |
| `ci` | CI/CD 相关 |

### 范围 (scope)

| 范围 | 说明 |
|------|------|
| `frontend` | 前端相关 |
| `backend` | 后端相关 |
| `dnd` | 拖拽系统 |
| `llm` | LLM 服务 |
| `ui` | UI 组件 |
| `store` | 状态管理 |

### 示例

```bash
# 新功能
feat(frontend): add element detail modal

# Bug 修复
fix(backend): resolve cache miss issue in synthesis

# 文档
docs: update deployment guide

# 重构
refactor(dnd): migrate to dnd-kit v2

# 性能优化
perf(frontend): implement virtual scrolling for resource list
```

---

## Pull Request 流程

### 1. 创建分支

```bash
# 同步上游
git fetch upstream

# 创建功能分支
git checkout -b feature/your-feature upstream/main
```

### 2. 开发并提交

```bash
# 开发...
git add .
git commit -m "feat: add your feature"
```

### 3. 推送分支

```bash
git push origin feature/your-feature
```

### 4. 创建 Pull Request

1. 访问 [Pull Requests](https://github.com/aicorp-cn/opencraft/pulls)
2. 点击 "New Pull Request"
3. 选择您的分支
4. 填写 PR 描述模板

### PR 描述模板

```markdown
## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 重构
- [ ] 文档更新
- [ ] 其他

## 变更描述
清晰描述此 PR 的变更内容。

## 相关 Issue
Closes #issue_number

## 测试
描述如何测试此变更。

## 截图
如有 UI 变更，添加截图。

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 已添加/更新测试
- [ ] 已更新相关文档
- [ ] 所有测试通过
```

### 5. 代码审查

- 响应审查意见并及时修改
- 保持讨论专业和尊重
- 解决所有评论后等待合并

---

## 问题反馈

如有任何问题，请通过以下方式联系：

- **GitHub Issues**: [提交 Issue](https://github.com/aicorp-cn/opencraft/issues)
- **GitHub Discussions**: [参与讨论](https://github.com/aicorp-cn/opencraft/discussions)

---

再次感谢您的贡献！🎉