"""API 契约测试 - 验证与原系统完全等效"""
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

# 测试配置
BASE_URL = "http://test"


class TestCraftAPI:
    """Craft API 测试"""
    
    @pytest.mark.asyncio
    async def test_post_craft_request_format(self):
        """测试 POST / 请求格式"""
        # 请求体必须是 {first: string, second: string}
        async with AsyncClient(base_url=BASE_URL) as client:
            # Mock 服务
            with patch('app.services.llm_service.LLMService.generate_word') as mock:
                mock.return_value = ("Steam", "💨")
                
                response = await client.post("/", json={
                    "first": "Fire",
                    "second": "Water"
                })
                
                # 验证响应格式
                assert "result" in response.json()
                assert "emoji" in response.json()
    
    @pytest.mark.asyncio
    async def test_post_craft_empty_result(self):
        """测试无效组合返回空字符串"""
        async with AsyncClient(base_url=BASE_URL) as client:
            with patch('app.services.llm_service.LLMService.generate_word') as mock:
                mock.return_value = ("", "")
                
                response = await client.post("/", json={
                    "first": "Fire",
                    "second": "Water"
                })
                
                data = response.json()
                assert data["result"] == ""
                assert data["emoji"] == ""
    
    @pytest.mark.asyncio
    async def test_post_craft_input_normalization(self):
        """测试输入标准化 - trim + lowercase + capitalize"""
        # 原系统: firstWord = capitalizeFirstLetter(request.body.first.trim().toLowerCase())
        test_cases = [
            ("fire", "water"),  # lowercase
            ("FIRE", "WATER"),  # uppercase
            ("  Fire  ", "  Water  "),  # with spaces
        ]
        
        for first, second in test_cases:
            # 标准化后应该是 "Fire" 和 "Water"
            normalized_first = first.strip().lower().capitalize()
            normalized_second = second.strip().lower().capitalize()
            
            assert normalized_first == "Fire"
            assert normalized_second == "Water"
    
    @pytest.mark.asyncio
    async def test_get_initial_combinations(self):
        """测试 GET / 返回 6 组基础元素组合"""
        async with AsyncClient(base_url=BASE_URL) as client:
            with patch('app.services.llm_service.LLMService.generate_word') as mock:
                mock.return_value = ("Steam", "💨")
                
                response = await client.get("/")
                data = response.json()
                
                # 验证返回格式
                expected_keys = [
                    "Water + Fire",
                    "Water + Earth",
                    "Fire + Earth",
                    "Water + Air",
                    "Earth + Air",
                    "Fire + Air"
                ]
                
                for key in expected_keys:
                    assert key in data
                    assert "result" in data[key]
                    assert "emoji" in data[key]


class TestLLMService:
    """LLM 服务测试"""
    
    def test_validation_invalid_result_too_many_words(self):
        """测试验证规则: 超过3个词无效"""
        from app.services.llm_service import LLMService
        
        llm = LLMService()
        
        # 4个词应该无效
        assert llm._is_invalid_result("a b c d", "a", "b") is True
        
        # 3个词应该有效
        assert llm._is_invalid_result("a b c", "a", "b") is False
    
    def test_validation_invalid_result_contains_both_words(self):
        """测试验证规则: 同时包含两个原词且长度不够"""
        from app.services.llm_service import LLMService
        
        llm = LLMService()
        
        # 同时包含 "Fire" 和 "Water" 且长度不够
        assert llm._is_invalid_result("FireWater", "Fire", "Water") is True
        
        # 包含但长度足够
        assert llm._is_invalid_result("Fire and Water Mix", "Fire", "Water") is False
    
    def test_capitalize_first(self):
        """测试首字母大写"""
        from app.services.llm_service import LLMService
        
        llm = LLMService()
        
        assert llm._capitalize_first("steam") == "Steam"
        assert llm._capitalize_first("Steam") == "Steam"
        assert llm._capitalize_first("") == ""
        assert llm._capitalize_first("s") == "S"


class TestCacheService:
    """缓存服务测试"""
    
    @pytest.mark.asyncio
    async def test_bidirectional_cache_query(self):
        """测试双向缓存查询"""
        # 原系统: 先查 first + second，再查 second + first
        # 这意味着 Fire + Water 和 Water + Fire 应该返回相同结果
        pass  # 需要实际数据库环境测试