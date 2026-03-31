import React, { useState, useRef, useCallback, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'
import { 
  useResourcesStore, 
  ESTIMATED_TOTAL, 
  ElementCategory 
} from '../stores/useResourcesStore'
import { useHistoryStore } from '../stores/useHistoryStore'
import { HistoryEntry } from './interfaces'
import { formatRelativeTime } from '../utils/timeFormat'
import { parseSynthesisType } from '../constants/synthesisTypes'
import { Achievements } from './Achievements'

interface ProgressCenterProps {
  isOpen: boolean
  onClose: () => void
}

/** 元素分类配置（用于类型分布统计） */
const CATEGORY_CONFIG: Record<ElementCategory, { icon: string; color: string; bgColor: string; label: string }> = {
  basic: { icon: '⚡', color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: '基础' },
  nature: { icon: '🌿', color: 'text-green-600', bgColor: 'bg-green-100', label: '自然' },
  artifact: { icon: '🔧', color: 'text-blue-600', bgColor: 'bg-blue-100', label: '人造' },
  abstract: { icon: '💭', color: 'text-purple-600', bgColor: 'bg-purple-100', label: '抽象' },
}

/** 基础元素 emoji 映射 */
const ELEMENT_EMOJI: Record<string, string> = {
  Fire: '🔥',
  Water: '💧',
  Earth: '🌍',
  Air: '💨',
}

/** 每页加载数量 */
const PAGE_SIZE = 10

export const ProgressCenter: React.FC<ProgressCenterProps> = ({ isOpen, onClose }) => {
  const resources = useResourcesStore((state) => state.resources)
  const getCurrentStage = useResourcesStore((state) => state.getCurrentStage)
  const getResourcesByCategory = useResourcesStore((state) => state.getResourcesByCategory)
  const entries = useHistoryStore((state) => state.entries)
  
  const currentStage = getCurrentStage()
  const discovered = resources.length
  const percentage = Math.min((discovered / ESTIMATED_TOTAL) * 100, 100)
  
  const [showFullHistory, setShowFullHistory] = useState(false)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const historyScrollRef = useRef<HTMLDivElement>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const getEmoji = (title: string): string => {
    const resource = resources.find(r => r.title === title)
    return resource?.emoji || ELEMENT_EMOJI[title] || '❓'
  }

  const handleScroll = useCallback(() => {
    if (!historyScrollRef.current || isLoadingMore) return
    const { scrollTop, scrollHeight, clientHeight } = historyScrollRef.current
    if (scrollHeight - scrollTop - clientHeight < 50) {
      if (displayCount < entries.length) {
        setIsLoadingMore(true)
        setTimeout(() => {
          setDisplayCount(prev => Math.min(prev + PAGE_SIZE, entries.length))
          setIsLoadingMore(false)
        }, 300)
      }
    }
  }, [displayCount, entries.length, isLoadingMore])

  useEffect(() => {
    if (showFullHistory) setDisplayCount(PAGE_SIZE)
  }, [showFullHistory])

  if (!isOpen) return null

  // 渲染单条历史记录
  const renderHistoryItem = (entry: HistoryEntry, compact: boolean = false) => {
    const typeConfig = parseSynthesisType(entry.result.reasoning?.type)
    
    return (
      <div className={twMerge(
        "flex items-center gap-2 rounded-lg transition",
        compact ? "p-2 bg-gray-50 text-sm" : "p-3 bg-gray-50 hover:bg-gray-100 gap-3"
      )}>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className={compact ? "text-base" : "text-lg"}>{getEmoji(entry.firstWord)}</span>
          <span className="text-gray-400 text-sm">+</span>
          <span className={compact ? "text-base" : "text-lg"}>{getEmoji(entry.secondWord)}</span>
          <span className="text-gray-400 text-sm">→</span>
          <span className="font-medium truncate">
            {entry.result.emoji} {entry.result.word}
          </span>
        </div>
        
        {typeConfig && (
          <span className={twMerge(
            "px-2 py-0.5 text-xs rounded-full flex-shrink-0",
            typeConfig.bgColor, typeConfig.color
          )}>
            {typeConfig.labelZh}
          </span>
        )}
        
        <span className="text-xs text-gray-400 flex-shrink-0">
          {formatRelativeTime(entry.timestamp)}
        </span>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={twMerge(
          "bg-white rounded-xl shadow-2xl mx-4 overflow-hidden animate-slideUp transition-all duration-300",
          showFullHistory ? "w-full max-w-lg max-h-[80vh]" : "w-full max-w-md"
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h2 className="text-lg font-bold text-gray-800">
              {showFullHistory ? '📜 历史合成记录' : '进度中心'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {showFullHistory && (
              <button onClick={() => setShowFullHistory(false)} className="p-1.5 rounded-lg hover:bg-gray-200 transition text-gray-500" title="返回">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div 
          ref={showFullHistory ? historyScrollRef : null} 
          onScroll={showFullHistory ? handleScroll : undefined}
          className={twMerge("p-4 overflow-y-auto", showFullHistory ? "max-h-[calc(80vh-60px)]" : "max-h-[70vh]")}
        >
          {showFullHistory ? (
            <div className="space-y-2">
              {entries.length > 0 ? (
                <>
                  {entries.slice(0, displayCount).map(entry => (
                    <div key={entry.id}>{renderHistoryItem(entry)}</div>
                  ))}
                  {displayCount < entries.length && (
                    <div className="flex justify-center py-3">
                      {isLoadingMore ? (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          加载更多...
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">下拉加载更多 ({entries.length - displayCount} 条)</span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <span className="text-4xl mb-2 block">📭</span>
                  暂无合成记录
                </div>
              )}
            </div>
          ) : (
            <>
              {/* 总进度 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">🔬 发现进度</span>
                  <span className="text-sm text-gray-500">{discovered}/{ESTIMATED_TOTAL}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{currentStage.icon}</span>
                  <span className="font-medium text-gray-700">{currentStage.name}</span>
                </div>
              </div>

              {/* 类型分布 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">📈 元素分类</h3>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(CATEGORY_CONFIG).map(([category, { icon, color, bgColor, label }]) => {
                    const count = getResourcesByCategory(category as ElementCategory).length
                    return (
                      <div key={category} className={twMerge("flex flex-col items-center p-2 rounded-lg", bgColor)}>
                        <span className="text-lg">{icon}</span>
                        <span className={twMerge("text-sm font-bold", color)}>{count}</span>
                        <span className="text-xs text-gray-500">{label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 成就里程碑 */}
              <div className="mb-6">
                <Achievements />
              </div>

              {/* 最近合成 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">📜 最近合成</h3>
                  {entries.length > 5 && (
                    <button onClick={() => setShowFullHistory(true)} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                      查看全部
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
                {entries.length > 0 ? (
                  <div className="space-y-2">
                    {entries.slice(0, 5).map(entry => (
                      <div key={entry.id}>{renderHistoryItem(entry, true)}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">暂无合成记录</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}