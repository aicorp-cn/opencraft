import React, { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { useAchievementStore, ACHIEVEMENTS } from '../stores/useAchievementStore'
import { useResourcesStore } from '../stores/useResourcesStore'
import { useHistoryStore } from '../stores/useHistoryStore'
import { AchievementShareCard } from './AchievementShareCard'

interface AchievementProgress {
  current: number
  target: number
}

/** 获取成就进度 */
const getAchievementProgress = (id: string, discovered: number, syntheses: number): AchievementProgress => {
  const targets: Record<string, { current: number; target: number }> = {
    'first_discovery': { current: discovered, target: 1 },
    'explorer': { current: discovered, target: 10 },
    'alchemist': { current: syntheses, target: 25 },
    'master': { current: discovered, target: 50 },
    'legend': { current: discovered, target: 100 },
  }
  return targets[id] || { current: 0, target: 1 }
}

export const Achievements: React.FC = () => {
  const isUnlocked = useAchievementStore((state) => state.isUnlocked)
  const unlockedIds = useAchievementStore((state) => state.unlockedIds)
  const [showShareCard, setShowShareCard] = useState(false)
  
  // 从 zustand store 获取数据（正确的数据源）
  const resources = useResourcesStore((state) => state.resources)
  const historyEntries = useHistoryStore((state) => state.entries)
  const discovered = resources.length
  const syntheses = historyEntries.length

  const unlockedCount = unlockedIds.length

  return (
    <>
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex justify-between mb-3 items-center">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            🎖️ 成就
          </span>
          <div className="flex items-center gap-2">
            {unlockedCount > 0 && (
              <button
                onClick={() => setShowShareCard(true)}
                className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
              >
                📤 分享
              </button>
            )}
            <span className="text-xs text-gray-400">
              {unlockedCount}/{ACHIEVEMENTS.length}
            </span>
          </div>
        </div>
      <div className="grid grid-cols-5 gap-2">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = isUnlocked(achievement.id)
          const progress = getAchievementProgress(achievement.id, discovered, syntheses)
          const percentage = Math.min((progress.current / progress.target) * 100, 100)
          
          return (
            <div
              key={achievement.id}
              className={twMerge(
                "relative group flex flex-col items-center justify-center p-2 rounded-lg transition-all",
                unlocked
                  ? "bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200"
                  : "bg-gray-50 border border-gray-200"
              )}
              title={achievement.title}
            >
              {/* 图标 */}
              <span className={twMerge(
                "text-2xl transition-transform",
                unlocked ? "animate-float" : "grayscale opacity-50"
              )}>
                {achievement.icon}
              </span>
              
              {/* 进度条（未解锁时显示） */}
              {!unlocked && percentage > 0 && (
                <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
              
              {/* NEW 徽章（新解锁且未查看） */}
              {unlocked && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full animate-badge-pulse">
                  NEW
                </div>
              )}
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  <div className="font-semibold">{achievement.title}</div>
                  <div className="text-gray-300">{achievement.description}</div>
                  {!unlocked && (
                    <div className="text-yellow-400 mt-1">
                      进度: {progress.current}/{progress.target}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      </div>
      
      {/* 分享卡片弹窗 */}
      <AchievementShareCard
        isOpen={showShareCard}
        onClose={() => setShowShareCard(false)}
        discovered={discovered}
        syntheses={syntheses}
        achievements={unlockedIds.map(id => ACHIEVEMENTS.find(a => a.id === id)!).filter(Boolean)}
      />
    </>
  )
}
