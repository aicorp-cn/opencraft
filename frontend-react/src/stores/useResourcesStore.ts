import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Reasoning } from '../components/interfaces'

/** 元素分类 */
export type ElementCategory = 'basic' | 'nature' | 'artifact' | 'abstract'

/** 成长阶段 */
export interface GrowthStage {
  id: string
  name: string
  icon: string
  minElements: number
  maxElements: number
}

/** 预定义成长阶段 */
export const GROWTH_STAGES: GrowthStage[] = [
  { id: 'novice', name: '新手', icon: '🌱', minElements: 0, maxElements: 10 },
  { id: 'explorer', name: '探索者', icon: '🔥', minElements: 11, maxElements: 30 },
  { id: 'alchemist', name: '炼金师', icon: '⭐', minElements: 31, maxElements: 60 },
  { id: 'master', name: '大师', icon: '🏆', minElements: 61, maxElements: 100 },
]

/** 预估可发现元素总数 */
export const ESTIMATED_TOTAL = 100

/** 源元素信息 */
export interface SourceElement {
  title: string
  emoji: string
}

export interface ResourceStoreEntry {
  title: string
  emoji: string
  lang?: string
  reasoning?: Reasoning
  explanation?: string
  category?: ElementCategory
  /** 发现时间戳 */
  discoveredAt?: number
  /** 合成源元素（记录此元素是由哪两个元素合成的） */
  sourceElements?: {
    first: SourceElement
    second: SourceElement
  }
}

interface ResourcesState {
  resources: ResourceStoreEntry[]
  addResource: (resource: ResourceStoreEntry) => void
  hasResource: (title: string) => boolean
  resetResources: () => void
  getCategory: (title: string) => ElementCategory
  getCurrentStage: () => GrowthStage
  getNextStageProgress: () => { current: number; required: number; stage: GrowthStage | null }
  getResourcesByCategory: (category: ElementCategory) => ResourceStoreEntry[]
}

/** 分类关键词映射 */
const CATEGORY_KEYWORDS: Record<ElementCategory, string[]> = {
  basic: ['Fire', 'Water', 'Earth', 'Air'],
  nature: ['Tree', 'Plant', 'Animal', 'Ocean', 'Mountain', 'Forest', 'River', 'Lake', 'Cloud', 'Rain', 'Storm', 'Wind', 'Sun', 'Moon', 'Star', 'Life', 'Creature', 'Bird', 'Fish', 'Insect'],
  artifact: ['Tool', 'Machine', 'Building', 'Vehicle', 'Weapon', 'Bridge', 'House', 'Tower', 'Engine', 'Wheel', 'Metal', 'Glass', 'Brick', 'Road', 'Boat', 'Car', 'Plane'],
  abstract: ['Time', 'Space', 'Energy', 'Force', 'Love', 'Death', 'Life', 'Soul', 'Mind', 'Knowledge', 'Wisdom', 'Magic', 'Spirit', 'Chaos', 'Order', 'Void', 'Infinity'],
}

/** 判断元素分类 */
const determineCategory = (title: string): ElementCategory => {
  // 基础元素精确匹配
  if (CATEGORY_KEYWORDS.basic.includes(title)) return 'basic'
  
  // 其他分类关键词匹配
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'basic') continue
    if (keywords.some(k => title.toLowerCase().includes(k.toLowerCase()))) {
      return category as ElementCategory
    }
  }
  
  return 'abstract'
}

export const useResourcesStore = create<ResourcesState>()(
  persist(
    (set, get) => ({
      resources: [
        { title: 'Fire', emoji: '🔥', category: 'basic' },
        { title: 'Water', emoji: '💧', category: 'basic' },
        { title: 'Earth', emoji: '🌍', category: 'basic' },
        { title: 'Air', emoji: '💨', category: 'basic' },
      ],

      addResource: (resource) => {
        set((state) => ({
          resources: [...state.resources, { 
            ...resource, 
            category: resource.category || determineCategory(resource.title),
            discoveredAt: resource.discoveredAt || Date.now(),
          }],
        }))
      },

      hasResource: (title) => {
        return get().resources.some((r) => r.title === title)
      },

      resetResources: () => {
        set({
          resources: [
            { title: 'Fire', emoji: '🔥', category: 'basic' },
            { title: 'Water', emoji: '💧', category: 'basic' },
            { title: 'Earth', emoji: '🌍', category: 'basic' },
            { title: 'Air', emoji: '💨', category: 'basic' },
          ],
        })
      },

      getCategory: (title: string): ElementCategory => {
        const resource = get().resources.find(r => r.title === title)
        if (resource?.category) return resource.category
        return determineCategory(title)
      },

      getCurrentStage: (): GrowthStage => {
        const count = get().resources.length
        const stage = GROWTH_STAGES.find(s => count >= s.minElements && count <= s.maxElements)
        return stage || GROWTH_STAGES[0]
      },

      getNextStageProgress: () => {
        const count = get().resources.length
        const currentStageIndex = GROWTH_STAGES.findIndex(s => count >= s.minElements && count <= s.maxElements)
        const nextStage = GROWTH_STAGES[currentStageIndex + 1]
        
        if (!nextStage) {
          return { current: count, required: ESTIMATED_TOTAL, stage: null }
        }
        
        return { 
          current: count - (GROWTH_STAGES[currentStageIndex]?.minElements || 0), 
          required: nextStage.minElements - (GROWTH_STAGES[currentStageIndex]?.minElements || 0), 
          stage: nextStage 
        }
      },

      getResourcesByCategory: (category: ElementCategory) => {
        return get().resources.filter(r => {
          if (r.category) return r.category === category
          return determineCategory(r.title) === category
        })
      },
    }),
    {
      name: 'opencraft/resources',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
