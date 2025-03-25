import { ref } from 'vue'

// 设备信息
export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
export const isAndroid = /Android/.test(navigator.userAgent)
export const isMobile = isIOS || isAndroid

// 键盘状态
export const keyboardHeight = ref(0)
export const isKeyboardVisible = ref(false)

// 安全区域
export const safeAreaTop = ref(0)
export const safeAreaBottom = ref(0)

// 视窗高度
export const windowHeight = ref(window.innerHeight)

// 初始化移动端适配
export function initMobileAdapter() {
  // 添加设备类型类名
  document.body.classList.add('mobile-device')
  if (isIOS) {
    document.body.classList.add('ios-device')
  } else if (isAndroid) {
    document.body.classList.add('android-device')
  }

  // 设置视口
  setViewport()
  
  // 初始化安全区域
  initSafeArea()
  
  // 监听键盘事件
  initKeyboardListener()
  
  // 监听窗口大小变化
  initResizeListener()
  
  // 初始化手势
  initGestureHandler()
}

// 设置视口
function setViewport() {
  const viewport = document.querySelector('meta[name="viewport"]')
  if (!viewport) {
    const meta = document.createElement('meta')
    meta.name = 'viewport'
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    document.head.appendChild(meta)
  }
}

// 初始化安全区域
function initSafeArea() {
  if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
    const computedStyle = getComputedStyle(document.documentElement)
    safeAreaTop.value = parseInt(computedStyle.getPropertyValue('--safe-area-inset-top')) || 0
    safeAreaBottom.value = parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom')) || 0
  }
}

// 监听键盘事件
function initKeyboardListener() {
  if (isIOS) {
    window.addEventListener('focusin', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        isKeyboardVisible.value = true
        // iOS 键盘高度估算
        keyboardHeight.value = window.innerHeight * 0.4
        document.body.classList.add('keyboard-open')
      }
    })
    
    window.addEventListener('focusout', () => {
      isKeyboardVisible.value = false
      keyboardHeight.value = 0
      document.body.classList.remove('keyboard-open')
    })
  } else if (isAndroid) {
    const initialHeight = window.innerHeight
    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight
      if (initialHeight > currentHeight) {
        isKeyboardVisible.value = true
        keyboardHeight.value = initialHeight - currentHeight
        document.body.classList.add('keyboard-open')
      } else {
        isKeyboardVisible.value = false
        keyboardHeight.value = 0
        document.body.classList.remove('keyboard-open')
      }
    })
  }
}

// 监听窗口大小变化
function initResizeListener() {
  window.addEventListener('resize', () => {
    windowHeight.value = window.innerHeight
    updateLayout()
  })
}

// 更新布局
export function updateLayout() {
  document.documentElement.style.setProperty('--window-height', `${windowHeight.value}px`)
  document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight.value}px`)
  document.documentElement.style.setProperty('--safe-area-top', `${safeAreaTop.value}px`)
  document.documentElement.style.setProperty('--safe-area-bottom', `${safeAreaBottom.value}px`)
}

// 手势处理
let touchStartY = 0
let touchStartTime = 0

function initGestureHandler() {
  // 下拉刷新控制
  document.addEventListener('touchstart', (e) => {
    if (document.scrollingElement?.scrollTop === 0) {
      touchStartY = e.touches[0].clientY
      touchStartTime = Date.now()
    }
  }, { passive: true })

  document.addEventListener('touchmove', (e) => {
    if (document.scrollingElement?.scrollTop === 0 && e.touches[0].clientY > touchStartY) {
      e.preventDefault()
    }
  }, { passive: false })

  document.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].clientY
    const touchEndTime = Date.now()
    
    // 判断是否为快速下拉
    if (touchEndY - touchStartY > 100 && touchEndTime - touchStartTime < 300) {
      // 触发下拉刷新事件
      window.dispatchEvent(new CustomEvent('pullToRefresh'))
    }
  }, { passive: true })
  
  // 返回手势（iOS风格）
  if (isIOS) {
    let startX = 0
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX
    }, { passive: true })
    
    document.addEventListener('touchmove', (e) => {
      const deltaX = e.touches[0].clientX - startX
      if (deltaX > 50 && startX < 50) {
        // 触发返回手势事件
        window.dispatchEvent(new CustomEvent('backGesture'))
      }
    }, { passive: true })
  }
}

// 禁用/启用滚动
export function disableScroll() {
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
}

export function enableScroll() {
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
} 