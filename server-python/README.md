# OpenCraft Python Backend

FastAPI + SQLAlchemy + OpenAI 兼容协议构建的元素合成游戏后端服务。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.11 | 运行时 |
| FastAPI | 0.110 | Web 框架 |
| SQLAlchemy | 2.0 | ORM（异步） |
| SQLite | - | 数据库 |
| OpenAI SDK | 1.12 | LLM 客户端 |
| Pydantic | 2.6 | 数据验证 |

## 项目结构

```
server-python/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── config.py            # 配置管理
│   ├── database.py          # 数据库连接
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   └── craft.py         # 元素合成 API
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── llm_service.py   # LLM 服务
│   │   └── cache_service.py # 缓存服务
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── word_cache.py    # SQLAlchemy 模型
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── craft.py         # Pydantic 模型
│   │
│   └── prompts/
│       ├── system_prompt.md  # LLM 系统提示词
│       ├── user_prompt.md    # LLM 用户提示词
│       └── json_schema.json  # JSON Schema 定义
│
├── tests/
│   ├── __init__.py
│   └── test_api.py
│
├── requirements.txt
├── Dockerfile
└── .env.example
```

## 快速开始

### 安装依赖

```bash
cd server-python
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 生产环境
pip install -r requirements.txt

# 开发环境（包含测试依赖）
pip install -r requirements-dev.txt
```

### 依赖文件说明

| 文件 | 用途 |
|------|------|
| `requirements.txt` | 生产环境依赖 |
| `requirements-prod.txt` | 生产环境依赖（最小化） |
| `requirements-dev.txt` | 开发/测试依赖 |

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置 LLM 提供商
```

### 启动服务

```bash
# 开发模式
uvicorn app.main:app --reload --port 3000

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 3000
```

## API 文档

启动服务后访问：
- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc

### API 端点

#### GET /api/craft/

获取初始元素组合（6 组基础元素）。

**响应**：
```json
{
  "Water + Fire": {"result": "Steam", "emoji": "💨"},
  "Water + Earth": {"result": "Mud", "emoji": "🟤"},
  "Fire + Earth": {"result": "Lava", "emoji": "🌋"},
  "Water + Air": {"result": "Mist", "emoji": "🌫️"},
  "Earth + Air": {"result": "Dust", "emoji": "💨"},
  "Fire + Air": {"result": "Energy", "emoji": "⚡"}
}
```

#### POST /api/craft/

组合两个元素生成新元素（基础版）。

**请求**：
```json
{
  "first": "Fire",
  "second": "Water"
}
```

**响应**：
```json
{
  "result": "Steam",
  "emoji": "💨"
}
```

#### POST /api/craft/v2

组合两个元素生成新元素（增强版，返回完整推理信息）。

**请求**：
```json
{
  "first": "Fire",
  "second": "Water"
}
```

**响应**：
```json
{
  "word": "Steam",
  "emoji": "💨",
  "lang": "en",
  "reasoning": {
    "type": "Physical/Chemical",
    "role_first": "Heat source",
    "role_second": "Substance to transform",
    "trace": "Fire provides thermal energy, causing water to undergo phase transition from liquid to gas"
  },
  "explanation": "Water vapor produced when liquid water is heated to boiling point"
}
```

#### GET /health

健康检查端点。

**响应**：
```json
{
  "status": "healthy"
}
```

## LLM 提供商配置

本项目支持所有 **OpenAI 兼容协议** 的云端 LLM 服务。

### 支持的提供商

| 提供商 | Base URL | 模型示例 | 特点 |
|-------|----------|---------|------|
| **OpenAI** | `https://api.openai.com/v1` | gpt-4o-mini | 官方 API，稳定可靠 |
| **DeepSeek** | `https://api.deepseek.com/v1` | deepseek-chat | 国产，性价比高 |
| **智谱 AI** | `https://open.bigmodel.cn/api/paas/v4` | glm-4-flash | GLM 系列，中文优化 |
| **Moonshot** | `https://api.moonshot.cn/v1` | moonshot-v1-8k | 长上下文支持 |
| **硅基流动** | `https://api.siliconflow.cn/v1` | Qwen/Qwen2.5-7B-Instruct | 多模型聚合 |
| **本地 Ollama** | `http://localhost:11434/v1` | llama3 | 本地部署，免费 |
| **本地 vLLM** | `http://localhost:8000/v1` | meta-llama/Llama-3-8b-chat-hf | 高性能推理 |

