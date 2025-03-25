<template>
  <div class="pwa-test">
    <h1>PWA功能测试</h1>
    
    <!-- 安装提示 -->
    <div v-if="installPrompt" class="install-prompt">
      <p>是否安装AI助手到桌面？</p>
      <button @click="installPWA">安装</button>
      <button @click="installPrompt = false">取消</button>
    </div>

    <!-- 离线状态 -->
    <div class="offline-status">
      <p>当前状态: {{ isOnline ? '在线' : '离线' }}</p>
    </div>

    <!-- 缓存状态 -->
    <div class="cache-status">
      <h2>缓存状态</h2>
      <p>已缓存资源: {{ cachedResources.length }}</p>
      <ul>
        <li v-for="resource in cachedResources" :key="resource">
          {{ resource }}
        </li>
      </ul>
    </div>

    <!-- 通知测试 -->
    <div class="notification-test">
      <h2>通知测试</h2>
      <button @click="requestNotificationPermission">请求通知权限</button>
      <button @click="sendTestNotification">发送测试通知</button>
    </div>

    <!-- 性能测试 -->
    <div class="performance-test">
      <h2>性能测试</h2>
      <button @click="testPerformance">开始性能测试</button>
      <div v-if="performanceResults" class="results">
        <p>首屏加载时间: {{ performanceResults.firstContentfulPaint }}ms</p>
        <p>DOM加载时间: {{ performanceResults.domContentLoaded }}ms</p>
        <p>页面完全加载时间: {{ performanceResults.load }}ms</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PWATest',
  data() {
    return {
      installPrompt: false,
      isOnline: navigator.onLine,
      cachedResources: [],
      deferredPrompt: null,
      performanceResults: null
    }
  },
  mounted() {
    // 监听在线状态
    window.addEventListener('online', this.updateOnlineStatus)
    window.addEventListener('offline', this.updateOnlineStatus)

    // 监听安装提示
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredPrompt = e
      this.installPrompt = true
    })

    // 获取缓存资源
    this.getCachedResources()
  },
  beforeDestroy() {
    window.removeEventListener('online', this.updateOnlineStatus)
    window.removeEventListener('offline', this.updateOnlineStatus)
  },
  methods: {
    updateOnlineStatus() {
      this.isOnline = navigator.onLine
    },
    async installPWA() {
      if (!this.deferredPrompt) return
      this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice
      this.installPrompt = false
      this.deferredPrompt = null
    },
    async getCachedResources() {
      if ('caches' in window) {
        const cache = await caches.open('ai-assistant-v1')
        const keys = await cache.keys()
        this.cachedResources = keys.map(key => key.url)
      }
    },
    async requestNotificationPermission() {
      try {
        const permission = await Notification.requestPermission()
        alert(`通知权限状态: ${permission}`)
      } catch (error) {
        console.error('请求通知权限失败:', error)
      }
    },
    async sendTestNotification() {
      if (!('serviceWorker' in navigator)) {
        alert('您的浏览器不支持Service Worker')
        return
      }

      try {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification('测试通知', {
          body: '这是一条测试通知',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge.png',
          vibrate: [100, 50, 100]
        })
      } catch (error) {
        console.error('发送通知失败:', error)
      }
    },
    async testPerformance() {
      if (!window.performance) {
        alert('您的浏览器不支持Performance API')
        return
      }

      const timing = window.performance.timing
      this.performanceResults = {
        firstContentfulPaint: timing.responseEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        load: timing.loadEventEnd - timing.navigationStart
      }
    }
  }
}
</script>

<style lang="scss">
.pwa-test {
  padding: var(--spacing-base);
  
  h1 {
    margin-bottom: var(--spacing-lg);
    color: var(--text-color);
  }

  h2 {
    margin: var(--spacing-base) 0;
    color: var(--text-color);
  }

  .install-prompt {
    background-color: var(--background-color);
    padding: var(--spacing-base);
    border-radius: var(--border-radius-base);
    margin-bottom: var(--spacing-lg);

    button {
      margin-right: var(--spacing-base);
      padding: var(--spacing-sm) var(--spacing-base);
      border-radius: var(--border-radius-sm);
      background-color: var(--primary-color);
      color: white;
      border: none;
      cursor: pointer;

      &:last-child {
        background-color: var(--text-color-light);
      }
    }
  }

  .offline-status {
    margin-bottom: var(--spacing-lg);
    padding: var(--spacing-base);
    background-color: var(--background-color);
    border-radius: var(--border-radius-base);
  }

  .cache-status {
    margin-bottom: var(--spacing-lg);
    
    ul {
      list-style: none;
      padding: 0;
      
      li {
        padding: var(--spacing-sm) 0;
        border-bottom: 1px solid var(--border-color);
        
        &:last-child {
          border-bottom: none;
        }
      }
    }
  }

  .notification-test,
  .performance-test {
    margin-bottom: var(--spacing-lg);
    
    button {
      margin-right: var(--spacing-base);
      padding: var(--spacing-sm) var(--spacing-base);
      border-radius: var(--border-radius-sm);
      background-color: var(--primary-color);
      color: white;
      border: none;
      cursor: pointer;
    }
  }

  .results {
    margin-top: var(--spacing-base);
    padding: var(--spacing-base);
    background-color: var(--background-color);
    border-radius: var(--border-radius-base);
  }
}
</style> 