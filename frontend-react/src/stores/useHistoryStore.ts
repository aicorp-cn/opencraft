import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CraftResponseV2, HistoryEntry, TypeStatistics } from '../components/interfaces'

interface HistoryState {
  entries: HistoryEntry[]
  typeStats: TypeStatistics
  
  // 操作
  addEntry: (firstWord: string, secondWord: string, result: CraftResponseV2) => void
  clearHistory: () => void
  getRecentEntries: (limit?: number) => HistoryEntry[]
  getTypeStats: () => TypeStatistics
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      typeStats: {},

      addEntry: (firstWord, secondWord, result) => {
        const entry: HistoryEntry = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          firstWord,
          secondWord,
          result
        }

        set((state) => {
          const newEntries = [entry, ...state.entries].slice(0, 100) // 保留最近100条
          const newStats = { ...state.typeStats }
          
          // 更新类型统计
          if (result.reasoning?.type) {
            const typeKey = result.reasoning.type
            newStats[typeKey] = (newStats[typeKey] || 0) + 1
          }

          return {
            entries: newEntries,
            typeStats: newStats
          }
        })
      },

      clearHistory: () => {
        set(() => ({
          entries: [],
          typeStats: {}
        }))
      },

      getRecentEntries: (limit = 10) => {
        return get().entries.slice(0, limit)
      },

      getTypeStats: () => {
        return get().typeStats
      }
    }),
    {
      name: 'synthesis-history'
    }
  )
)