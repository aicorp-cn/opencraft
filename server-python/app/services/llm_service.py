"""LLM 服务 - 支持所有 OpenAI 兼容协议的云端服务"""
import json
from pathlib import Path
from string import Template
from typing import Dict, Any, Tuple, Optional
from openai import AsyncOpenAI

from app.config import settings


class LLMService:
    """
    LLM 服务 - 支持 OpenAI 兼容协议的云端服务
    
    支持的提供商:
    - OpenAI (官方)
    - DeepSeek
    - 智谱 AI (GLM)
    - Moonshot (月之暗面)
    - 硅基流动
    - 本地部署 (Ollama, vLLM)
    
    通过 base_url 参数实现多提供商支持
    """
    
    # 提示词目录
    PROMPTS_DIR = Path(__file__).parent.parent / "prompts"
    
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_BASE_URL
        )
        self.model = settings.LLM_MODEL
        
        # 加载外部提示词
        self._system_prompt = self._load_prompt("system_prompt.md")
        self._user_prompt_template = self._load_prompt("user_prompt.md")
    
    def _load_prompt(self, filename: str) -> str:
        """加载提示词文件"""
        file_path = self.PROMPTS_DIR / filename
        if file_path.exists():
            return file_path.read_text(encoding='utf-8')
        else:
            # 回退到默认提示词
            return self._get_default_system_prompt()
    
    def _get_default_system_prompt(self) -> str:
        """默认系统提示词（兼容旧版）"""
        return """You are a helpful assistant that helps people to craft new things by combining two words into a new word. 
The most important rules that you have to follow with every single answer that you are not allowed to use the words {first} and {second} as part of your answer and that you are only allowed to answer with one thing.

Reply with JSON format:
{
  "word": "Result",
  "emoji": "🔥",
  "lang": "en",
  "reasoning": {
    "type": "Physical/Chemical",
    "role_first": "role description",
    "role_second": "role description", 
    "trace": "reasoning path"
  },
  "explanation": "brief explanation"
}"""
    
    async def generate_word(
        self, first_word: str, second_word: str
    ) -> Tuple[str, str]:
        """
        生成新元素 - 原版接口（保持兼容）
        返回: (result, emoji)
        """
        result_data = await self.generate_word_v2(first_word, second_word)
        return result_data.get("word", ""), result_data.get("emoji", "")
    
    async def generate_word_v2(
        self, first_word: str, second_word: str
    ) -> Dict[str, Any]:
        """
        生成新元素 - 增强版
        返回: 完整的结果字典
        """
        try:
            # 使用 Template 进行变量替换
            user_prompt = Template(self._user_prompt_template).substitute(
                first=first_word,
                second=second_word
            )
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=350  # 增加以容纳增强输出
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            
            # 验证核心结果
            word = result.get("word", "").strip()
            emoji = result.get("emoji", "").strip()
            
            if self._is_invalid_result(word, first_word, second_word):
                return self._fallback_result(first_word, second_word)
            
            # 构建完整结果
            return {
                "word": self._capitalize_first(word),
                "emoji": emoji,
                "lang": result.get("lang", "en"),
                "reasoning": result.get("reasoning"),
                "explanation": result.get("explanation")
            }
            
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            return self._fallback_result(first_word, second_word)
        except Exception as e:
            print(f"LLM generation error: {e}")
            return self._fallback_result(first_word, second_word)
    
    def _is_invalid_result(
        self, result: str, first: str, second: str
    ) -> bool:
        """验证结果有效性"""
        if not result:
            return True
        
        words = result.lower().strip().split()
        
        # 规则1: 超过3个词无效
        if len(words) > 3:
            return True
        
        # 规则2: 同时包含两个原词且长度不够
        first_lower = first.lower()
        second_lower = second.lower()
        result_lower = result.lower()
        
        if (first_lower in result_lower and 
            second_lower in result_lower and
            len(result) < len(first) + len(second) + 2):
            return True
        
        return False
    
    def _capitalize_first(self, string: str) -> str:
        """首字母大写"""
        if not string:
            return ""
        return string[0].upper() + string[1:]
    
    def _fallback_result(self, first: str, second: str) -> Dict[str, Any]:
        """回退结果（当生成失败时）"""
        return {
            "word": "",
            "emoji": "",
            "lang": "en",
            "reasoning": None,
            "explanation": None
        }