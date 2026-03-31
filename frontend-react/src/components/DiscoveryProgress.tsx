import React from 'react'
import { useResourcesStore } from '../stores/useResourcesStore'

interface DiscoveryProgressProps {
  variant?: 'default' | 'compact'
}

export const DiscoveryProgress: React.FC<DiscoveryProgressProps> = ({ 
  variant = 'default' 
}) => {
  const resources = useResourcesStore((state) => state.resources)
  const discovered = resources.length
  // 预估可发现元素总数（可通过后端API动态获取）
  const estimated = 100

  const percentage = Math.min((discovered / estimated) * 100, 100)

  // 紧凑模式 - 单行进度条
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">🔬</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
          {discovered}/{estimated}
        </span>
      </div>
    )
  }

  // 默认模式 - 完整卡片
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex justify-between mb-2 items-center">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
          🔬 发现进度
        </span>
        <span className="text-sm text-gray-500 font-medium">
          {discovered}/{estimated}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-gray-400">
        {percentage < 25 ? '🌱 继续探索，发现更多元素！' : 
         percentage < 50 ? '🔥 做得好！你已经发现了四分之一！' :
         percentage < 75 ? '⭐ 太棒了！你是元素大师！' :
         '🏆 传奇！你几乎发现了所有元素！'}
      </div>
    </div>
  )
}