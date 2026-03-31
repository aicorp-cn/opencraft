/**
 * 画布元素样式常量
 * 
 * 所有画布相关组件（DraggableCanvasElement、DragOverlay）统一使用
 * 确保视觉一致性
 * 
 * 注意：元素尺寸由 DOM 动态测量，不再使用硬编码值
 */

export const CANVAS_ELEMENT_STYLES = {
  /** 基础 Tailwind 类名 */
  BASE_CLASS: 'inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg shadow-sm cursor-grab active:cursor-grabbing select-none touch-none',
  
  /** 拖拽中状态 */
  DRAGGING_CLASS: 'shadow-xl border-blue-400',
  
  /** hover 状态 */
  HOVER_CLASS: 'hover:border-blue-300 hover:shadow-md',
  
  /** 悬停在目标上（合成目标高亮） */
  OVER_CLASS: 'border-green-400 bg-green-50 ring-2 ring-green-300',
} as const

/** 元素尺寸类型 */
export interface ElementSize {
  width: number
  height: number
}
