/**
 * dnd-v2 模块导出
 * 
 * 基于 dnd-kit 最佳实践的拖拽系统
 */

export { useDndContext } from './useDndContext'
export type { DragData, DndState, UseDndContextReturn, PositionCalculator } from './useDndContext'

export { DndContextProviderV2, usePositionCalculator } from './DndContextProviderV2'

export { DroppableCanvas } from './DroppableCanvas'
export type { DroppableCanvasRef } from './DroppableCanvas'

export { DraggableResourceItem } from './DraggableResourceItem'
export { DraggableCanvasElement } from './DraggableCanvasElement'
export { ResourceSidebarV2 } from './ResourceSidebarV2'

// 画布元素样式和组件
export { ElementCard } from './ElementCard'
export { CANVAS_ELEMENT_STYLES } from './styles'
export type { ElementSize } from './styles'
