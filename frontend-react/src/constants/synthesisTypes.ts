/**
 * 合成类型定义 - 与 LLM 输出对齐
 * 
 * 注意：此类型体系与 ElementCategory（元素分类）是独立的概念
 * - SynthesisType: 描述合成过程的逻辑类型（来自 LLM reasoning.type）
 * - ElementCategory: 描述元素本身的属性分类（前端关键词匹配）
 */

/** 元素分类（用于资源库筛选） */
export const ELEMENT_CATEGORIES = [
  { id: 'all' as const, label: '全部', icon: '🌐' },
  { id: 'basic' as const, label: '基础', icon: '⚡' },
  { id: 'nature' as const, label: '自然', icon: '🌿' },
  { id: 'artifact' as const, label: '人造', icon: '🔧' },
  { id: 'abstract' as const, label: '抽象', icon: '💭' },
] as const


/** 合成类型枚举 - 与 LLM system_prompt.md 对齐 */
export type SynthesisType = 
  | 'Physical/Chemical'
  | 'Cultural/Pop'
  | 'Conceptual/Metaphorical'
  | 'Linguistic/Wordplay'
  | 'Functional/Tool'

/** 合成类型配置 */
export interface SynthesisTypeConfig {
  /** 类型键值（英文） */
  type: SynthesisType
  /** 中文标签 */
  labelZh: string
  /** 英文标签 */
  labelEn: string
  /** 显示图标 */
  icon: string
  /** 文字颜色类 */
  color: string
  /** 背景颜色类 */
  bgColor: string
}

/** 合成类型配置映射 */
export const SYNTHESIS_TYPES: Record<SynthesisType, SynthesisTypeConfig> = {
  'Physical/Chemical': {
    type: 'Physical/Chemical',
    labelZh: '物理/化学',
    labelEn: 'Physical',
    icon: '🧪',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  'Cultural/Pop': {
    type: 'Cultural/Pop',
    labelZh: '文化/流行',
    labelEn: 'Cultural',
    icon: '🎭',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  'Conceptual/Metaphorical': {
    type: 'Conceptual/Metaphorical',
    labelZh: '概念/隐喻',
    labelEn: 'Conceptual',
    icon: '💭',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  'Linguistic/Wordplay': {
    type: 'Linguistic/Wordplay',
    labelZh: '语言/双关',
    labelEn: 'Linguistic',
    icon: '📝',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  'Functional/Tool': {
    type: 'Functional/Tool',
    labelZh: '功能/工具',
    labelEn: 'Functional',
    icon: '🔧',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
}

/** 所有合成类型列表 */
export const SYNTHESIS_TYPE_LIST = Object.values(SYNTHESIS_TYPES)

/**
 * 解析合成类型
 * @param typeStr LLM 返回的类型字符串
 * @returns 合成类型配置，如果无法识别则返回 null
 */
export function parseSynthesisType(typeStr: string | undefined): SynthesisTypeConfig | null {
  if (!typeStr) return null
  
  // 直接匹配
  if (typeStr in SYNTHESIS_TYPES) {
    return SYNTHESIS_TYPES[typeStr as SynthesisType]
  }
  
  // 容错：尝试模糊匹配
  const lowerStr = typeStr.toLowerCase()
  
  if (lowerStr.includes('physical') || lowerStr.includes('chemical')) {
    return SYNTHESIS_TYPES['Physical/Chemical']
  }
  if (lowerStr.includes('cultural') || lowerStr.includes('pop')) {
    return SYNTHESIS_TYPES['Cultural/Pop']
  }
  if (lowerStr.includes('conceptual') || lowerStr.includes('metaphor')) {
    return SYNTHESIS_TYPES['Conceptual/Metaphorical']
  }
  if (lowerStr.includes('linguistic') || lowerStr.includes('wordplay')) {
    return SYNTHESIS_TYPES['Linguistic/Wordplay']
  }
  if (lowerStr.includes('functional') || lowerStr.includes('tool')) {
    return SYNTHESIS_TYPES['Functional/Tool']
  }
  
  return null
}