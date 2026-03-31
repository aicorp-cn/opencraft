/**
 * DraggableResourceItem - 资源库可拖拽元素
 * 
 * 职责：
 * 1. 作为拖拽源（可拖入画布或拖到画布元素上合成）
 * 2. 渲染资源卡片 UI（响应式设计）
 * 3. 显示发现时间
 */

import { useDraggable } from '@dnd-kit/core'
import type { DragData } from './useDndContext'
import { formatRelativeTime } from '../../utils/timeFormat'
import { twMerge } from 'tailwind-merge'

interface SourceElement {
  title: string
  emoji: string
}

interface DraggableResourceItemProps {
  title: string
  emoji: string
  lang?: string
  reasoning?: any
  explanation?: string
  discoveredAt?: number
  /** 合成源元素 */
  sourceElements?: {
    first: SourceElement
    second: SourceElement
  }
  onClick?: () => void
  /** 是否为移动端模式 */
  isMobile?: boolean
}


export function DraggableResourceItem({
  title,
  emoji,
  lang,
  reasoning,
  explanation,
  discoveredAt,
  sourceElements,
  onClick,
  isMobile = false,
}: DraggableResourceItemProps) {

  // 计算时间徽章状态
  const getTimeBadge = (discoveredAt?: number): { type: 'new' } | { type: 'time'; text: string } | null => {
    if (!discoveredAt) return null

    const elapsed = Date.now() - discoveredAt
    const minutes = elapsed / (60 * 1000)

    if (minutes < 1) {
      return { type: 'new' }
    } else if (minutes < 10) {
      return { type: 'time', text: formatRelativeTime(discoveredAt) }
    }
    return null
  }

  const timeBadge = getTimeBadge(discoveredAt)

  const id = `resource-${title}`

  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id,
    data: {
      type: 'resource',
      elementData: { title, emoji, lang, reasoning, explanation, sourceElements },
    } satisfies DragData,
  })

  // 不应用 transform，DragOverlay 会负责显示拖拽预览
  const style = {
    // 拖拽时隐藏原始元素，DragOverlay 会显示预览
    opacity: isDragging ? 0 : 1,
  }

  // 移动端紧凑样式
  if (isMobile) {
    return (
      <div
        ref={setNodeRef}
        data-draggable-id={id}
        style={style}
        {...listeners}
        {...attributes}
        onClick={onClick}
        className={twMerge(
          "relative flex flex-col items-center justify-center",
          "p-1 rounded-lg",
          "bg-gradient-to-br from-white to-gray-50",
          "border border-gray-200",
          "cursor-grab active:cursor-grabbing active:scale-95",
          "hover:border-blue-300 hover:shadow-sm hover:bg-white",
          "select-none",
          "aspect-square",
          isDragging && "shadow-lg border-blue-400 bg-blue-50",
          "transition-all duration-150"
        )}
        title={title}
        role="button"
        aria-label={`拖拽 ${title}`}
      >
        {/* 新发现标记 - 左上角 */}
        {timeBadge?.type === 'new' && (
          <span className="absolute top-0 left-0 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        )}

        {/* Emoji */}
        <span className="text-lg leading-none select-none">{emoji}</span>

        {/* 标题 - 两行显示 */}
        <span className="text-xs text-gray-600 mt-0.5 w-full text-center leading-tight line-clamp-2 overflow-hidden">
          {title}
        </span>
      </div>
    )
  }

  // 桌面端完整样式 - 两行垂直布局
  return (
    <div
      ref={setNodeRef}
      data-draggable-id={id}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={twMerge(
        "relative flex flex-col items-center justify-center",
        "p-1 rounded-lg",
        "bg-gradient-to-br from-white to-gray-50",
        "border border-gray-200",
        "cursor-grab active:cursor-grabbing active:scale-[0.98]",
        "hover:border-blue-300 hover:shadow-md hover:from-white hover:to-white",
        "transition-all duration-150",
        "select-none group",
        "aspect-square",
        isDragging && "shadow-xl border-blue-400 bg-blue-50"
      )}
      title={title}
      role="button"
      aria-label={`拖拽 ${title}`}
    >
      {/* 时间徽章 - 元素卡左上角 */}
      {timeBadge && (
        <span className={twMerge(
          "absolute top-2 left-2 px-1 py-0.5 text-[9px] font-medium rounded-full whitespace-nowrap z-10",
          timeBadge.type === 'new' 
            ? "bg-green-500 text-white" 
            : "bg-gray-200 text-gray-500"
        )}>
          {timeBadge.type === 'new' ? 'New' : timeBadge.text}
        </span>
      )}

      {/* Emoji */}
      <span className="text-xl leading-none select-none">{emoji}</span>


      {/* 标题 - 两行显示 */}
      <span className="text-xs text-gray-600 mt-0.5 w-full text-center leading-tight line-clamp-2 overflow-hidden">
        {title}
      </span>
    </div>
  )
}