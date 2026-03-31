import React from 'react'
import { useHistoryStore } from '../stores/useHistoryStore'
import { parseSynthesisType } from '../constants/synthesisTypes'

export const TypeStatistics: React.FC = () => {
  const entries = useHistoryStore((state) => state.entries)

  if (entries.length === 0) return null

  // 从历史记录统计合成类型
  const typeStats = new Map<string, number>()
  entries.forEach(entry => {
    const type = entry.result.reasoning?.type
    if (type) {
      typeStats.set(type, (typeStats.get(type) || 0) + 1)
    }
  })

  const totalSyntheses = entries.length
  const typeEntries = Array.from(typeStats.entries()).sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>📊</span>
        <span>合成类型统计</span>
        <span className="text-sm font-normal text-gray-500">
          ({totalSyntheses} 次合成)
        </span>
      </h3>
      
      {typeEntries.length > 0 ? (
        <div className="space-y-3">
          {typeEntries.map(([type, count]) => {
            const config = parseSynthesisType(type)
            if (!config) return null
            
            const percentage = Math.round((count / totalSyntheses) * 100)
            
            return (
              <div key={type} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <span className="text-gray-700">{config.labelZh}</span>
                  </div>
                  <span className="text-gray-500">{count} ({percentage}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${config.bgColor} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          暂无类型统计，开始合成元素吧！
        </p>
      )}
    </div>
  )
}