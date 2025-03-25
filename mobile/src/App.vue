<template>
  <div id="app" :class="{ 'keyboard-open': isKeyboardOpen }">
    <NetworkStatus />
    <GestureFeedback />
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <InstallPrompt />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { initMobileAdapter, updateLayout } from './utils/mobileAdapter'
import InstallPrompt from './components/InstallPrompt.vue'
import NetworkStatus from './components/NetworkStatus.vue'
import GestureFeedback from './components/GestureFeedback.vue'

const isKeyboardOpen = ref(false)

// 监听键盘状态
const handleKeyboardState = () => {
  isKeyboardOpen.value = document.body.classList.contains('keyboard-open')
  updateLayout()
}

// 监听窗口大小变化
const handleResize = () => {
  updateLayout()
}

onMounted(() => {
  // 初始化移动端适配
  initMobileAdapter()
  
  // 添加事件监听
  document.body.addEventListener('classChange', handleKeyboardState)
  window.addEventListener('resize', handleResize)
  
  // 初始布局
  updateLayout()
})

onBeforeUnmount(() => {
  // 移除事件监听
  document.body.removeEventListener('classChange', handleKeyboardState)
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss">
#app {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  background-color: var(--background-color);
  min-height: 100vh;
  min-height: calc(var(--window-height, 100vh) - var(--keyboard-height, 0px));
  padding-top: var(--safe-area-top, 0px);
  padding-bottom: var(--safe-area-bottom, 0px);
  
  &.keyboard-open {
    min-height: calc(var(--window-height, 100vh) - var(--keyboard-height, 0px));
    
    .message-input {
      transform: translateY(calc(-1 * var(--keyboard-height, 0px)));
    }
  }
}

// 移动端基础样式
.mobile-device {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
  
  // 禁用长按菜单
  * {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
  
  // 允许输入框选择
  input, textarea {
    -webkit-user-select: text;
    user-select: text;
  }
}

// iOS设备特定样式
.ios-device {
  // 禁用橡皮筋效果
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
  
  .message-list {
    -webkit-overflow-scrolling: touch;
  }
}

// Android设备特定样式
.android-device {
  .message-input {
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style> 