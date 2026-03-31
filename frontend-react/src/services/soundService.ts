/**
 * 音效服务 - 使用 Web Audio API 程序化生成音效
 * 无需外部音效文件，轻量且即时可用
 */

/** 音效配置 */
export interface SoundConfig {
  enabled: boolean      // 音效开关
  ttsEnabled: boolean   // 语音播报开关
  ttsMode: 'all' | 'important' | 'off'  // 播报模式
  volume: number        // 音量 0-1
}

/** 音效服务类 */
class SoundServiceClass {
  private config: SoundConfig = {
    enabled: true,
    ttsEnabled: true,
    ttsMode: 'important',
    volume: 0.5,
  }
  
  private audioContext: AudioContext | null = null
  private speechSynthesis: SpeechSynthesis | null = null

  constructor() {
    // 检测浏览器环境
    if (typeof window !== 'undefined') {
      this.speechSynthesis = window.speechSynthesis
      this.loadConfig()
    }
  }

  /** 获取或创建 AudioContext */
  private getAudioContext(): AudioContext | null {
    if (!this.audioContext && typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.warn('Web Audio API not supported:', e)
        return null
      }
    }
    return this.audioContext
  }

  /** 确保 AudioContext 处于运行状态（iOS/Safari 需要） */
  async ensureAudioUnlocked(): Promise<boolean> {
    const ctx = this.getAudioContext()
    if (!ctx) return false
    
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
        return true
      } catch (e) {
        console.warn('Failed to resume AudioContext:', e)
        return false
      }
    }
    return ctx.state === 'running'
  }

  /** 播放基础音调 */
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', delay: number = 0) {
    const ctx = this.getAudioContext()
    if (!ctx || !this.config.enabled) return

    const currentTime = ctx.currentTime + delay

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, currentTime)

    // 音量包络：快速淡入，自然淡出
    const volume = this.config.volume * 0.3
    gainNode.gain.setValueAtTime(0, currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(currentTime)
    oscillator.stop(currentTime + duration)
  }

  // ========== 公开的音效方法 ==========

  /** 播放合成成功音效 - 清脆的上升音 */
  playSuccess() {
    if (!this.config.enabled) return
    this.ensureAudioUnlocked()
    
    // C5 -> E5 -> G5 (大三和弦上行)
    this.playTone(523.25, 0.12, 'sine', 0)      // C5
    this.playTone(659.25, 0.12, 'sine', 0.08)   // E5
    this.playTone(783.99, 0.18, 'sine', 0.16)   // G5
  }

  /** 播放合成失败音效 - 低沉的下降音 */
  playFail() {
    if (!this.config.enabled) return
    this.ensureAudioUnlocked()
    
    // 下降的锯齿波
    this.playTone(250, 0.15, 'sawtooth', 0)
    this.playTone(180, 0.25, 'sawtooth', 0.1)
  }

  /** 播放稀有元素发现音效 - 闪亮的琶音 */
  playRare() {
    if (!this.config.enabled) return
    this.ensureAudioUnlocked()
    
    // 快速上升的闪烁音
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51] // C5-E5-G5-C6-E6
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.1 + i * 0.02, 'sine', i * 0.05)
    })
  }

  /** 播放成就解锁音效 - 胜利旋律 */
  playAchievement() {
    if (!this.config.enabled) return
    this.ensureAudioUnlocked()
    
    // 胜利的和弦进行
    const melody = [
      { freq: 523.25, time: 0 },      // C5
      { freq: 659.25, time: 0.1 },    // E5
      { freq: 783.99, time: 0.2 },    // G5
      { freq: 1046.50, time: 0.3 },   // C6
      { freq: 783.99, time: 0.4 },    // G5
      { freq: 1046.50, time: 0.5 },   // C6 (延长)
    ]
    
    melody.forEach(({ freq, time }) => {
      this.playTone(freq, time === 0.5 ? 0.3 : 0.15, 'sine', time)
    })
  }

  /** 播放 UI 点击音效 */
  playClick() {
    if (!this.config.enabled) return
    this.ensureAudioUnlocked()
    
    // 轻柔的点击音
    this.playTone(800, 0.05, 'sine')
  }

  // ========== 语音播报方法 ==========

  /** 语音播报 */
  speak(text: string, rate = 1, pitch = 1) {
    if (!this.config.ttsEnabled || this.config.ttsMode === 'off' || !this.speechSynthesis) return
    
    // 停止当前播报
    this.stopSpeak()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = this.config.volume
    
    this.speechSynthesis.speak(utterance)
  }

  /** 播报新元素发现 */
  speakNewDiscovery(elementName: string) {
    if (this.config.ttsMode === 'off') return
    // important 或 all 模式都播报新发现
    this.speak(`发现新元素：${elementName}`, 1, 1.1)
  }

  /** 播报成就解锁 */
  speakAchievement(title: string) {
    if (this.config.ttsMode === 'off') return
    // important 或 all 模式都播报成就
    this.speak(`解锁成就：${title}`, 1, 1.1)
  }

  /** 播报合成结果（仅在 all 模式下） */
  speakSynthesisResult(elementName: string, success: boolean) {
    if (this.config.ttsMode !== 'all') return
    
    if (success && elementName) {
      this.speak(`合成成功，获得${elementName}`)
    } else {
      this.speak('无法合成，请尝试其他组合')
    }
  }

  /** 播报元素详情 */
  speakElementDetail(name: string, description: string) {
    if (this.config.ttsMode === 'off') return
    this.speak(`${name}。${description}`, 0.9)
  }

  /** 停止语音播报 */
  stopSpeak() {
    // 设置取消标志，防止回调继续执行
    this.sequentialCancelled = true
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel()
    }
    this.currentSpeakCallback = null
  }

  // ========== 顺序朗读方法 ==========

  private currentSpeakCallback: ((index: number) => void) | null = null
  /** 取消标志：用于防止 stopSpeak 后回调继续执行 */
  private sequentialCancelled = false

  /** 顺序朗读多段文本 */
  speakSequential(
    items: string[],
    onIndexChange: (index: number) => void,
    rate = 0.9
  ) {
    if (!this.config.ttsEnabled || this.config.ttsMode === 'off' || !this.speechSynthesis) return

    // 停止当前播报
    this.stopSpeak()
    
    if (items.length === 0) return

    // 重置取消标志
    this.sequentialCancelled = false
    this.currentSpeakCallback = onIndexChange
    let currentIndex = 0

    const speakNext = () => {
      // 检查是否已取消
      if (this.sequentialCancelled) {
        this.currentSpeakCallback = null
        return
      }

      if (currentIndex >= items.length) {
        this.currentSpeakCallback = null
        return
      }

      const text = items[currentIndex]
      if (!text?.trim()) {
        currentIndex++
        speakNext()
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = rate
      utterance.pitch = 1
      utterance.volume = this.config.volume

      utterance.onstart = () => {
        // 检查是否已取消
        if (this.sequentialCancelled) {
          this.speechSynthesis?.cancel()
          return
        }
        this.currentSpeakCallback?.(currentIndex)
      }

      utterance.onend = () => {
        // 检查是否已取消
        if (this.sequentialCancelled) {
          this.currentSpeakCallback = null
          return
        }
        currentIndex++
        speakNext()
      }

      utterance.onerror = () => {
        // 检查是否已取消
        if (this.sequentialCancelled) {
          this.currentSpeakCallback = null
          return
        }
        currentIndex++
        speakNext()
      }

      this.speechSynthesis!.speak(utterance)
    }

    speakNext()
  }

  /** 检查是否正在朗读 */
  isSpeaking(): boolean {
    return this.speechSynthesis?.speaking ?? false
  }

  // ========== 配置管理 ==========

  /** 获取当前配置 */
  getConfig(): SoundConfig {
    return { ...this.config }
  }

  /** 设置配置 */
  setConfig(config: Partial<SoundConfig>) {
    this.config = { ...this.config, ...config }
    this.saveConfig()
  }

  /** 从 localStorage 加载配置 */
  private loadConfig() {
    try {
      const saved = localStorage.getItem('opencraft-sound-config')
      if (saved) {
        const parsed = JSON.parse(saved)
        // 兼容旧配置
        if (parsed.ttsMode === undefined) {
          parsed.ttsMode = 'important'
        }
        this.config = { ...this.config, ...parsed }
      }
    } catch (e) {
      console.warn('Failed to load sound config:', e)
    }
  }

  /** 保存配置到 localStorage */
  private saveConfig() {
    try {
      localStorage.setItem('opencraft-sound-config', JSON.stringify(this.config))
    } catch (e) {
      console.warn('Failed to save sound config:', e)
    }
  }

  /** 切换音效开关 */
  toggleEnabled() {
    this.setConfig({ enabled: !this.config.enabled })
  }

  /** 切换语音开关 */
  toggleTts() {
    this.setConfig({ ttsEnabled: !this.config.ttsEnabled })
    if (!this.config.ttsEnabled) {
      this.stopSpeak()
    }
  }

  /** 获取 AudioContext 状态 */
  getAudioContextState(): AudioContextState | null {
    return this.audioContext?.state || null
  }
}

/** 导出单例 */
export const soundService = new SoundServiceClass()