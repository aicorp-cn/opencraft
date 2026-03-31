/**
 * DraggableCanvasElement - 画布内可拖拽元素
 * 
 * 职责：
 * 1. 作为拖拽源（可在画布内移动或拖到其他元素上合成）
 * 2. 作为放置目标（可接收其他元素的放置）
 * 3. 使用 ElementCard 渲染元素卡片 UI（与 DragOverlay 保持一致）
 */

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ElementCard } from './ElementCard'
import type { DragData } from './useDndContext'

interface DraggableCanvasElementProps {
  id: string
  left: number
  top: number
  title: string
  emoji: string
  lang?: string
  reasoning?: any
  explanation?: string
  loading?: boolean
  onClick?: () => void
}

export function DraggableCanvasElement({
  id,
  left,
  top,
  title,
  emoji,
  lang,
  reasoning,
  explanation,
  loading,
  onClick,
}: DraggableCanvasElementProps) {
  // 作为拖拽源
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `canvas-element-${id}`,
    data: {
      type: 'canvas-element',
      elementData: { title, emoji, lang, reasoning, explanation },
      position: { left, top },
    } satisfies DragData,
  })

  // 作为放置目标（用于合成）
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `canvas-element-${id}`,
    data: {
      type: 'canvas-element',
      elementData: { title, emoji, lang, reasoning, explanation },
    } satisfies DragData,
  })

  // 合并 ref
  const setRef = (node: HTMLElement | null) => {
    setDraggableRef(node)
    setDroppableRef(node)
  }

  // 原始元素跟随 transform 移动，释放时自然定格在新位置
  // 不隐藏元素，保持视觉连续性
  const style = {
    position: 'absolute' as const,
    left,
    top,
    // 应用 transform 让元素跟随拖拽移动
    transform: CSS.Translate.toString(transform),
    // 不隐藏元素，保持视觉连续
    opacity: 1,
    zIndex: isDragging ? 1000 : 1,
    // 拖拽时禁用过渡，释放时也无过渡（元素已在正确位置）
    transition: 'none',
  }

  return (
    <div
      ref={setRef}
      data-draggable-id={`canvas-element-${id}`}
      style={style}
      {...listeners}
      {...attributes}
    >
      <ElementCard
        emoji={emoji}
        title={title}
        isDragging={isDragging}
        isOver={isOver}
        loading={loading}
        onClick={onClick}
      />
    </div>
  )
}