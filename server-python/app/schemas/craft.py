"""API 请求/响应模型 - 完全等效原系统 API 契约"""
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class SynthesisType(str, Enum):
    """合成类型枚举"""
    PHYSICAL_CHEMICAL = "Physical/Chemical"
    CULTURAL_POP = "Cultural/Pop"
    CONCEPTUAL_METAPHORICAL = "Conceptual/Metaphorical"
    LINGUISTIC_WORDPLAY = "Linguistic/Wordplay"
    FUNCTIONAL_TOOL = "Functional/Tool"


class Reasoning(BaseModel):
    """合成推理信息"""
    type: SynthesisType = Field(..., description="合成类型")
    role_first: Optional[str] = Field(None, description="第一个元素的角色")
    role_second: Optional[str] = Field(None, description="第二个元素的角色")
    trace: str = Field(..., description="推理路径")


class CraftRequest(BaseModel):
    """元素组合请求 - 等效原系统 POST / 请求体"""
    first: str
    second: str


class CraftResponse(BaseModel):
    """元素组合响应 - 等效原系统 POST / 响应体"""
    result: str
    emoji: str


class CraftResponseV2(BaseModel):
    """元素组合响应 - 增强版（包含推理信息）"""
    word: str = Field(..., description="合成结果词")
    emoji: str = Field(..., description="结果 emoji")
    lang: str = Field(default="en", description="结果语言")
    reasoning: Optional[Reasoning] = Field(None, description="推理信息")
    explanation: Optional[str] = Field(None, description="结果解释")
    
    @property
    def result(self) -> str:
        """兼容旧版字段"""
        return self.word