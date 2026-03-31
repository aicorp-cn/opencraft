"""缓存服务 - 等效原系统 craftNewWordFromCache 和 cacheNewWord"""
import json
from typing import Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.word_cache import WordCache
from app.schemas.craft import CraftResponse, CraftResponseV2, Reasoning


class CacheService:
    """缓存服务 - 双向查询完全等效原系统"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_cached_result(
        self, first_word: str, second_word: str
    ) -> Optional[CraftResponse]:
        """
        双向查询缓存 - 等效原系统 craftNewWordFromCache
        先查 first + second，再查 second + first
        """
        # 查询 first + second
        result = await self.db.execute(
            select(WordCache).where(
                WordCache.first_word == first_word,
                WordCache.second_word == second_word
            )
        )
        cached = result.scalar_one_or_none()
        
        if cached:
            return CraftResponse(result=cached.result or "", emoji=cached.emoji or "")
        
        # 反向查询 second + first (等效原系统)
        result = await self.db.execute(
            select(WordCache).where(
                WordCache.first_word == second_word,
                WordCache.second_word == first_word
            )
        )
        cached = result.scalar_one_or_none()
        
        if cached:
            return CraftResponse(result=cached.result or "", emoji=cached.emoji or "")
        
        return None
    
    async def get_cached_result_v2(
        self, first_word: str, second_word: str
    ) -> Optional[CraftResponseV2]:
        """
        双向查询缓存 - 增强版（返回完整信息）
        """
        # 查询 first + second
        result = await self.db.execute(
            select(WordCache).where(
                WordCache.first_word == first_word,
                WordCache.second_word == second_word
            )
        )
        cached = result.scalar_one_or_none()
        
        if not cached:
            # 反向查询 second + first
            result = await self.db.execute(
                select(WordCache).where(
                    WordCache.first_word == second_word,
                    WordCache.second_word == first_word
                )
            )
            cached = result.scalar_one_or_none()
        
        if cached:
            reasoning = None
            if cached.reasoning_json:
                try:
                    reasoning_data = json.loads(cached.reasoning_json)
                    reasoning = Reasoning(**reasoning_data)
                except (json.JSONDecodeError, TypeError):
                    pass
            
            return CraftResponseV2(
                word=cached.result or "",
                emoji=cached.emoji or "",
                lang=cached.lang or "en",
                reasoning=reasoning,
                explanation=cached.explanation
            )
        
        return None
    
    async def cache_new_word(
        self, first_word: str, second_word: str, result: str, emoji: str
    ) -> None:
        """缓存新组合 - 等效原系统 cacheNewWord"""
        cache_entry = WordCache(
            first_word=first_word,
            second_word=second_word,
            result=result,
            emoji=emoji
        )
        self.db.add(cache_entry)
        await self.db.commit()
    
    async def cache_new_word_v2(
        self, 
        first_word: str, 
        second_word: str, 
        result_data: Dict[str, Any]
    ) -> None:
        """缓存新组合 - 增强版（包含完整信息）"""
        reasoning_json = None
        if result_data.get("reasoning"):
            reasoning_json = json.dumps(result_data["reasoning"])
        
        cache_entry = WordCache(
            first_word=first_word,
            second_word=second_word,
            result=result_data.get("word", ""),
            emoji=result_data.get("emoji", ""),
            lang=result_data.get("lang", "en"),
            reasoning_json=reasoning_json,
            explanation=result_data.get("explanation")
        )
        self.db.add(cache_entry)
        await self.db.commit()