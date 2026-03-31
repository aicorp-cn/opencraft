/**
 * useDndContext - 拖拽上下文 Hook
 * 
 * 封装所有拖拽逻辑，遵循 dnd-kit 最佳实践
 */

import { useCallback, useState, useEffect, useRef } from 'react'
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
  UniqueIdentifier,
  rectIntersection,
  pointerWithin,
  CollisionDetection,
} from '@dnd-kit/core'
import { useBoxesStore } from '../../stores/useBoxesStore'
import { useResourcesStore } from '../../stores/useResourcesStore'
import { useHistoryStore } from '../../stores/useHistoryStore'
import { useAchievementStore } from '../../stores/useAchievementStore'
import { soundService } from '../../services/soundService'
import { playSuccessAnimation } from '../../utils/animations'
import { toast } from 'sonner'
import axios from 'axios'
import type { CraftResponseV2, DragItemData } from '../interfaces'
import { type ElementSize } from './styles'

/** 拖拽数据类型 */
export interface DragData {
  type: 'resource' | 'canvas-element'
  elementData: DragItemData
  position?: { left: number; top: number }
}

/** 拖拽状态 */
export interface DndState {
  activeId: UniqueIdentifier | null
  activeData: DragData | null
  isDragging: boolean
  dragType: 'resource' | 'canvas' | null
  /** 被拖拽元素的尺寸（动态测量） */
  elementSize: ElementSize | null
}

/** 初始拖拽状态 */
const INITIAL_DND_STATE: DndState = {
  activeId: null,
  activeData: null,
  isDragging: false,
  dragType: null,
  elementSize: null,
}

/** 放置位置计算器 */
export type PositionCalculator = (
  clientX: number, 
  clientY: number, 
  elementSize?: ElementSize
) => { left: number; top: number } | null

/** Hook 返回值 */
export interface UseDndContextReturn {
  /** 传感器配置 */
  sensors: ReturnType<typeof useSensors>
  /** 拖拽状态 */
  dndState: DndState
  /** 碰撞检测策略 */
  collisionDetection: CollisionDetection
  /** 事件处理 */
  handlers: {
    onDragStart: (event: DragStartEvent) => void
    onDragMove: (event: DragMoveEvent) => void
    onDragEnd: (event: DragEndEvent) => void
  }
  /** 拖拽位置（屏幕坐标） */
  dragPosition: { x: number; y: number }
  /** 设置位置计算器 */
  setPositionCalculator: (calculator: PositionCalculator) => void
}

/** 获取被拖拽元素的尺寸 */
function getElementSize(dragId: UniqueIdentifier, dragType: 'resource' | 'canvas'): ElementSize | null {
  const selector = dragType === 'resource'
    ? `[data-draggable-id="${dragId}"]`
    : `[data-draggable-id="canvas-element-${dragId}"]`
  const element = document.querySelector(selector)
  if (element) {
    const rect = element.getBoundingClientRect()
    console.log('[DnD Diagnostic] 原始元素尺寸测量:', {
      dragId,
      dragType,
      selector,
      width: rect.width,
      height: rect.height,
      element
    })
    return { width: rect.width, height: rect.height }
  }
  console.log('[DnD Diagnostic] 未找到原始元素:', { dragId, dragType, selector })
  return null
}

