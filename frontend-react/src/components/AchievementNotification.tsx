import React, { useEffect, useState, useCallback, useRef } from 'react'
import { twMerge } from 'tailwind-merge'
import { useAchievementStore, getAchievementById, type AchievementDefinition } from '../stores/useAchievementStore'
import { useResourcesStore } from '../stores/useResourcesStore'
import { useHistoryStore } from '../stores/useHistoryStore'
import { playAchievementAnimation } from '../utils/animations'

/** 单个成就弹窗显示时长（毫秒） */
const NOTIFICATION_DURATION = 3500

/** 成就弹窗动画时长（毫秒） */
const ANIMATION_DURATION = 500

export const AchievementNotification: React.FC = () => {
  const resources = useResourcesStore((state) => state.resources)
  const entries = useHistoryStore((state) => state.entries)
  const checkAchievements = useAchievementStore((state) => state.checkAchievements)
  const popNotification = useAchievementStore((state) => state.popNotification)
  // 直接订阅 pendingNotificationIds 数组，而不是通过函数
  const pendingNotificationIds = useAchievementStore((state) => state.pendingNotificationIds)
  
  const [currentAchievement, setCurrentAchievement] = useState<AchievementDefinition | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  
  // 防止重复处理的锁
  const isShowingRef = useRef(false)

  // 检查成就解锁
  useEffect(() => {
    const discovered = resources.length
    const syntheses = entries.length
    checkAchievements(discovered, syntheses)
  }, [resources.length, entries.length, checkAchievements])

  // 处理通知队列
  const showNextNotification = useCallback(() => {
    // 如果正在显示或没有待通知项，直接返回
    if (isShowingRef.current || pendingNotificationIds.length === 0) {
      return
    }
    
    const achievementId = popNotification()
    if (achievementId) {
      const achievement = getAchievementById(achievementId)
      if (achievement) {
        isShowingRef.current = true
        setCurrentAchievement(achievement)
        setIsVisible(true)
        setIsExiting(false)
        
        // 播放成就动画
        playAchievementAnimation()
        
        // 设置自动关闭
        setTimeout(() => {
          setIsExiting(true)
          setTimeout(() => {
            setIsVisible(false)
            setCurrentAchievement(null)
            isShowingRef.current = false
          }, ANIMATION_DURATION)
        }, NOTIFICATION_DURATION)
      }
    }
  }, [pendingNotificationIds.length, popNotification])

  // 监听待通知队列变化 - 使用 pendingNotificationIds.length 作为依赖
  useEffect(() => {
    // 有待通知项且当前没有显示中
    if (pendingNotificationIds.length > 0 && !isVisible && !isShowingRef.current) {
      // 延迟一帧确保状态已更新
      requestAnimationFrame(() => {
        showNextNotification()
      })
    }
  }, [pendingNotificationIds.length, isVisible, showNextNotification])

  if (!isVisible || !currentAchievement) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* 背景光晕 */}
      <div 
        className={twMerge(
          "absolute inset-0 bg-gradient-radial from-yellow-200/30 via-transparent to-transparent transition-opacity duration-500",
          isExiting ? "opacity-0" : "opacity-100"
        )}
      />
      
      {/* 成就卡片 */}
      <div
        className={twMerge(
          "relative bg-gradient-to-br from-yellow-50 via-white to-orange-50",
          "rounded-2xl shadow-2xl border-2 border-yellow-300",
          "px-8 py-6 min-w-[320px] max-w-[400px]",
          "transform transition-all duration-500 ease-out",
          isVisible && !isExiting
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-75 opacity-0 -translate-y-8"
        )}
      >
        {/* 闪光效果 */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shine" />
        </div>
        
        {/* 顶部装饰 */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
            🎉 成就解锁！
          </div>
        </div>
        
        {/* 内容 */}
        <div className="relative text-center pt-2">
          {/* 图标 */}
          <div className="text-6xl mb-3 animate-bounce-slow">
            {currentAchievement.icon}
          </div>
          
          {/* 标题 */}
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            {currentAchievement.title}
          </h3>
          
          {/* 描述 */}
          <p className="text-sm text-gray-500">
            {currentAchievement.description}
          </p>
        </div>
        
        {/* 底部装饰线 */}
        <div className="absolute bottom-0 left-4 right-4 h-1 bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 rounded-full" />
      </div>
    </div>
  )
}