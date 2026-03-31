"""API 路由 - 完全等效原系统 Fastify 路由"""
from typing import Dict
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.craft import CraftRequest, CraftResponse, CraftResponseV2
from app.services.cache_service import CacheService
from app.services.llm_service import LLMService


router = APIRouter()

# LLM 服务实例（单例）
_llm_service = None


def get_llm_service() -> LLMService:
    """获取 LLM 服务实例"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


def capitalize_first_letter(string: str) -> str:
    """首字母大写 - 等效原系统"""
    if not string:
        return ""
    return string[0].upper() + string[1:]


@router.get("/", response_model=Dict[str, CraftResponse])
async def get_initial_combinations(
    db: AsyncSession = Depends(get_db),
    llm: LLMService = Depends(get_llm_service)
):
    """
    GET / - 获取初始元素组合
    等效原系统: 返回 6 组基础元素组合
    """
    cache_service = CacheService(db)
    
    # 基础元素组合 - 等效原系统
    combinations = [
        ("Water", "Fire"),
        ("Water", "Earth"),
        ("Fire", "Earth"),
        ("Water", "Air"),
        ("Earth", "Air"),
        ("Fire", "Air")
    ]
    
    result = {}
    for first, second in combinations:
        # 先查缓存
        cached = await cache_service.get_cached_result(first, second)
        
        if cached:
            result[f"{first} + {second}"] = cached
        else:
            # 调用 LLM 生成
            word, emoji = await llm.generate_word(first, second)
            
            # 缓存结果
            await cache_service.cache_new_word(first, second, word, emoji)
            
            result[f"{first} + {second}"] = CraftResponse(result=word, emoji=emoji)
    
    return result


@router.post("/", response_model=CraftResponse)
async def craft_word(
    request: CraftRequest,
    db: AsyncSession = Depends(get_db),
    llm: LLMService = Depends(get_llm_service)
):
    """
    POST / - 组合两个元素生成新元素（原版，保持兼容）
    等效原系统: craftNewWord 逻辑
    """
    if not request.first or not request.second:
        return CraftResponse(result="", emoji="")
    
    # 输入处理 - 等效原系统: trim + toLowerCase + capitalizeFirstLetter
    first_word = capitalize_first_letter(request.first.strip().lower())
    second_word = capitalize_first_letter(request.second.strip().lower())
    
    cache_service = CacheService(db)
    
    # 先查缓存
    cached = await cache_service.get_cached_result(first_word, second_word)
    if cached:
        return cached
    
    # 调用 LLM 生成
    result, emoji = await llm.generate_word(first_word, second_word)
    
    # 缓存结果
    await cache_service.cache_new_word(first_word, second_word, result, emoji)
    
    return CraftResponse(result=result, emoji=emoji)


@router.post("/v2", response_model=CraftResponseV2)
async def craft_word_v2(
    request: CraftRequest,
    db: AsyncSession = Depends(get_db),
    llm: LLMService = Depends(get_llm_service)
):
    """
    POST /v2 - 组合两个元素生成新元素（增强版）
    返回完整的推理信息、语言标识和解释
    """
    if not request.first or not request.second:
        return CraftResponseV2(word="", emoji="")
    
    # 输入处理
    first_word = capitalize_first_letter(request.first.strip().lower())
    second_word = capitalize_first_letter(request.second.strip().lower())
    
    cache_service = CacheService(db)
    
    # 先查缓存
    cached = await cache_service.get_cached_result_v2(first_word, second_word)
    if cached:
        return cached
    
    # 调用 LLM 生成（增强版）
    result_data = await llm.generate_word_v2(first_word, second_word)
    
    # 缓存结果（增强版）
    await cache_service.cache_new_word_v2(first_word, second_word, result_data)
    
    return CraftResponseV2(
        word=result_data.get("word", ""),
        emoji=result_data.get("emoji", ""),
        lang=result_data.get("lang", "en"),
        reasoning=result_data.get("reasoning"),
        explanation=result_data.get("explanation")
    )