import html2canvas from 'html2canvas'

/** 分享服务类 */
class ShareServiceClass {
  /** 检测是否支持 Web Share API */
  canShare(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator
  }

  /** 检测是否支持文件分享 */
  canShareFiles(): boolean {
    if (!this.canShare()) return false
    return 'canShare' in navigator && typeof navigator.canShare === 'function'
  }

  /** 将 DOM 元素截图为 Blob */
  async captureElement(element: HTMLElement, scale = 2): Promise<Blob> {
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor: null,
      logging: false,
      useCORS: true,
    })

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert canvas to blob'))
          }
        },
        'image/png',
        1.0
      )
    })
  }

  /** 使用 Web Share API 分享图片 */
  async shareImage(blob: Blob, title: string, text?: string): Promise<boolean> {
    if (!this.canShareFiles()) {
      console.warn('Web Share API not supported')
      return false
    }

    try {
      const file = new File([blob], `${title}.png`, { type: 'image/png' })
      const shareData: ShareData = {
        title,
        text: text || title,
        files: [file],
      }

      // 检查是否可以分享
      if (navigator.canShare && !navigator.canShare(shareData)) {
        return false
      }

      await navigator.share(shareData)
      return true
    } catch (error) {
      // 用户取消分享不算错误
      if ((error as Error).name === 'AbortError') {
        return true
      }
      console.error('Share failed:', error)
      return false
    }
  }

  /** 下载图片到本地 */
  downloadImage(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /** 复制图片到剪贴板 */
  async copyImageToClipboard(blob: Blob): Promise<boolean> {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      console.warn('Clipboard API not supported')
      return false
    }

    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      return true
    } catch (error) {
      console.error('Copy to clipboard failed:', error)
      return false
    }
  }

  /** 分享成就 */
  async shareAchievement(
    cardElement: HTMLElement,
    title: string
  ): Promise<'shared' | 'downloaded' | 'copied' | 'failed'> {
    try {
      // 截图
      const blob = await this.captureElement(cardElement)

      // 尝试 Web Share
      if (this.canShareFiles()) {
        const shared = await this.shareImage(blob, title)
        if (shared) {
          return 'shared'
        }
      }

      // 尝试复制到剪贴板
      const copied = await this.copyImageToClipboard(blob)
      if (copied) {
        return 'copied'
      }

      // 降级：下载图片
      this.downloadImage(blob, `achievement-${Date.now()}.png`)
      return 'downloaded'
    } catch (error) {
      console.error('Share achievement failed:', error)
      return 'failed'
    }
  }
}

/** 导出单例 */
export const shareService = new ShareServiceClass()