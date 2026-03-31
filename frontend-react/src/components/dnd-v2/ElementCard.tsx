/**
 * ElementCard - 画布元素卡片组件
 * 
 * 画布元素和 DragOverlay 共用，确保视觉一致性
 */
import { forwardRef } from 'react'
import { CANVAS_ELEMENT_STYLES } from './styles'

interface ElementCardProps {
  /** 元素 emoji */
  emoji: string
  /** 元素标题 */
  title: string
  /** 是否正在被拖拽 */
  isDragging?: boolean
  /** 是否有其他元素悬停在上方（合成目标） */
  isOver?: boolean
  /** 是否加载中 */
  loading?: boolean
  /** 点击回调 */
  onClick?: () => void
  /** 额外样式类名（用于 DragOverlay 增强阴影等） */
  className?: string
}

/**
 * 画布元素卡片
 * - 画布中的元素使用此组件
 * - DragOverlay 预览也使用此组件（确保预览与实际元素一致）
 */
// 使用 forwardRef 包裹组件
export const ElementCard = forwardRef<HTMLDivElement, ElementCardProps>(
  ({ 
    emoji, 
    title, 
    isDragging = false, 
    isOver = false, 
    loading = false, 
    onClick,
    className = '',
  }, ref) => {
    const stateClasses = isOver 
      ? CANVAS_ELEMENT_STYLES.OVER_CLASS 
      : isDragging 
        ? CANVAS_ELEMENT_STYLES.DRAGGING_CLASS 
        : CANVAS_ELEMENT_STYLES.HOVER_CLASS

    return (
      <div
        ref={ref}  // 将 ref 绑定到根元素
        onClick={onClick}
        className={`
          ${CANVAS_ELEMENT_STYLES.BASE_CLASS}
          ${stateClasses}
          ${loading ? 'opacity-60 cursor-wait' : ''}
          ${className}
        `}
      >
        <span className="text-2xl">{loading ? '⏳' : emoji}</span>
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </div>
    )
  }
)

ElementCard.displayName = 'ElementCard'