import confetti from 'canvas-confetti'

/**
 * 播放合成成功动画 - 彩色粒子特效
 */
export const playSuccessAnimation = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
  })
}

/**
 * 播放稀有元素发现动画 - 更华丽的粒子特效
 */
export const playRareAnimation = () => {
  const duration = 1500
  const animationEnd = Date.now() + duration
  const colors = ['#8B5CF6', '#EC4899', '#FBBF24']

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    })

    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame)
    }
  }

  frame()
}

/**
 * 播放里程碑成就动画 - 烟花特效
 */
export const playAchievementAnimation = () => {
  const duration = 2000
  const animationEnd = Date.now() + duration
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1']

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0.3, y: 0.6 },
      colors: colors,
    })
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 0.7, y: 0.6 },
      colors: colors,
    })

    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame)
    }
  }

  frame()
}