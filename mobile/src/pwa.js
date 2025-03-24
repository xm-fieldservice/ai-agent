import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // 显示更新提示
    if (confirm('有新版本可用，是否更新？')) {
      updateSW()
    }
  },
  onOfflineReady() {
    console.log('应用已准备好离线使用')
  }
}) 