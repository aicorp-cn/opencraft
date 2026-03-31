import React, { forwardRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { shareService } from '../services/shareService'
import { toast } from 'sonner'

interface Achievement {
  icon: string
  title: string
  description: string
}

export interface AchievementShareCardProps {
  isOpen: boolean
  onClose: () => void
  discovered: number
  syntheses: number
  achievements: Achievement[]
}

/** 成就分享卡片弹窗 */
export const AchievementShareCard: React.FC<AchievementShareCardProps> = ({
  isOpen,
  onClose,
  discovered,
  syntheses,
  achievements
}) => {
  const [isSharing, setIsSharing] = useState(false)
  const cardRef = React.useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const handleShare = async () => {
    if (!cardRef.current) return
    
    setIsSharing(true)
    try {
      const result = await shareService.shareAchievement(cardRef.current, '我的成就')
      if (result === 'shared') {
        toast.success('分享成功！')
      } else if (result === 'copied') {
        toast.success('图片已复制到剪贴板！')
      } else if (result === 'downloaded') {
        toast.success('图片已保存到本地！')
      } else {
        toast.error('分享失败，请重试')
      }
    } catch (error) {
      console.error('分享失败:', error)
      toast.error('分享失败，请重试')
    } finally {
      setIsSharing(false)
    }
  }

  const date = new Date()
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 分享卡片 */}
        <div
          ref={cardRef}
          className={twMerge(
            'w-80 p-6 rounded-2xl',
            'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
            'border-2 border-indigo-200',
            'shadow-xl'
          )}
        >
          {/* 顶部装饰 */}
          <div className="text-center mb-4">
            <span className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow">
              🎮 OpenCraft
            </span>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/60 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-indigo-600">{discovered}</div>
              <div className="text-xs text-gray-500">发现元素</div>
            </div>
            <div className="bg-white/60 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{syntheses}</div>
              <div className="text-xs text-gray-500">合成次数</div>
            </div>
          </div>

          {/* 已解锁成就 */}
          {achievements.length > 0 && (
            <div className="bg-white/60 rounded-xl p-3 mb-4">
              <div className="text-xs text-gray-500 text-center mb-2">已解锁成就</div>
              <div className="flex justify-center gap-2 flex-wrap">
                {achievements.slice(0, 5).map((a, i) => (
                  <span key={i} className="text-2xl" title={a.title}>{a.icon}</span>
                ))}
                {achievements.length > 5 && (
                  <span className="text-sm text-gray-400">+{achievements.length - 5}</span>
                )}
              </div>
            </div>
          )}

          {/* 分隔线 */}
          <div className="border-t border-indigo-200 pt-3">
            <p className="text-xs text-gray-400 text-center">
              {dateStr}
            </p>
          </div>

          {/* 底部水印 */}
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-400">
            <span>🔷</span>
            <span>元素合成游戏</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className={twMerge(
              "px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
              isSharing
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-500 text-white hover:bg-indigo-600"
            )}
          >
            {isSharing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>生成中...</span>
              </>
            ) : (
              <>
                <span>📤</span>
                <span>保存分享图</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

/** 单个成就分享卡片 - 用于单个成就解锁时分享 */
export const SingleAchievementCard = forwardRef<HTMLDivElement, {
  icon: string
  title: string
  description: string
  unlockedAt: number
  className?: string
}>(
  ({ icon, title, description, unlockedAt, className }, ref) => {
    const date = new Date(unlockedAt)
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`

    return (
      <div
        ref={ref}
        className={twMerge(
          'w-80 p-6 rounded-2xl',
          'bg-gradient-to-br from-yellow-100 via-orange-50 to-yellow-100',
          'border-2 border-yellow-300',
          'shadow-xl',
          className
        )}
      >
        {/* 顶部装饰 */}
        <div className="text-center mb-4">
          <span className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-sm font-bold px-4 py-1 rounded-full shadow">
            🎉 成就解锁！
          </span>
        </div>

        {/* 图标 */}
        <div className="text-center mb-4">
          <span className="text-7xl">{icon}</span>
        </div>

        {/* 标题 */}
        <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
          {title}
        </h3>

        {/* 描述 */}
        <p className="text-sm text-gray-600 text-center mb-4">
          {description}
        </p>

        {/* 分隔线 */}
        <div className="border-t border-yellow-200 pt-3">
          <p className="text-xs text-gray-400 text-center">
            {dateStr} 解锁
          </p>
        </div>

        {/* 底部水印 */}
        <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-400">
          <span>🔷</span>
          <span>OpenCraft · 元素合成游戏</span>
        </div>
      </div>
    )
  }
)

SingleAchievementCard.displayName = 'SingleAchievementCard'