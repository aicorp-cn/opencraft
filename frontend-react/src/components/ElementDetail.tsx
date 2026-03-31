import React, { useEffect, useState } from 'react'
import type { Reasoning } from './interfaces'
import { parseSynthesisType } from '../constants/synthesisTypes'
import { soundService } from '../services/soundService'

interface SourceElement {
  title: string
  emoji: string
}

interface ElementDetailProps {
  isOpen: boolean
  onClose: () => void
  data: {
    word: string
    emoji: string
    lang?: string
    reasoning?: Reasoning
    explanation?: string
    sourceElements?: {
      first: SourceElement
      second: SourceElement
    }
  } | null
}

/** 高亮段落索引：0=名称，1=合成思路，2=小知识 */
type HighlightIndex = 0 | 1 | 2 | null

export const ElementDetail: React.FC<ElementDetailProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [highlightIndex, setHighlightIndex] = useState<HighlightIndex>(null)

  // 调试日志：检查传入的数据
  useEffect(() => {
    if (isOpen && data) {
      console.log('[ElementDetail Diagnostic] 接收到的数据:', {
        word: data.word,
        sourceElements: data.sourceElements,
        reasoning: data.reasoning,
        hasRoleFirst: !!data.reasoning?.role_first,
        hasRoleSecond: !!data.reasoning?.role_second,
        condition: !!(data.sourceElements && (data.reasoning?.role_first || data.reasoning?.role_second)),
      })
    }
  }, [isOpen, data])

  // 关闭时停止朗读
  useEffect(() => {
    if (!isOpen) {
      soundService.stopSpeak()
      setHighlightIndex(null)
    }
  }, [isOpen])

  // 打开时自动开始朗读
  useEffect(() => {
    if (!isOpen || !data) return

    // 构建朗读内容
    const items: string[] = []
    
    // 第1段：元素名称
    items.push(data.word)
    
    // 第2段：合成思路
    if (data.reasoning?.trace) {
      items.push(data.reasoning.trace)
    }
    
    // 第3段：小知识
    if (data.explanation) {
      items.push(data.explanation)
    }

    // 延迟300ms开始朗读，让弹窗动画完成
    const timer = setTimeout(() => {
      soundService.speakSequential(items, (index) => {
        setHighlightIndex(index as HighlightIndex)
      })
    }, 300)

    return () => {
      clearTimeout(timer)
      soundService.stopSpeak()
    }
  }, [isOpen, data])

  if (!isOpen || !data) return null

  const typeConfig = parseSynthesisType(data.reasoning?.type)

  /** 点击名称单独朗读 */
  const handleNameClick = () => {
    soundService.stopSpeak()
    setHighlightIndex(0)
    soundService.speak(data.word, 0.9)
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 - 紧凑化 */}
        <div 
          className={`bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white transition-all duration-300 ${
            highlightIndex === 0 ? 'ring-4 ring-white/50' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity group"
              onClick={handleNameClick}
            >
              <span className="text-4xl">{data.emoji}</span>
              <div>
                <h2 className="text-xl font-bold inline-flex items-center gap-2">
                  {data.word}
                  <span 
                    className="text-sm opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all"
                    title="点击朗读"
                  >
                    🔊
                  </span>
                </h2>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* 内容 - 紧凑化 */}
        <div className="p-4 space-y-3">
          {/* 合成类型 */}
          {typeConfig && (
            <div className="flex items-center gap-2">
              <span className="text-xl">{typeConfig.icon}</span>
              <span className={`font-medium text-sm ${typeConfig.color}`}>
                {typeConfig.labelZh}
              </span>
            </div>
          )}

          {/* 合成配方卡片 - 一体化展示 */}
          {data.sourceElements && (data.reasoning?.role_first || data.reasoning?.role_second) && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-2 font-medium">📦 合成配方</div>
              <div className="space-y-1">
                {/* 第一个元素 */}
                <div className="flex items-center gap-2">
                  <span className="text-xl">{data.sourceElements.first.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-800 text-sm">{data.sourceElements.first.title}</span>
                    {data.reasoning?.role_first && (
                      <span className="text-gray-500 ml-1 text-xs">{data.reasoning.role_first}</span>
                    )}
                  </div>
                </div>
                
                {/* 加号 */}
                <div className="flex justify-center">
                  <span className="text-gray-400 text-lg">+</span>
                </div>
                
                {/* 第二个元素 */}
                <div className="flex items-center gap-2">
                  <span className="text-xl">{data.sourceElements.second.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-800 text-sm">{data.sourceElements.second.title}</span>
                    {data.reasoning?.role_second && (
                      <span className="text-gray-500 ml-1 text-xs">{data.reasoning.role_second}</span>
                    )}
                  </div>
                </div>
                
                {/* 等号 */}
                <div className="flex justify-center">
                  <span className="text-gray-400 text-lg">=</span>
                </div>
                
                {/* 结果元素 */}
                <div className="flex items-center gap-2 bg-white rounded-md p-1.5 shadow-sm">
                  <span className="text-xl">{data.emoji}</span>
                  <span className="font-medium text-indigo-600 text-sm">{data.word}</span>
                </div>
              </div>
            </div>
          )}

          {/* 合成思路 */}
          {data.reasoning?.trace && (
            <div 
              className={`bg-amber-50 rounded-lg p-3 transition-all duration-300 ${
                highlightIndex === 1 ? 'ring-2 ring-amber-400 ring-offset-2' : ''
              }`}
            >
              <div className="text-xs text-amber-600 mb-1 font-medium">💭 合成思路</div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {data.reasoning.trace}
              </p>
            </div>
          )}

          {/* 小知识 */}
          {data.explanation && (
            <div 
              className={`bg-blue-50 rounded-lg p-3 transition-all duration-300 ${
                highlightIndex === 2 ? 'ring-2 ring-blue-400 ring-offset-2' : ''
              }`}
            >
              <div className="text-xs text-blue-600 mb-1 font-medium">📖 小知识</div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {data.explanation}
              </p>
            </div>
          )}
        </div>

        {/* 底部按钮 - 单行并排 */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => {
              const items: string[] = []
              items.push(data.word)
              if (data.reasoning?.trace) items.push(data.reasoning.trace)
              if (data.explanation) items.push(data.explanation)
              
              soundService.speakSequential(items, (index) => {
                setHighlightIndex(index as HighlightIndex)
              })
            }}
            className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-1 text-sm"
          >
            <span>🔊</span>
            <span>重读</span>
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}