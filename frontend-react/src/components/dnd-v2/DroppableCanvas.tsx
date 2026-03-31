/**
 * DroppableCanvas - 画布放置区组件
 * 
 * 职责：
 * 1. 作为拖拽目标区域
 * 2. 提供位置计算能力
 * 3. 渲染画布内的元素
 */

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { DraggableCanvasElement } from './DraggableCanvasElement'
import { useBoxesStore } from '../../stores/useBoxesStore'
import { usePositionCalculator } from './DndContextProviderV2'
import type { PositionCalculator } from './useDndContext'
import type { ElementSize } from './styles'

/** 默认元素尺寸（仅在测量失败时使用） */
const DEFAULT_ELEMENT_SIZE: ElementSize = { width: 100, height: 40 }

export interface DroppableCanvasRef {
  getPositionCalculator: () => PositionCalculator
  getRect: () => DOMRect | null
}

interface DroppableCanvasProps {
  /** 元素点击回调 */
  onElementClick?: (box: { 
    id: string
    title: string
    emoji: string
    lang?: string
    reasoning?: any
    explanation?: string
    sourceElements?: {
      first: { title: string; emoji: string }
      second: { title: string; emoji: string }
    }
  }) => void
}

export const DroppableCanvas = forwardRef<DroppableCanvasRef, DroppableCanvasProps>(
  ({ onElementClick }, ref) => {
    const boxes = useBoxesStore((state) => state.boxes)
    const containerRef = useRef<HTMLDivElement>(null)
    
    // 获取 setPositionCalculator 从 Context
    const { setPositionCalculator } = usePositionCalculator()

    // 注册为放置目标
    const { setNodeRef, isOver } = useDroppable({
      id: 'canvas-container',
      data: {
        type: 'canvas-container',
      },
    })

    // 合并 ref
    const combinedRef = useCallback((node: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      setNodeRef(node)
    }, [setNodeRef])

    // 位置计算器
    // 支持传入元素尺寸，让元素中心对齐鼠标位置
    const positionCalculator: PositionCalculator = useCallback((
      clientX: number, 
      clientY: number, 
      elementSize?: ElementSize
    ) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return null

      // 使用传入的尺寸或默认尺寸（仅在测量失败时使用）
      const size = elementSize ?? DEFAULT_ELEMENT_SIZE
      
      // 元素中心对齐鼠标 → 左上角 = 鼠标位置 - 尺寸/2
      const left = clientX - rect.left - size.width / 2
      const top = clientY - rect.top - size.height / 2

      // 边界约束：确保元素完全在画布内
      return {
        left: Math.max(0, Math.min(left, rect.width - size.width)),
        top: Math.max(0, Math.min(top, rect.height - size.height)),
      }
    }, [])

    // 注册位置计算器到 Context
    useEffect(() => {
      setPositionCalculator(positionCalculator)
    }, [positionCalculator, setPositionCalculator])

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      getPositionCalculator: () => positionCalculator,
      getRect: () => containerRef.current?.getBoundingClientRect() ?? null,
    }), [positionCalculator])

    return (
      <div
        ref={combinedRef}
        className={`
          absolute inset-0 transition-colors duration-150
          ${isOver ? 'bg-blue-50' : ''}
        `}
      >
        {/* 网格背景 */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* 渲染画布元素 */}
        {Object.entries(boxes).map(([key, value]) => (
          <DraggableCanvasElement
            key={key}
            id={key}
            left={value.left}
            top={value.top}
            title={value.title}
            emoji={value.emoji}
            lang={value.lang}
            reasoning={value.reasoning}
            explanation={value.explanation}
            loading={value.loading}
            onClick={() => onElementClick?.({ id: key, ...value })}
          />
        ))}
      </div>
    )
  }
)

DroppableCanvas.displayName = 'DroppableCanvas'