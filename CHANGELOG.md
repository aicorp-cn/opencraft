# 更新日志

本项目的所有值得注意的变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增 (Added)
- 待发布的新功能

### 变更 (Changed)
- 待发布的变更

### 修复 (Fixed)
- 待发布的修复

---

## [1.0.0] - 2024-XX-XX

### 新增 (Added)

#### 核心功能
- 🎮 **拖拽合成系统** - 基于 dnd-kit 的流畅拖拽体验
- 🤖 **AI 驱动合成引擎** - 支持多种 LLM 提供商的智能元素生成
- 🏆 **成就系统** - 成长阶段和成就解锁机制
- 📊 **进度追踪** - 实时显示发现进度和元素统计
- 🔊 **音效反馈** - 程序化音效和语音播报
- 📦 **数据持久化** - 本地存储 + 服务端缓存

#### 技术架构
- ⚛️ React 18 + TypeScript 前端
- 🐍 Python 3.11 + FastAPI 后端
- 🗄️ SQLite + SQLAlchemy 2.0 (异步)
- 🐳 Docker 容器化部署
- 🎨 TailwindCSS 响应式设计

#### LLM 支持
- OpenAI (GPT-4o-mini)
- DeepSeek
- 智谱 AI (GLM)
- Moonshot
- 硅基流动
- 本地 Ollama

#### 合成类型
- 物理/化学 (Physical/Chemical)
- 文化/流行 (Cultural/Pop)
- 概念/隐喻 (Conceptual/Metaphorical)
- 语言/双关 (Linguistic/Wordplay)
- 功能/工具 (Functional/Tool)

### 文档
- 📖 完整的 README.md
- 📋 CONTRIBUTING.md 贡献指南
- 📚 部署文档 DEPLOYMENT.md
- 🔒 安全政策 SECURITY.md
- 📜 行为准则 CODE_OF_CONDUCT.md

---

## 版本说明

### 版本号规则

- **主版本号 (MAJOR)**: 不兼容的 API 变更
- **次版本号 (MINOR)**: 向后兼容的功能新增
- **修订号 (PATCH)**: 向后兼容的问题修复

### 变更类型

- **新增 (Added)**: 新功能
- **变更 (Changed)**: 现有功能的变更
- **弃用 (Deprecated)**: 即将移除的功能
- **移除 (Removed)**: 已移除的功能
- **修复 (Fixed)**: Bug 修复
- **安全 (Security)**: 安全相关的修复

---

[Unreleased]: https://github.com/aicorp-cn/opencraft/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/aicorp-cn/opencraft/releases/tag/v1.0.0