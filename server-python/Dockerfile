# ===========================================
# OpenCraft Backend - 优化版 Dockerfile
# ===========================================
# 基础镜像: python:3.11-alpine (~50MB)
# 生产镜像大小: ~80MB (原 ~250MB)

# ===========================================
# Stage 1: 构建阶段
# ===========================================
FROM python:3.11-alpine AS builder

# 安装编译依赖（用于构建 aiosqlite 等需要编译的包）
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    sqlite-dev

# 创建虚拟环境
WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 安装生产依赖
COPY requirements-prod.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements-prod.txt

# ===========================================
# Stage 2: 运行阶段
# ===========================================
FROM python:3.11-alpine

# 安装运行时依赖（SQLite 和 curl）
RUN apk add --no-cache \
    sqlite-libs \
    curl

# 设置工作目录
WORKDIR /app

# 从构建阶段复制虚拟环境
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 设置 Python 环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 复制应用代码
COPY app/ ./app/

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3000"]