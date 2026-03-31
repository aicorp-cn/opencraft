/** 推理过程类型 */
export interface Reasoning {
  thought?: string
  chain?: string[]
  confidence?: number
  alternatives?: string[]
  [key: string]: any
}

/** 源元素信息 */
export interface SourceElement {
  title: string
  emoji: string
}

/** 拖拽项基础数据（用于 @dnd-kit） */
export interface DragItemData {
  emoji: string
  title: string
  lang?: string
  reasoning?: Reasoning
  explanation?: string
  /** 合成源元素 */
  sourceElements?: {
    first: SourceElement
    second: SourceElement
  }
}

/** 拖拽项接口 */
export interface DragItem {
  type: string
  id: string | null
  top: number | null
  left: number | null
  emoji: string
  title: string
}

/** 拖拽项 - 增强版 */
export interface DragItemV2 extends DragItem {
  lang?: string
  reasoning?: Reasoning
  explanation?: string
}

/** API 响应 - 原版 */
export interface CraftResponse {
  result: string
  emoji: string
}

/** API 响应 - 增强版 */
export interface CraftResponseV2 {
  word: string
  emoji: string
  lang: string
  reasoning?: Reasoning
  explanation?: string
}

/** 合成历史记录项 */
export interface HistoryEntry {
  id: string
  timestamp: number
  firstWord: string
  secondWord: string
  result: CraftResponseV2
}

/** 合成类型统计 */
export interface TypeStatistics {
  [key: string]: number
}