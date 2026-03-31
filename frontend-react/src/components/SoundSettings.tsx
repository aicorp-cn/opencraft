import React from 'react'
import { twMerge } from 'tailwind-merge'
import { soundService, type SoundConfig } from '../services/soundService'

interface SoundSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export const SoundSettings: React.FC<SoundSettingsProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = React.useState<SoundConfig>(soundService.getConfig())

  // 更新配置
  const updateConfig = (updates: Partial<SoundConfig>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    soundService.setConfig(updates)
  }

  // 测试音效
  const testSound = async () => {
    await soundService.ensureAudioUnlocked()
    soundService.playSuccess()
  }

  // 测试语音
  const testTTS = () => {
    soundService.speak('音效测试成功！')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* 设置面板 */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <span>🔊</span>
            音效设置
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 内容 */}
        <div className="p-4 space-y-4">
          {/* 音效开关 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">音效</div>
              <div className="text-xs text-gray-400">合成成功/失败音效</div>
            </div>
            <ToggleSwitch checked={config.enabled} onChange={(checked) => updateConfig({ enabled: checked })} />
          </div>
          
          {/* 语音播报开关 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">语音播报</div>
              <div className="text-xs text-gray-400">朗读元素名称与描述</div>
            </div>
            <ToggleSwitch checked={config.ttsEnabled} onChange={(checked) => updateConfig({ ttsEnabled: checked })} />
          </div>
          
          {/* 播报模式 */}
          {config.ttsEnabled && (
            <div>
              <div className="font-medium text-gray-800 mb-2">播报模式</div>
              <div className="flex gap-2">
                {[
                  { value: 'important', label: '重要事件', desc: '新发现、成就' },
                  { value: 'all', label: '全部', desc: '所有合成结果' },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => updateConfig({ ttsMode: mode.value as 'important' | 'all' })}
                    className={twMerge(
                      "flex-1 py-2 px-3 rounded-lg text-sm transition border",
                      config.ttsMode === mode.value
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <div className="font-medium">{mode.label}</div>
                    <div className="text-xs opacity-60">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* 音量控制 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-800">音量</div>
              <span className="text-sm text-gray-500">{Math.round(config.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.volume}
              onChange={(e) => updateConfig({ volume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
          
          {/* 测试按钮 */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={testSound}
              disabled={!config.enabled}
              className={twMerge(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition",
                config.enabled ? "bg-indigo-500 text-white hover:bg-indigo-600" : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              🔊 测试音效
            </button>
            <button
              onClick={testTTS}
              disabled={!config.ttsEnabled}
              className={twMerge(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition",
                config.ttsEnabled ? "bg-purple-500 text-white hover:bg-purple-600" : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              🗣️ 测试语音
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 开关组件 */
interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={twMerge(
      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
      checked ? "bg-indigo-500" : "bg-gray-200"
    )}
  >
    <span
      className={twMerge(
        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow",
        checked ? "translate-x-6" : "translate-x-1"
      )}
    />
  </button>
)