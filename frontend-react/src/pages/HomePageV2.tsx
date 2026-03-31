/**
 * HomePageV2 - 主页面（使用 dnd-v2）
 * 
 * 使用新的拖拽系统，解决分身和拖入画布问题
 */

import React, { useState } from 'react'
import { Header } from '../components/Header'
import { ProgressCenter } from '../components/ProgressCenter'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { AchievementNotification } from '../components/AchievementNotification'
import { ElementDetail } from '../components/ElementDetail'
import { 
  DndContextProviderV2, 
  DroppableCanvas, 
  ResourceSidebarV2
} from '../components/dnd-v2'
import { useBoxesStore } from '../stores/useBoxesStore'
import { useResourcesStore } from '../stores/useResourcesStore'
import { useHistoryStore } from '../stores/useHistoryStore'
import { useAchievementStore } from '../stores/useAchievementStore'
import { toast } from 'sonner'

export const HomePageV2: React.FC = () => {
  const [showProgressCenter, setShowProgressCenter] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  
  // 元素详情弹窗状态
  const [selectedElement, setSelectedElement] = useState<{
    id: string
    title: string
    emoji: string
    lang?: string
    reasoning?: any
    explanation?: string
    sourceElements?: {
      first: { title: string; emoji: string }
      second: { title: string; emoji: string }
    }
  } | null>(null)

  // Reset handlers
  const resetBoxes = useBoxesStore((state) => state.resetBoxes)
  const resetResources = useResourcesStore((state) => state.resetResources)

  const handleReset = () => {
    setIsResetDialogOpen(true)
  }

  const confirmReset = () => {
    resetBoxes()
    resetResources()
    useHistoryStore.getState().clearHistory()
    useAchievementStore.getState().reset()
    setIsResetDialogOpen(false)
    toast.success('🔄 游戏已重置')
  }

  // 元素点击回调
  const handleElementClick = (box: { 
    id: string
    title: string
    emoji: string
    lang?: string
    reasoning?: any
    explanation?: string
    sourceElements?: {
      first: { title: string; emoji: string }
      second: { title: string; emoji: string }
    }
  }) => {
    setSelectedElement(box)
  }

  return (
    <DndContextProviderV2>
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        {/* 顶部导航 */}
        <Header 
          onOpenResources={() => {}}
          onOpenProgressCenter={() => setShowProgressCenter(true)}
          onReset={handleReset}
          onOpenHelp={() => setShowHelp(true)}
        />
        
        {/* 主体区域 - 响应式布局 */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* 画布区域 */}
          <main 
            className="flex-1 relative bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden min-h-0"
            data-testid="canvas-area"
          >
            <DroppableCanvas 
              onElementClick={handleElementClick}
            />
            <EmptyStateHint />
          </main>
          
          {/* 横屏模式：右侧资源库 */}
          <aside className="hidden lg:flex w-[35%] border-l bg-white flex-shrink-0">
            <ResourceSidebarV2 className="h-full border-r-0" />
          </aside>
          
          {/* 竖屏模式：底部资源库 */}
          <div className="lg:hidden flex-shrink-0">
            <ResourceSidebarV2 isMobile />
          </div>
        </div>
        
        {/* 进度中心弹窗 */}
        <ProgressCenter 
          isOpen={showProgressCenter}
          onClose={() => setShowProgressCenter(false)}
        />
        
        {/* 帮助弹窗 */}
        {showHelp && (
          <HelpModal onClose={() => setShowHelp(false)} />
        )}
        
        {/* 重置确认对话框 */}
        <ConfirmDialog
          isOpen={isResetDialogOpen}
          title="重置游戏"
          message="确定要重置游戏吗？所有已发现的元素和合成历史将被清除。"
          confirmText="确认重置"
          cancelText="取消"
          onConfirm={confirmReset}
          onCancel={() => setIsResetDialogOpen(false)}
        />
        
        {/* 成就解锁通知 */}
        <AchievementNotification />
        
        {/* 元素详情弹窗 */}
        <ElementDetail
          isOpen={selectedElement !== null}
          onClose={() => setSelectedElement(null)}
          data={selectedElement ? {
            word: selectedElement.title,
            emoji: selectedElement.emoji,
            lang: selectedElement.lang,
            reasoning: selectedElement.reasoning,
            explanation: selectedElement.explanation,
            sourceElements: selectedElement.sourceElements,
          } : null}
        />
      </div>
    </DndContextProviderV2>
  )
}

/** 空状态提示组件 */
const EmptyStateHint: React.FC = () => {
  const boxes = useBoxesStore((state) => state.boxes)
  
  if (Object.keys(boxes).length > 0) {
    return null
  }
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-2">🎯</div>
        <div className="text-sm">拖拽元素到画布开始探索</div>
      </div>
    </div>
  )
}

/** 帮助弹窗 */
interface HelpModalProps {
  onClose: () => void
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">❓ 帮助</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">🎮 游戏玩法</h3>
            <p className="text-gray-600 text-sm">
              从资源库拖拽元素到画布上，将两个元素拖到同一个位置即可尝试合成新元素。
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">🧪 基础元素</h3>
            <p className="text-gray-600 text-sm">
              火 🔥、水 💧、土 🌍、气 💨 是四大基础元素，可以相互组合产生更多新元素。
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">📊 进度中心</h3>
            <p className="text-gray-600 text-sm">
              点击顶部进度条查看发现进度、类型分布和最近合成记录。
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">💡 小提示</h3>
            <ul className="text-gray-600 text-sm list-disc list-inside space-y-1">
              <li>某些组合可能无法产生新元素，请尝试其他组合</li>
              <li>使用搜索框快速查找已发现的元素</li>
              <li>点击画布上的元素可以查看详细信息</li>
              <li>移动端拖拽元素时，资源库会自动收缩让位</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}