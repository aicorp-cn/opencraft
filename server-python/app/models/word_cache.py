"""元素组合缓存模型"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Index, Text

from app.database import Base


class WordCache(Base):
    """元素组合缓存表 - 扩展版（支持增强字段）"""
    __tablename__ = "word_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    first_word = Column(String, nullable=False)
    second_word = Column(String, nullable=False)
    result = Column(String, nullable=True)
    emoji = Column(String, nullable=True)
    # 新增字段
    lang = Column(String, nullable=True, default="en")
    reasoning_json = Column(Text, nullable=True)  # JSON 格式存储 Reasoning 对象
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 双向查询索引 (等效原系统)
    __table_args__ = (
        Index('idx_words', 'first_word', 'second_word'),
    )