<template>
  <div v-if="showPrompt" class="install-prompt">
    <div class="prompt-content">
      <div class="prompt-header">
        <img src="/vite.svg" alt="AI助手" class="app-icon">
        <div class="app-info">
          <h3>安装 AI助手</h3>
          <p>随时随地使用AI助手</p>
        </div>
      </div>
      <div class="prompt-actions">
        <button class="install-btn" @click="installPWA">安装应用</button>
        <button class="cancel-btn" @click="closePrompt">暂不安装</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InstallPrompt',
  data() {
    return {
      showPrompt: false,
      deferredPrompt: null
    }
  },
  mounted() {
    window.addEventListener('beforeinstallprompt', this.handleInstallPrompt)
  },
  beforeUnmount() {
    window.removeEventListener('beforeinstallprompt', this.handleInstallPrompt)
  },
  methods: {
    handleInstallPrompt(e) {
      e.preventDefault()
      this.deferredPrompt = e
      this.showPrompt = true
    },
    async installPWA() {
      if (!this.deferredPrompt) return
      
      this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('用户已接受安装PWA')
      } else {
        console.log('用户已取消安装PWA')
      }
      
      this.deferredPrompt = null
      this.showPrompt = false
    },
    closePrompt() {
      this.showPrompt = false
    }
  }
}
</script>

<style lang="scss" scoped>
.install-prompt {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--background-color);
  padding: var(--spacing-base);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
  box-shadow: var(--shadow-lg);
  z-index: var(--z-index-modal);
  
  .prompt-content {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .prompt-header {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-base);
    
    .app-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--border-radius-sm);
      margin-right: var(--spacing-base);
    }
    
    .app-info {
      h3 {
        margin: 0;
        font-size: var(--font-size-lg);
        color: var(--text-color);
      }
      
      p {
        margin: var(--spacing-xs) 0 0;
        font-size: var(--font-size-sm);
        color: var(--text-color-secondary);
      }
    }
  }
  
  .prompt-actions {
    display: flex;
    gap: var(--spacing-base);
    
    button {
      flex: 1;
      padding: var(--spacing-sm) var(--spacing-base);
      border-radius: var(--border-radius-base);
      font-size: var(--font-size-base);
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition-base);
      
      &.install-btn {
        background-color: var(--primary-color);
        color: white;
        border: none;
        
        &:active {
          background-color: darken($primary-color, 10%);
        }
      }
      
      &.cancel-btn {
        background-color: transparent;
        color: var(--text-color);
        border: 1px solid var(--border-color);
        
        &:active {
          background-color: var(--background-color);
        }
      }
    }
  }
}
</style> 