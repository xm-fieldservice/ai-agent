// 检测设备类型
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export const isAndroid = () => {
  return /Android/.test(navigator.userAgent)
}

// 获取安全区域
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement)
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0', 10),
    right: parseInt(style.getPropertyValue('--sar') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
    left: parseInt(style.getPropertyValue('--sal') || '0', 10)
  }
}

// 设置安全区域
export const setupSafeArea = () => {
  if (isIOS()) {
    // iOS 安全区域
    const html = document.documentElement
    html.style.setProperty('--sat', 'env(safe-area-inset-top)')
    html.style.setProperty('--sar', 'env(safe-area-inset-right)')
    html.style.setProperty('--sab', 'env(safe-area-inset-bottom)')
    html.style.setProperty('--sal', 'env(safe-area-inset-left)')
  } else {
    // Android 安全区域（默认值）
    const html = document.documentElement
    html.style.setProperty('--sat', '0px')
    html.style.setProperty('--sar', '0px')
    html.style.setProperty('--sab', '0px')
    html.style.setProperty('--sal', '0px')
  }
}

// 处理键盘事件
export const setupKeyboardEvents = () => {
  if (isIOS()) {
    // iOS 键盘事件
    window.addEventListener('focusin', () => {
      document.body.classList.add('keyboard-open')
    })
    
    window.addEventListener('focusout', () => {
      document.body.classList.remove('keyboard-open')
    })
  } else {
    // Android 键盘事件
    const originalHeight = window.innerHeight
    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight
      if (currentHeight < originalHeight) {
        document.body.classList.add('keyboard-open')
      } else {
        document.body.classList.remove('keyboard-open')
      }
    })
  }
}

// 处理触摸事件
export const setupTouchEvents = () => {
  // 禁用双击缩放
  document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) {
      event.preventDefault()
    }
  }, { passive: false })
  
  let lastTouchEnd = 0
  document.addEventListener('touchend', (event) => {
    const now = Date.now()
    if (now - lastTouchEnd < 300) {
      event.preventDefault()
    }
    lastTouchEnd = now
  }, { passive: false })
  
  // 禁用页面滚动回弹
  document.body.addEventListener('touchmove', (event) => {
    if (event.touches.length > 1) {
      event.preventDefault()
    }
  }, { passive: false })
}

// 初始化移动端适配
export const initMobileAdapter = () => {
  setupSafeArea()
  setupKeyboardEvents()
  setupTouchEvents()
  
  // 添加移动端样式
  document.body.classList.add('mobile-device')
  if (isIOS()) {
    document.body.classList.add('ios-device')
  } else if (isAndroid()) {
    document.body.classList.add('android-device')
  }
}

// 更新布局
export const updateLayout = () => {
  const safeArea = getSafeAreaInsets()
  const html = document.documentElement
  
  // 更新CSS变量
  html.style.setProperty('--window-height', `${window.innerHeight}px`)
  html.style.setProperty('--safe-area-top', `${safeArea.top}px`)
  html.style.setProperty('--safe-area-bottom', `${safeArea.bottom}px`)
  
  // 处理键盘弹出时的布局
  if (document.body.classList.contains('keyboard-open')) {
    html.style.setProperty('--keyboard-height', `${window.innerHeight * 0.4}px`)
  } else {
    html.style.setProperty('--keyboard-height', '0px')
  }
} 