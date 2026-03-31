/**
 * DndContextProviderV2 - 拖拽上下文提供者
 * 
 * 职责：
 * 1. 提供 DndContext 上下文
 * 2. 管理 DragOverlay（拖拽预览）
 * 3. 连接 useDndContext Hook 和 UI 组件
 * 4. 提供 PositionCalculator Context 给 DroppableCanvas
 */

import React, { createContext, useContext } from 'react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import type { Modifier } from '@dnd-kit/core'
import { useDndContext, DragData, PositionCalculator } from './useDndContext'
import type { DragItemData } from '../interfaces'
import { ElementCard } from './ElementCard'

/**
 * 自定义 Modifier：让 DragOverlay 中心对齐鼠标指针
 */
const snapCenterToCursor: Modifier = ({
  transform,
  activatorEvent,
  draggingNodeRect,
}) => {
  if (!draggingNodeRect || !activatorEvent) {
    console.log('[DnD Diagnostic] Modifier 跳过: 无 draggingNodeRect 或 activatorEvent')
    return transform
  }

  const activator = activatorEvent as PointerEvent
  const offsetX = activator.clientX - (draggingNodeRect.left + draggingNodeRect.width / 2)
  const offsetY = activator.clientY - (draggingNodeRect.top + draggingNodeRect.height / 2)

  console.log('[DnD Diagnostic] Modifier 计算:', {
    activatorClientY: activator.clientY,
    draggingNodeRectTop: draggingNodeRect.top,
    draggingNodeRectHeight: draggingNodeRect.height,
    draggingNodeRectCenter: draggingNodeRect.top + draggingNodeRect.height / 2,
    offsetY,
    originalTransformY: transform.y,
    newTransformY: transform.y + offsetY,
  })

  return {
    ...transform,
    x: transform.x + offsetX,
    y: transform.y + offsetY,
  }
}

/** PositionCalculator Context */
const PositionCalculatorContext = createContext<{
  setPositionCalculator: (calculator: PositionCalculator) => void
} | null>(null)

/** Hook for DroppableCanvas to register position calculator */
export function usePositionCalculator() {
  const context = useContext(PositionCalculatorContext)
  if (!context) {
    throw new Error('usePositionCalculator must be used within DndContextProviderV2')
  }
  return context
}

interface DndContextProviderV2Props {
  children: React.ReactNode
}

/** DragOverlay 预览组件 */
function DragOverlayPreview({ 
  emoji, 
  title, 
}: { 
  emoji: string
  title: string
}) {
  return (
    <ElementCard
      emoji={emoji}
      title={title}
      isDragging={true}
      className="shadow-2xl"
    />
  )
}

export function DndContextProviderV2({ children }: DndContextProviderV2Props) {
  const {
    sensors,
    dndState,
    collisionDetection,
    handlers,
    setPositionCalculator,
  } = useDndContext()

  return (
    <PositionCalculatorContext.Provider value={{ setPositionCalculator }}>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handlers.onDragStart}
        onDragMove={handlers.onDragMove}
        onDragEnd={handlers.onDragEnd}
      >
        {children}
        
        {/* 拖拽预览 - 只在资源库拖入时显示，画布内移动时禁用（原始元素已在跟随） */}
        {/* 使用 ElementCard 确保预览与画布元素样式一致 */}
        <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={null}>
          {dndState.activeId && dndState.activeData && dndState.dragType === 'resource' ? (
            <DragOverlayPreview
              emoji={dndState.activeData.elementData.emoji}
              title={dndState.activeData.elementData.title}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </PositionCalculatorContext.Provider>
  )
}

export type { DragData, DragItemData }