import React, { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { SynthesisHistory } from './SynthesisHistory'
import { TypeStatistics } from './TypeStatistics'
import { Achievements } from './Achievements'

/** Tab 定义 */
const TABS = [
  { id: 'history', label: '历史', icon: '📜' },
  { id: 'stats', label: '统计', icon: '📊' },
  { id: 'achievements', label: '成就', icon: '🏆' },
] as const

type TabId = typeof TABS[number]['id']

interface BottomPanelProps {
  className?: string
  defaultTab?: TabId
}

export const BottomPanel: React.FC<BottomPanelProps> = ({ 
  className,
  defaultTab = 'history' 
}) => {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className={twMerge(
      "bg-white border-t flex flex-col transition-all duration-300",
      isExpanded ? "h-40" : "h-12",
      className
    )}>
      {/* Tab 头部 */}
      <div className="flex items-center justify-between border-b px-2">
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setIsExpanded(true)
              }}
              className={twMerge(
                "flex items-center gap-1 px-3 py-2 text-sm transition",
                activeTab === tab.id && isExpanded
                  ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* 展开/收起按钮 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-gray-400 hover:text-gray-600 transition"
          title={isExpanded ? "收起" : "展开"}
        >
          <svg 
            className={twMerge("w-4 h-4 transition-transform", isExpanded && "rotate-180")} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
      
      {/* Tab 内容 */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden p-3">
          {activeTab === 'history' && <SynthesisHistory />}
          {activeTab === 'stats' && <TypeStatistics />}
          {activeTab === 'achievements' && <Achievements />}
        </div>
      )}
    </div>
  )
}