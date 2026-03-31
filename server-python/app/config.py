"""配置管理模块"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 明确指定 .env 文件路径（位于 server-python/ 目录下）
# 无论从哪个目录启动服务，都能正确加载配置
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)


class Settings:
    """应用配置"""
    
    # 服务器配置
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "3000"))
    
    # 数据库配置
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./cache.db"
    )
    
    # LLM 配置 - 支持 OpenAI 兼容协议的云端服务
    # 可选提供商: OpenAI, DeepSeek, 智谱AI, Moonshot, 硅基流动, 本地 Ollama
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", os.getenv("OPENAI_API_KEY", ""))
    LLM_MODEL: str = os.getenv("LLM_MODEL", os.getenv("OPENAI_MODEL", "gpt-4o-mini"))
    
    # 兼容旧配置 (已废弃，建议使用 LLM_ 前缀)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # 限流配置
    RATE_LIMIT: str = os.getenv("RATE_LIMIT", "100/minute")
    
    # 缓存清理（天）
    CACHE_TTL_DAYS: int = int(os.getenv("CACHE_TTL_DAYS", "90"))


settings = Settings()
