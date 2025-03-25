import { showToast } from 'vant'

// PWA安装事件
let deferredPrompt = null

// 注册Service Worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('ServiceWorker registration successful:', registration.scope)
        
        // 监听更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast({
                type: 'success',
                message: '发现新版本，请刷新使用',
                duration: 5000
              })
            }
          })
        })
      } catch (error) {
        console.error('ServiceWorker registration failed:', error)
      }
    })

    // 监听安装事件
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      showInstallPrompt()
    })
  }
}

// 显示安装提示
export function showInstallPrompt() {
  if (!deferredPrompt) return
  
  showToast({
    type: 'success',
    message: '可以安装到桌面使用',
    duration: 3000,
    action: {
      text: '安装',
      color: '#4CAF50',
      onClick: async () => {
        try {
          const result = await deferredPrompt.prompt()
          console.log('Install prompt result:', result)
          deferredPrompt = null
        } catch (error) {
          console.error('Install prompt failed:', error)
        }
      }
    }
  })
}

// 检查更新
export async function checkForUpdates() {
  if (!('serviceWorker' in navigator)) return
  
  try {
    const registration = await navigator.serviceWorker.ready
    await registration.update()
  } catch (error) {
    console.error('Update check failed:', error)
  }
}

// 强制更新
export async function forceUpdate() {
  if (!('serviceWorker' in navigator)) return
  
  try {
    const registration = await navigator.serviceWorker.ready
    await registration.unregister()
    window.location.reload()
  } catch (error) {
    console.error('Force update failed:', error)
  }
} 