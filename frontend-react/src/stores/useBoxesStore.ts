import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Reasoning } from '../components/interfaces'

/** 源元素信息 */
export interface SourceElement {
  title: string
  emoji: string
}

/** 元素条目 - 增强版 */
export interface BoxStoreEntry {
  top: number
  left: number
  title: string
  emoji: string
  loading?: boolean
  // 增强字段
  lang?: string
  reasoning?: Reasoning
  explanation?: string
  // 合成源元素（记录此元素是由哪两个元素合成的）
  sourceElements?: {
    first: SourceElement
    second: SourceElement
  }
}

interface BoxesState {
  boxes: Record<string, BoxStoreEntry>
  /** 被锁定的元素 ID 映射表（键天然唯一，O(1) 查找） */
  lockedBoxes: Record<string, boolean>
  
  addBox: (box: BoxStoreEntry) => string
  addBoxV2: (box: BoxStoreEntry & { id?: string }) => string
  removeBox: (id: string) => void
  updateBoxPosition: (id: string, left: number, top: number) => void
  setBoxLoading: (id: string, loading: boolean) => void
  updateBoxData: (id: string, data: Partial<BoxStoreEntry>) => void
  resetBoxes: () => void
  
  /** 锁定多个元素，返回是否全部成功（若任一已锁定则返回 false） */
  lockBoxes: (ids: string[]) => boolean
  /** 解锁多个元素 */
  unlockBoxes: (ids: string[]) => void
  /** 检查单个元素是否被锁定 */
  isBoxLocked: (id: string) => boolean
}

export const useBoxesStore = create<BoxesState>()(
  immer((set, get) => ({
    boxes: {
      a: { top: 20, left: 80, title: 'Fire', emoji: '🔥' },
    },
    lockedBoxes: {},

    addBox: (box) => {
      const randomId = Math.random().toString(36).substring(2, 7)
      set((state) => {
        state.boxes[randomId] = box
      })
      return randomId
    },

    addBoxV2: (box) => {
      const id = box.id || Math.random().toString(36).substring(2, 7)
      set((state) => {
        state.boxes[id] = {
          top: box.top,
          left: box.left,
          title: box.title,
          emoji: box.emoji,
          loading: box.loading,
          lang: box.lang,
          reasoning: box.reasoning,
          explanation: box.explanation,
          sourceElements: box.sourceElements,
        }
      })
      return id
    },

    removeBox: (id) => {
      set((state) => {
        delete state.boxes[id]
      })
    },

    updateBoxPosition: (id, left, top) => {
      set((state) => {
        if (state.boxes[id]) {
          state.boxes[id].left = left
          state.boxes[id].top = top
        }
      })
    },

    setBoxLoading: (id, loading) => {
      set((state) => {
        if (state.boxes[id]) {
          state.boxes[id].loading = loading
        }
      })
    },

    updateBoxData: (id, data) => {
      set((state) => {
        if (state.boxes[id]) {
          Object.assign(state.boxes[id], data)
        }
      })
    },

    resetBoxes: () => {
      set((state) => {
        state.boxes = {
          a: { top: 20, left: 80, title: 'Fire', emoji: '🔥' },
        }
        state.lockedBoxes = {}
      })
    },

    lockBoxes: (ids) => {
      const { lockedBoxes } = get()
      // 检查是否有已被锁定的元素（O(1) 查找）
      const hasConflict = ids.some(id => lockedBoxes[id])
      if (hasConflict) return false
      
      set((state) => {
        // 对象键天然唯一，无需额外去重检查
        ids.forEach(id => {
          state.lockedBoxes[id] = true
        })
      })
      return true
    },

    unlockBoxes: (ids) => {
      set((state) => {
        ids.forEach(id => {
          delete state.lockedBoxes[id]
        })
      })
    },

    isBoxLocked: (id) => {
      return !!get().lockedBoxes[id]
    },
  }))
)