### 配置示例

#### OpenAI (官方)
```bash
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=gpt-4o-mini
```

#### DeepSeek (推荐国产替代)
```bash
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=deepseek-chat
```

#### 智谱 AI (GLM)
```bash
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_API_KEY=xxx.xxx
LLM_MODEL=glm-4-flash
```

#### 本地 Ollama
```bash
# 启动 Ollama 服务
OLLAMA_ORIGINS=* ollama serve

# 配置
LLM_BASE_URL=http://localhost:11434/v1
LLM_API_KEY=ollama
LLM_MODEL=llama3
```

## 数据模型

### WordCache 表

缓存已计算的元素组合结果。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| first_word | String | 第一个元素 |
| second_word | String | 第二个元素 |
| result | String | 合成结果 |
| emoji | String | 结果 Emoji |
| lang | String | 语言标识 |
| reasoning_json | Text | 推理信息 (JSON) |
| explanation | Text | 结果解释 |
| created_at | DateTime | 创建时间 |

**索引**：`(first_word, second_word)` - 支持双向查询

### Pydantic 模型

```python
class SynthesisType(str, Enum):
    PHYSICAL_CHEMICAL = "Physical/Chemical"
    CULTURAL_POP = "Cultural/Pop"
    CONCEPTUAL_METAPHORICAL = "Conceptual/Metaphorical"
    LINGUISTIC_WORDPLAY = "Linguistic/Wordplay"
    FUNCTIONAL_TOOL = "Functional/Tool"

class Reasoning(BaseModel):
    type: SynthesisType
    role_first: Optional[str]
    role_second: Optional[str]
    trace: str

class CraftResponseV2(BaseModel):
    word: str
    emoji: str
    lang: str = "en"
    reasoning: Optional[Reasoning]
    explanation: Optional[str]
```

## 核心服务

### LLMService

负责调用 LLM 生成合成结果。

```python
class LLMService:
    async def generate_word(first: str, second: str) -> Tuple[str, str]:
        """基础版：返回 (result, emoji)"""
        
    async def generate_word_v2(first: str, second: str) -> Dict:
        """增强版：返回完整结果字典"""
```

**验证规则**：
- 结果不能超过 3 个词
- 结果不能同时包含两个原词
- 结果必须首字母大写

### CacheService

负责元素组合的双向缓存查询。

```python
class CacheService:
    async def get_cached_result(first: str, second: str) -> Optional[CraftResponse]:
        """双向查询：first+second 或 second+first"""
        
    async def cache_new_word(first: str, second: str, result: str, emoji: str):
        """缓存新组合"""
```

## Docker 部署

### 构建镜像

```bash
docker build -t opencraft-backend .
```

### 运行容器

```bash
docker run -d \
  --name opencraft-backend \
  -p 3000:3000 \
  -e LLM_BASE_URL=https://api.deepseek.com/v1 \
  -e LLM_API_KEY=sk-xxx \
  -e LLM_MODEL=deepseek-chat \
  opencraft-backend
```

### 使用 docker-compose

```yaml
version: '3.8'
services:
  backend:
    build: ./server-python
    ports:
      - "3000:3000"
    environment:
      - LLM_BASE_URL=https://api.deepseek.com/v1
      - LLM_API_KEY=sk-xxx
      - LLM_MODEL=deepseek-chat
```

## 测试

```bash
# 运行所有测试
pytest tests/

# 详细输出
pytest tests/ -v

# 覆盖率报告
pytest tests/ --cov=app
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| HOST | 0.0.0.0 | 监听地址 |
| PORT | 3000 | 监听端口 |
| DATABASE_URL | sqlite+aiosqlite:///./cache.db | 数据库连接 |
| LLM_BASE_URL | https://api.openai.com/v1 | LLM API 地址 |
| LLM_API_KEY | - | LLM API 密钥 |
| LLM_MODEL | gpt-4o-mini | LLM 模型名称 |
| RATE_LIMIT | 100/minute | 请求限流 |

## 相关链接

- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 文档](https://docs.sqlalchemy.org/en/20/)
- [OpenAI API 文档](https://platform.openai.com/docs/)