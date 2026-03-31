"""FastAPI 应用入口 - 等效原系统 server/index.js"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.routers.craft import router as craft_router


# 限流器
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化数据库
    await init_db()
    yield
    # 关闭时清理资源


# 创建 FastAPI 应用
app = FastAPI(
    title="OpenCraft API",
    description="元素合成游戏后端 API - Python/FastAPI 版本",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 配置 - 等效原系统 @fastify/cors (全开)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 限流异常处理
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "Too many requests", "retry_after": exc.detail}
    )


# 注册路由 - 添加 /api/craft 前缀匹配前端调用
app.include_router(craft_router, prefix="/api/craft", tags=["craft"])


# 健康检查端点
@app.get("/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )