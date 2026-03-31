import React, { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { useResourcesStore } from '../stores/useResourcesStore'
import { useAchievementStore } from '../stores/useAchievementStore'
import { SoundSettings } from './SoundSettings'

interface HeaderProps {
  onOpenResources?: () => void
  onOpenProgressCenter?: () => void
  onReset?: () => void
  onOpenHelp?: () => void
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenResources,
  onOpenProgressCenter,
  onReset,
  onOpenHelp
}) => {
  const [showSoundSettings, setShowSoundSettings] = useState(false)
  const resources = useResourcesStore((state) => state.resources)
  const getCurrentStage = useResourcesStore((state) => state.getCurrentStage)
  const getUnviewedCount = useAchievementStore((state) => state.getUnviewedCount)
  const ESTIMATED_TOTAL = 100
  
  const currentStage = getCurrentStage()
  const discovered = resources.length
  const percentage = Math.min((discovered / ESTIMATED_TOTAL) * 100, 100)
  const hasNewAchievements = getUnviewedCount() > 0

  return (
    <>
    <header className="h-14 border-b bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 h-full">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧪</span>
          <span className="font-bold text-lg hidden sm:inline">OpenCraft</span>
        </div>
        
        {/* 进度条 + 成长阶段 + 重置 组合 */}
        <div className="flex-1 max-w-lg mx-4 flex items-center gap-3">
          {/* 点击打开进度中心 */}
          <button 
            onClick={onOpenProgressCenter}
            className="flex-1 group cursor-pointer"
            title="查看进度详情"
          >
            <div className="flex items-center gap-2">
              {/* 成长阶段 */}
              <div className={twMerge(
                "flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition relative",
                hasNewAchievements && "animate-pulse-glow bg-yellow-50"
              )}>
                <span className="text-lg">{currentStage.icon}</span>
                <span className="text-xs text-gray-600 hidden sm:inline">{currentStage.name}</span>
                {/* 新成就提示徽章 */}
                {hasNewAchievements && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full animate-badge-pulse">
                    NEW
                  </span>
                )}
              </div>
              
              {/* 进度条 */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{discovered}/{ESTIMATED_TOTAL}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </button>
          
          {/* Reset 按钮 - 紧邻进度条 */}
          <button 
            onClick={onReset}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition flex-shrink-0"
            title={`重置游戏 (将丢失 ${discovered - 4} 个已发现元素)`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        {/* 右侧操作 */}
        <div className="flex items-center gap-2">
          {/* 资源库按钮 - 移动端显示 */}
          <button 
            onClick={onOpenResources}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            title="资源库"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18M15 3v18" />
            </svg>
          </button>
          
          {/* 音效设置 */}
          <button 
            onClick={() => setShowSoundSettings(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            title="音效设置"
          >
            <span className="text-lg">🔊</span>
          </button>
          
          {/* 帮助 */}
          <button 
            onClick={onOpenHelp}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            title="帮助"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
    
    {/* 音效设置弹窗 */}
    <SoundSettings 
      isOpen={showSoundSettings} 
      onClose={() => setShowSoundSettings(false)} 
    />
    </>
  )
}
