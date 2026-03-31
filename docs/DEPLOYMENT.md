# OpenCraft 部署指南

本文档详细介绍 OpenCraft 的部署方式，包括开发环境和生产环境（Docker Compose）。

---

## 目录

- [开发环境部署](#开发环境部署)
- [生产环境部署 (Docker Compose)](#生产环境部署-docker-compose)
- [配置说明](#配置说明)
- [常见问题](#常见问题)

---

## 开发环境部署

适合本地开发和调试，支持热重载。

### 前置要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18.0 | 前端运行环境 |
| Python | >= 3.11 | 后端运行环境 |
| pip | >= 23.0 | Python 包管理器 |

### 快速启动

使用项目提供的启动脚本：

```bash
# 1. 克隆仓库
git clone https://github.com/aicorp-cn/opencraft.git
cd opencraft

# 2. 配置环境变量
cp server-python/.env.example server-python/.env
# 编辑 server-python/.env 文件，填入你的 LLM API Key

# 3. 启动服务
./dev.sh start

# 4. 访问应用
# 前端: http://localhost:5173
# 后端: http://localhost:3000
```

### 手动启动

如需单独启动各服务：

```bash
# 启动后端
cd server-python
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# 配置 .env 文件
uvicorn app.main:app --reload --port 3000

# 启动前端（新终端）
cd frontend-react
npm install
npm run dev
```

### 管理命令

```bash
./dev.sh start    # 启动服务
./dev.sh stop     # 停止服务
./dev.sh status   # 查看状态
```

---

## 生产环境部署 (Docker Compose)

推荐的生产部署方式，一键启动完整服务栈。

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │    frontend     │  /api   │    backend      │           │
│  │    (Nginx)      │ ───────▶│   (FastAPI)    │           │
│  │    :80          │         │    :3000        │           │
│  └─────────────────┘         └─────────────────┘           │
│         │                           │                       │
│         │                    ┌──────┴──────┐                │
│         │                    │   SQLite    │                │
│         │                    │  (Volume)   │                │
│         │                    └─────────────┘                │
│         │                                                   │
│  ┌──────┴──────────┐                                        │
│  │ Node.js Build   │                                        │
│  │  (Multi-stage)  │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

### 前置要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Docker | >= 20.10 | 容器运行时 |
| Docker Compose | >= 2.0 | 容器编排工具 |

### 部署步骤

```bash
# 1. 克隆仓库
git clone https://github.com/aicorp-cn/opencraft.git
cd opencraft

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置 LLM API

# 3. 构建并启动
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 访问应用
# http://localhost
```

### 服务配置

| 服务 | 镜像 | 端口 | 资源限制 | 健康检查 |
|------|------|------|----------|----------|
| frontend | nginx:alpine | 80 | 128MB / 0.5 CPU | curl localhost |
| backend | python:3.11-slim | 3000 (内部) | 256MB / 1 CPU | curl localhost:3000/health |

### 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps

# 重新构建
docker-compose build --no-cache

# 进入容器调试
docker-compose exec backend /bin/bash
docker-compose exec frontend /bin/sh
```

### 数据持久化

SQLite 数据库通过 Docker Volume 持久化：

```yaml
volumes:
  backend-data:
    driver: local
```

数据存储位置：`/var/lib/docker/volumes/opencraft_backend-data/_data`

---

## 配置说明

### 环境变量

创建 `.env` 文件配置 LLM 服务：

```bash
# 必填：LLM API 配置
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-your-api-key-here
LLM_MODEL=gpt-4o-mini
```

### 支持的 LLM 提供商

| 提供商 | LLM_BASE_URL | 推荐模型 | 说明 |
|--------|--------------|----------|------|
| OpenAI | https://api.openai.com/v1 | gpt-4o-mini | 官方 API |
| DeepSeek | https://api.deepseek.com/v1 | deepseek-chat | 国产，性价比高 |
| 智谱AI | https://open.bigmodel.cn/api/paas/v4 | glm-4-flash | GLM 系列 |
| Moonshot | https://api.moonshot.cn/v1 | moonshot-v1-8k | 长上下文 |
| 硅基流动 | https://api.siliconflow.cn/v1 | Qwen/Qwen2.5-7B-Instruct | 多模型聚合 |
| Ollama (本地) | http://host.docker.internal:11434/v1 | llama3 | 本地部署 |

### 本地 LLM 配置

使用本地 Ollama 时，需要：

1. 启动 Ollama 并启用 OpenAI 兼容模式：
   ```bash
   OLLAMA_ORIGINS=* ollama serve
   ```

2. 在 `.env` 中配置：
   ```bash
   LLM_BASE_URL=http://host.docker.internal:11434/v1
   LLM_API_KEY=ollama
   LLM_MODEL=llama3
   ```

---

## 常见问题

### 1. 前端无法连接后端 API

**症状**：前端页面加载但无法合成元素

**解决方案**：
- 检查后端服务是否正常：`docker-compose ps`
- 查看后端日志：`docker-compose logs backend`
- 确认网络配置：`docker network ls`

### 2. LLM API 调用失败

**症状**：合成时返回错误

**解决方案**：
- 检查 `.env` 文件中的 API Key 是否正确
- 确认 LLM_BASE_URL 配置正确
- 查看后端日志定位具体错误

### 3. Docker 构建失败

**症状**：`docker-compose build` 失败

**解决方案**：
```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

### 4. 端口冲突

**症状**：端口 80 已被占用

**解决方案**：
修改 `docker-compose.yml` 中的端口映射：
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 改为其他端口
```

### 5. 数据丢失

**症状**：重启后已发现元素丢失

**解决方案**：
- 确认 Docker Volume 正常挂载
- 数据持久化在 Volume 中，不会因容器重启而丢失

---

## 生产环境建议

### 安全配置

1. **使用 HTTPS**：配置反向代理（如 Nginx、Caddy）启用 SSL
2. **限制 API 访问**：配置速率限制和 IP 白名单
3. **环境变量安全**：不要将 `.env` 文件提交到版本控制

### 性能优化

1. **资源限制**：已配置容器资源限制，可根据实际需求调整
2. **日志管理**：配置日志轮转避免磁盘占满
3. **健康检查**：已配置健康检查，确保服务可用性

### 监控告警

建议配置：
- 容器资源使用监控
- API 响应时间监控
- 错误率告警

---

## 相关链接

- [前端文档](../frontend-react/README.md)
- [后端文档](../server-python/README.md)
- [贡献指南](../CONTRIBUTING.md)