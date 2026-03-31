/**
 * ResourceSidebarV2 - 资源库侧边栏（使用 dnd-v2）
 * 
 * 职责：
 * 1. 显示已发现的元素列表
 * 2. 提供搜索和分类筛选
 * 3. 支持元素拖拽到画布
 * 4. 虚拟滚动优化大量元素渲染
 * 5. 移动端动态高度计算
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useResourcesStore, ElementCategory } from '../../stores/useResourcesStore'
import { DraggableResourceItem } from './DraggableResourceItem'
import { twMerge } from 'tailwind-merge'
import { ELEMENT_CATEGORIES } from '../../constants/synthesisTypes.ts'

interface ResourceSidebarV2Props {
  className?: string
  /** 移动端模式 */
  isMobile?: boolean
}

export const ResourceSidebarV2: React.FC<ResourceSidebarV2Props> = ({ 
  className, 
  isMobile = false 
}) => {
  const resources = useResourcesStore((state) => state.resources)
  const getCategory = useResourcesStore((state) => state.getCategory)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<ElementCategory | 'all'>('all')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  // 搜索框展开后自动聚焦（V1 已有，V2 遗漏）
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchExpanded])

  // 虚拟滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // 搜索过滤（不影响分类统计）
  const searchedResources = useMemo(() => {
    if (!searchQuery) return resources
    const query = searchQuery.toLowerCase()
    return resources.filter(r => 
      r.title.toLowerCase().includes(query)
    )
  }, [resources, searchQuery])

  // 各分类数量统计（基于搜索结果，不受分类过滤影响）
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: searchedResources.length }
    ELEMENT_CATEGORIES.forEach(cat => {
      if (cat.id !== 'all') {
        counts[cat.id] = searchedResources.filter(r => {
          const c = r.category || getCategory(r.title)
          return c === cat.id
        }).length
      }
    })
    return counts
  }, [searchedResources, getCategory])

  // 最终过滤资源（应用分类过滤）
  const filteredResources = useMemo(() => {
    if (activeCategory === 'all') return searchedResources
    return searchedResources.filter(r => {
      const cat = r.category || getCategory(r.title)
      return cat === activeCategory
    })
  }, [searchedResources, activeCategory, getCategory])

  // 计算网格列数和元素尺寸
  const gridConfig = useMemo(() => {
    if (isMobile) {
      return {
        cols: 5, // 移动端 5 列
        itemHeight: 56, // p-1(4) + text-lg(18) + mt-0.5(2) + text-xs×2(30) = 54px + 2px容错
        gap: 4,
      }
    }
    return {
      cols: 4, // 桌面端 4 列
      itemHeight: 98, // aspect-square: (394px - 6px gap) / 4 = 97px
      gap: 2,
    }
  }, [isMobile])

  // 每一行是一个虚拟单元
  const rowCount = Math.ceil(filteredResources.length / gridConfig.cols)
  const virtualizer = useVirtualizer({
      count: rowCount,
      getScrollElement: () => scrollContainerRef.current,
      estimateSize: useCallback(() => gridConfig.itemHeight + gridConfig.gap, [gridConfig]),
      overscan: 5,
  })
  // 计算虚拟列表所需的总高度
  const totalHeight = virtualizer.getTotalSize()

  // 获取可见元素
  const virtualItems = virtualizer.getVirtualItems()

  // 移动端：底部固定资源库
  if (isMobile) {
    return (
      <div 
        className={twMerge(
          "bg-white border-t flex flex-col",
          "h-[35vh] min-h-[25vh] max-h-[40vh]", 
          className
        )}
      >
        {/* 搜索与筛选栏 */}
        <div className="p-1.5 border-b flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {/* 搜索区域 */}
            {isSearchExpanded ? (
              <div className="relative flex-1 min-w-0">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => {
                    if (!searchQuery) setIsSearchExpanded(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchQuery('')
                      setIsSearchExpanded(false)
                    }
                  }}
                  className="w-full pl-6 pr-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <svg 
                  className="absolute left-1.5 top-1.5 w-3.5 h-3.5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchExpanded(true)}
                className="p-1 rounded hover:bg-gray-100 transition text-gray-500 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
            
            {/* 分类筛选 */}
            <div className="flex gap-0.5 overflow-x-auto flex-1 min-w-0 scrollbar-hide">
              {ELEMENT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={twMerge(
                    "px-1.5 py-0.5 text-xs rounded whitespace-nowrap transition flex-shrink-0",
                    activeCategory === cat.id 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {cat.icon}
                  <span className="ml-0.5">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* 元素网格 - 虚拟滚动 */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-1 min-h-0"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {filteredResources.length > 0 ? (
            <div 
              className="relative"
              style={{ height: `${totalHeight}px` }}
            >
              <div
                className="grid gap-1 absolute top-0 left-0 right-0"
                style={{
                  gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
                  transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
                }}
              >
              {virtualItems.map((virtualRow) => {
                const rowStartIndex = virtualRow.index * gridConfig.cols
                const rowElements = filteredResources.slice(rowStartIndex, rowStartIndex + gridConfig.cols)
                
              return rowElements.map((resource, colIndex) => {
                // 调试日志：检查资源库中的元素数据
                if (colIndex === 0) {
                  console.log('[ResourceSidebar Diagnostic] 资源数据:', {
                    title: resource.title,
                    sourceElements: resource.sourceElements,
                    reasoning: resource.reasoning,
                  })
                }
                return (
                  <DraggableResourceItem 
                    key={`${resource.title}-${rowStartIndex + colIndex}`}
                    title={resource.title}
                    emoji={resource.emoji}
                    lang={resource.lang}
                    reasoning={resource.reasoning}
                    explanation={resource.explanation}
                    discoveredAt={resource.discoveredAt}
                    sourceElements={resource.sourceElements}
                    isMobile={true}
                  />
                )
              })
              })}

              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-2xl mb-1">🔍</span>
              <span className="text-xs">
                {searchQuery ? '未找到匹配元素' : '暂无元素'}
              </span>
            </div>
          )}
        </div>
        
        {/* 统计 */}
        <div className="px-2 py-0.5 border-t bg-gray-50 text-xs flex justify-between items-center flex-shrink-0">
          <span className="text-gray-500">已发现</span>
          <span className="font-medium text-gray-700">{resources.length}</span>
        </div>
      </div>
    )
  }

  // 桌面端：完整侧边栏
  return (
    <aside className={twMerge(
      "bg-white border-r flex flex-col w-full h-full",
      className
    )}>
      {/* 搜索与筛选栏 */}
      <div className="p-2 border-b">
        <div className="flex items-center gap-1.5">
          {/* 搜索区域 */}
          {isSearchExpanded ? (
            <div className="relative flex-1 min-w-0">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="搜索元素..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (!searchQuery) setIsSearchExpanded(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('')
                    setIsSearchExpanded(false)
                  }
                }}
                className="w-full pl-7 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <svg 
                className="absolute left-2 top-1.5 w-4 h-4 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchExpanded(true)}
              className="p-1 rounded hover:bg-gray-100 transition text-gray-500 flex-shrink-0"
              title="搜索"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
          
          {/* 分隔符 */}
          <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
          
          {/* 筛选标签 */}
          <div className="flex gap-0.5 overflow-x-auto flex-1 min-w-0 scrollbar-hide">
            {ELEMENT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={twMerge(
                  "px-1.5 py-0.5 text-xs rounded whitespace-nowrap transition flex-shrink-0",
                  activeCategory === cat.id 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat.icon}
                <span className="ml-0.5">{cat.label}</span>
                <span className="ml-0.5 opacity-70">({categoryCounts[cat.id] || 0})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 元素网格 - 虚拟滚动 */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-1 min-h-0"
      >
        {filteredResources.length > 0 ? (
          <div 
            className="relative"
            style={{ height: `${totalHeight}px` }}
          >
            <div
              className="grid gap-0.5 absolute top-0 left-0 right-0"
              style={{
                gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
                transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
              }}
            >
            {/* 每个 virtualItem 对应一行，一行包含 cols 个元素 */}
            {virtualItems.map((virtualRow) => {
              const rowStartIndex = virtualRow.index * gridConfig.cols
              const rowElements = filteredResources.slice(rowStartIndex, rowStartIndex + gridConfig.cols)
              
              return rowElements.map((resource, colIndex) => (
                <DraggableResourceItem 
                  key={`${resource.title}-${rowStartIndex + colIndex}`}
                  title={resource.title}
                  emoji={resource.emoji}
                  lang={resource.lang}
                  reasoning={resource.reasoning}
                  explanation={resource.explanation}
                  discoveredAt={resource.discoveredAt}
                  sourceElements={resource.sourceElements}
                  isMobile={false}
                />
              ))
            })}

            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-2xl mb-1">🔍</span>
            <span className="text-xs">
              {searchQuery ? '未找到匹配元素' : '暂无元素'}
            </span>
          </div>
        )}
      </div>
      
      {/* 统计摘要 */}
      <div className="p-2 border-t bg-gray-50 text-xs flex justify-between items-center">
        <span className="text-gray-500">已发现</span>
        <span className="font-medium text-gray-700">{resources.length} 个元素</span>
      </div>
    </aside>
  )
}