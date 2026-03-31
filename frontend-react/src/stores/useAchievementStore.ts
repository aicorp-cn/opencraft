import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** 成就定义 */
export interface AchievementDefinition {
  id: string
  title: string
  description: string
  icon: string
  condition: (discovered: number, syntheses: number) => boolean
}

/** 所有成就定义 */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_discovery',
    title: '初次发现',
    description: '发现第一个新元素',
    icon: '🌱',
    condition: (d) => d >= 1,
  },
  {
    id: 'explorer',
    title: '探索者',
    description: '发现10个元素',
    icon: '🔍',
    condition: (d) => d >= 10,
  },
  {
    id: 'alchemist',
    title: '炼金术士',
    description: '完成25次合成',
    icon: '⚗️',
    condition: (_, s) => s >= 25,
  },
  {
    id: 'master',
    title: '元素大师',
    description: '发现50个元素',
    icon: '🏆',
    condition: (d) => d >= 50,
  },
  {
    id: 'legend',
    title: '传奇创造者',
    description: '发现100个元素',
    icon: '👑',
    condition: (d) => d >= 100,
  },
]

/** 成就状态 */
interface AchievementState {
  /** 已解锁的成就 ID 数组 */
  unlockedIds: string[]
  /** 新解锁未查看的成就 ID 队列（用于通知） */
  pendingNotificationIds: string[]
  /** 是否已初始化 */
  initialized: boolean
  
  /** 检查并更新成就状态，返回新解锁的成就 ID 列表 */
  checkAchievements: (discovered: number, syntheses: number) => string[]
  /** 获取下一个待通知的成就 */
  popNotification: () => string | undefined
  /** 标记成就已查看 */
  markAsViewed: (id: string) => void
  /** 获取未查看成就数量 */
  getUnviewedCount: () => number
  /** 检查成就是否已解锁 */
  isUnlocked: (id: string) => boolean
  /** 重置所有成就（调试用） */
  reset: () => void
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlockedIds: [],
      pendingNotificationIds: [],
      initialized: false,

      checkAchievements: (discovered: number, syntheses: number) => {
        const currentUnlocked = get().unlockedIds
        const newlyUnlocked: string[] = []

        ACHIEVEMENTS.forEach((achievement) => {
          if (!currentUnlocked.includes(achievement.id) && achievement.condition(discovered, syntheses)) {
            newlyUnlocked.push(achievement.id)
          }
        })

        if (newlyUnlocked.length > 0) {
          set((state) => ({
            unlockedIds: [...state.unlockedIds, ...newlyUnlocked],
            pendingNotificationIds: [...state.pendingNotificationIds, ...newlyUnlocked],
            initialized: true,
          }))
        } else {
          set({ initialized: true })
        }

        return newlyUnlocked
      },

      popNotification: () => {
        const pending = get().pendingNotificationIds
        if (pending.length === 0) return undefined
        
        const [first, ...rest] = pending
        set({ pendingNotificationIds: rest })
        return first
      },

      markAsViewed: (_id: string) => {
        // 成就一旦解锁就保持解锁状态，无需特殊处理
        // 此方法预留给未来可能的"已查看"状态追踪
      },

      getUnviewedCount: () => {
        return get().pendingNotificationIds.length
      },

      isUnlocked: (id: string) => {
        return get().unlockedIds.includes(id)
      },

      reset: () => {
        set({
          unlockedIds: [],
          pendingNotificationIds: [],
          initialized: false,
        })
      },
    }),
    {
      name: 'opencraft-achievements',
    }
  )
)

/** 根据 ID 获取成就定义 */
export const getAchievementById = (id: string): AchievementDefinition | undefined => {
  return ACHIEVEMENTS.find((a) => a.id === id)
}