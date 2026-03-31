import React, { useState, useRef, useEffect } from 'react'
import { parseSynthesisType } from '../constants/synthesisTypes'
import { useHistoryStore } from '../stores/useHistoryStore'
import { HistoryEntry } from './interfaces'

interface SynthesisHistoryProps {
  onItemClick?: (entry: HistoryEntry) => void
  limit?: number
}

export const SynthesisHistory: React.FC<SynthesisHistoryProps> = ({
  onItemClick,
  limit = 10
}) => {
  const entries = useHistoryStore((state) => state.entries)
  const clearHistory = useHistoryStore((state) => state.clearHistory)
  
  const [displayLimit, setDisplayLimit] = useState(limit)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const recentEntries = entries.slice(0, displayLimit)
  
  // 滚动加载更多
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      // 当滚动到距离底部 50px 以内时，加载更多
      if (scrollHeight - scrollTop - clientHeight < 50) {
        if (entries.length > displayLimit) {
          setDisplayLimit(prev => Math.min(prev + 10, entries.length))
        }
      }
    }
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [entries.length, displayLimit])

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins} 分钟前`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} 小时前`
    
    return date.toLocaleDateString('zh-CN')
  }

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-lg p-3">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span>📜</span>
          <span>合成历史</span>
        </h3>
        <button
          onClick={clearHistory}
          className="text-xs text-red-500 hover:text-red-600 transition-colors"
        >
          清空
        </button>
      </div>
      
      <div ref={scrollContainerRef} className="flex-1 space-y-1 overflow-y-auto min-h-0">
        {recentEntries.map((entry) => {
          const typeConfig = parseSynthesisType(entry.result.reasoning?.type)
          
          return (
            <div
              key={entry.id}
              onClick={() => onItemClick?.(entry)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {/* 结果 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">{entry.result.emoji}</span>
              </div>
              
              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 truncate">
                    {entry.firstWord} + {entry.secondWord}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="font-bold text-indigo-600">
                    {entry.result.word}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatTime(entry.timestamp)}</span>
                  {typeConfig && (
                    <>
                      <span>·</span>
                      <span className={typeConfig.color}>
                        {typeConfig.icon} {typeConfig.labelZh}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {entries.length > displayLimit && (
        <div className="mt-1 text-center text-xs text-gray-400 flex-shrink-0">
          ↓ 下拉加载更多 ({entries.length - displayLimit} 条剩余)
        </div>
      )}
    </div>
  )
}