export function useDndContext(): UseDndContextReturn {
  // Store 状态和方法
  const boxes = useBoxesStore((state) => state.boxes)
  const addBox = useBoxesStore((state) => state.addBox)
  const addBoxV2 = useBoxesStore((state) => state.addBoxV2)
  const removeBox = useBoxesStore((state) => state.removeBox)
  const updateBoxPosition = useBoxesStore((state) => state.updateBoxPosition)
  const setBoxLoading = useBoxesStore((state) => state.setBoxLoading)
  const lockBoxes = useBoxesStore((state) => state.lockBoxes)
  const unlockBoxes = useBoxesStore((state) => state.unlockBoxes)
  const isBoxLocked = useBoxesStore((state) => state.isBoxLocked)
  
  const addResource = useResourcesStore((state) => state.addResource)
  const hasResource = useResourcesStore((state) => state.hasResource)
  const resources = useResourcesStore((state) => state.resources)
  
  const addHistory = useHistoryStore((state) => state.addEntry)
  const checkAchievements = useAchievementStore((state) => state.checkAchievements)

  // 拖拽状态
  const [dndState, setDndState] = useState<DndState>(INITIAL_DND_STATE)

  // 拖拽位置（屏幕坐标）- 使用 ref 存储实时位置，避免 React 重渲染延迟
  const dragPositionRef = useRef({ x: 0, y: 0 })
  // 用于组件间共享的状态版本
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  
  // 位置计算器（由 Container 提供）
  // 注意：使用函数式更新避免 React 将函数当作 updater 执行
  const [positionCalculator, setPositionCalculatorState] = useState<PositionCalculator | null>(null)
  
  // 包装 setter，确保函数被正确存储
  const setPositionCalculator = useCallback((calculator: PositionCalculator | null) => {
    setPositionCalculatorState(() => calculator)
  }, [])

  // 配置传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2, // 移动 5px 后才开始拖拽
      },
    }),
    useSensor(KeyboardSensor)
  )


  // 碰撞检测策略
  const collisionDetection: CollisionDetection = useCallback((args) => {
    // 优先使用 pointerWithin（指针精确检测）
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }
    // 回退到 rectIntersection（矩形相交检测）
    return rectIntersection(args)
  }, [])

  // 全局 pointermove 监听 - 拖拽时实时跟踪鼠标位置
  useEffect(() => {
    if (!dndState.isDragging) return

    const handlePointerMove = (e: PointerEvent) => {
      // 直接使用全局鼠标位置，不受 modifier 或虚拟滚动影响
      dragPositionRef.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [dndState.isDragging])

  // 拖拽开始
  const onDragStart = useCallback((event: DragStartEvent) => {
    const { active, activatorEvent } = event
    const data = active.data.current as DragData | undefined

    if (!data) return

    const dragType = data.type === 'resource' ? 'resource' : 'canvas'
    
    // 测量被拖拽元素的尺寸
    const elementSize = getElementSize(active.id, dragType)

    setDndState({
      activeId: active.id,
      activeData: data,
      isDragging: true,
      dragType,
      elementSize,
    })

    // 记录初始位置到 ref 和 state
    if (activatorEvent && 'clientX' in activatorEvent && 'clientY' in activatorEvent) {
      const initialPos = {
        x: (activatorEvent as PointerEvent).clientX,
        y: (activatorEvent as PointerEvent).clientY,
      }
      dragPositionRef.current = initialPos
      setDragPosition(initialPos)
    }
  }, [])

  // 拖拽移动 - 不再需要累加 delta，全局监听器已处理
  const onDragMove = useCallback((_event: DragMoveEvent) => {
    // 空实现 - 位置由全局 pointermove 监听器更新
  }, [])

  // 拖拽结束
  const onDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over, delta, activatorEvent } = event
    const activeData = dndState.activeData
    const elementSize = dndState.elementSize

    // 调试日志：检查拖拽结束时的状态
    console.log('[DnD Diagnostic] onDragEnd 触发:', {
      activeId: active.id,
      activeType: activeData?.type,
      overId: over?.id,
      overData: over?.data.current,
      hasActivatorEvent: !!activatorEvent,
      elementSize,
    })

    // 先处理所有业务逻辑，最后重置状态
    if (!activeData) {
      console.log('[DnD Diagnostic] 无 activeData，退出')
      setDndState(INITIAL_DND_STATE)
      return
    }

    const overData = over?.data.current as DragData | undefined

    // 场景 1：资源库元素拖入画布
    if (activeData.type === 'resource' && over?.id === 'canvas-container') {
      // 调试日志：追踪数据流
      console.log('[DnD Diagnostic] 资源库拖入画布 - 开始处理:', {
        hasPositionCalculator: !!positionCalculator,
        hasActivatorEvent: !!activatorEvent,
        dragPositionRef: dragPositionRef.current,
        elementSize,
      })
      
      if (positionCalculator && activatorEvent && 'clientX' in activatorEvent && 'clientY' in activatorEvent) {
        // 【修复】使用 dragPositionRef（全局 pointermove 实时跟踪的鼠标位置）
        // 原因：delta 会受到 modifier 影响，全局监听器直接获取真实鼠标位置
        const finalX = dragPositionRef.current.x
        const finalY = dragPositionRef.current.y
        
        // 调试日志：追踪数据流
        console.log('[DnD Diagnostic] 资源库拖入画布 - 位置计算参数:', {
          finalX,
          finalY,
          elementSize,
          elementData: activeData.elementData.title,
        })
        
        // 使用测量的元素尺寸
        const position = positionCalculator(finalX, finalY, elementSize ?? undefined)
        
        console.log('[DnD Diagnostic] 资源库拖入画布 - positionCalculator 返回:', position)
        
        if (position) {
          const boxData = {
            left: position.left,
            top: position.top,
            title: activeData.elementData.title,
            emoji: activeData.elementData.emoji,
            lang: activeData.elementData.lang,
            reasoning: activeData.elementData.reasoning,
            explanation: activeData.elementData.explanation,
            sourceElements: activeData.elementData.sourceElements,
          }
          console.log('[DnD Diagnostic] 调用 addBox:', boxData)
          const newId = addBox(boxData)
          console.log('[DnD Diagnostic] addBox 返回的新 ID:', newId)
        } else {
          console.log('[DnD Diagnostic] positionCalculator 返回 null!')
        }
      } else {
        console.log('[DnD Diagnostic] 条件不满足，跳过位置计算')
      }
      setDndState(INITIAL_DND_STATE)
      return
    }

    // 场景 2：画布元素移动
    if (activeData.type === 'canvas-element' && over?.id === 'canvas-container') {
      if (activeData.position) {
        // 提取真实 id（active.id 格式为 canvas-element-${id}）
        const boxId = String(active.id).replace('canvas-element-', '')
        const newLeft = Math.round(activeData.position.left + delta.x)
        const newTop = Math.round(activeData.position.top + delta.y)
        updateBoxPosition(boxId, newLeft, newTop)
      }
      setDndState(INITIAL_DND_STATE)
      return
    }

    // 场景 3：元素合成（放置到另一个元素）
    if (activeData.type === 'canvas-element' && overData?.type === 'canvas-element' && over) {
      await handleMerge(String(active.id), String(over.id), activeData, overData)
      return
    }

    // 场景 4：资源库元素拖到画布元素（合成）
    if (activeData.type === 'resource' && overData?.type === 'canvas-element' && over) {
      await handleMerge(null, String(over.id), activeData, overData)
      return
    }

    // 场景 5：画布元素拖到空白区域（移动）
    if (activeData.type === 'canvas-element' && !over && activeData.position) {
      // 提取真实 id
      const boxId = String(active.id).replace('canvas-element-', '')
      const newLeft = Math.round(activeData.position.left + delta.x)
      const newTop = Math.round(activeData.position.top + delta.y)
      updateBoxPosition(boxId, newLeft, newTop)
    }

    setDndState(INITIAL_DND_STATE)
  }, [dndState.activeData, dndState.elementSize, positionCalculator, addBox, updateBoxPosition])

  // 合成处理
  const handleMerge = useCallback(async (
    sourceId: string | null,
    targetId: string,
    activeData: DragData,
    overData: DragData
  ) => {
    // 提取真实的 box id（去除 canvas-element- 前缀）
    const realSourceId = sourceId ? sourceId.replace('canvas-element-', '') : null
    const realTargetId = targetId.replace('canvas-element-', '')

    // 自身检查
    if (realSourceId === realTargetId) {
      setDndState(INITIAL_DND_STATE)
      return
    }

    // 锁定检查
    if (realSourceId && isBoxLocked(realSourceId)) {
      toast.info('该元素正在合成中')
      setDndState(INITIAL_DND_STATE)
      return
    }
    if (isBoxLocked(realTargetId)) {
      toast.info('目标元素正在合成中')
      setDndState(INITIAL_DND_STATE)
      return
    }

    // 锁定元素
    const idsToLock = realSourceId ? [realSourceId, realTargetId] : [realTargetId]
    if (!lockBoxes(idsToLock)) {
      toast.info('元素已被占用，请稍候')
      setDndState(INITIAL_DND_STATE)
      return
    }

    // 备份状态
    const backup = {
      sourceId: realSourceId,
      targetId: realTargetId,
      sourceBox: realSourceId ? { ...boxes[realSourceId] } : null,
      targetBox: { ...boxes[realTargetId] },
      sourceData: activeData.elementData,
      targetData: overData.elementData,
    }

    setBoxLoading(realTargetId, true)

    try {
      // 移除源元素
      if (realSourceId) {
        removeBox(realSourceId)
      }

      // 调用 API
      const secondTitle = realSourceId ? backup.sourceBox?.title : activeData.elementData.title
      const response = await axios.post<CraftResponseV2>('/api/craft/v2', {
        first: backup.targetBox.title,
        second: secondTitle,
      })

      const data = response.data
      const resultWord = data.word || backup.targetBox.title
      const resultEmoji = data.emoji || backup.targetData.emoji

      // 获取源元素的 emoji
      const sourceEmoji = realSourceId ? backup.sourceBox?.emoji : activeData.elementData.emoji
      
      // 添加新元素（包含源元素信息）
      addBox({
        title: resultWord,
        emoji: resultEmoji,
        left: backup.targetBox.left,
        top: backup.targetBox.top,
        lang: data.lang,
        reasoning: data.reasoning,
        explanation: data.explanation,
        // 记录合成源元素
        sourceElements: {
          first: {
            title: backup.targetBox.title,
            emoji: backup.targetBox.emoji,
          },
          second: {
            title: secondTitle || '',
            emoji: sourceEmoji || '',
          },
        },
      })

      // 更新资源库
      if (!hasResource(resultWord)) {
        addResource({
          title: resultWord,
          emoji: resultEmoji,
          lang: data.lang,
          reasoning: data.reasoning,
          explanation: data.explanation,
          // 记录合成源元素到资源库
          sourceElements: {
            first: {
              title: backup.targetBox.title,
              emoji: backup.targetBox.emoji,
            },
            second: {
              title: secondTitle || '',
              emoji: sourceEmoji || '',
            },
          },
        })
        playSuccessAnimation()
        soundService.playRare()
        soundService.speakNewDiscovery(resultWord)
        toast.success(`🎉 发现新元素: ${resultEmoji} ${resultWord}`)
        checkAchievements(resources.length + 1, 1)
      } else {
        soundService.playSuccess()
        toast.success(`✓ 合成成功: ${resultEmoji} ${resultWord}`)
      }

      // 记录历史
      addHistory(backup.targetBox.title, secondTitle || '', data)

      // 移除目标元素
      removeBox(realTargetId)

      setDndState(INITIAL_DND_STATE)

    } catch (error) {
      console.error('Merge failed:', error)
      soundService.playFail()
      toast.error('合成失败，元素已恢复')

      // 恢复状态：恢复被移除的 sourceBox 和 targetBox
      if (backup.sourceId && backup.sourceBox) {
        addBoxV2({ ...backup.sourceBox, id: backup.sourceId })
      }
      // targetBox 也需要恢复
      addBoxV2({ ...backup.targetBox, id: realTargetId })
      setBoxLoading(realTargetId, false)

      setDndState(INITIAL_DND_STATE)
    } finally {
      unlockBoxes(idsToLock)
    }
  }, [boxes, isBoxLocked, lockBoxes, unlockBoxes, removeBox, addBox, addBoxV2, setBoxLoading, hasResource, addResource, addHistory, checkAchievements, resources.length])

  return {
    sensors,
    dndState,
    collisionDetection,
    handlers: {
      onDragStart,
      onDragMove,
      onDragEnd,
    },
    dragPosition,
    setPositionCalculator,
  }
}