<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { featureService } from './services/feature-service';

// 应用初始化
onMounted(async () => {
  try {
    // 初始化功能服务
    await featureService.initialize();
    
    // 其他初始化逻辑...
    
    console.info('移动端应用初始化完成');
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
});
</script>

<style lang="scss">
/* 全局样式 */
:root {
  --primary-color: #4285f4;
  --secondary-color: #34a853;
  --warning-color: #fbbc05;
  --error-color: #ea4335;
  --text-primary: #202124;
  --text-secondary: #5f6368;
  --background-light: #ffffff;
  --background-gray: #f8f9fa;
  --border-color: #e0e0e0;
  
  /* 移动端安全区域变量 */
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  width: 100%;
  font-family: 'Roboto', 'Noto Sans SC', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-primary);
  background-color: var(--background-light);
  overscroll-behavior-y: contain;
  -webkit-tap-highlight-color: transparent;
}

a {
  color: var(--primary-color);
  text-decoration: none;
}

button {
  font-family: inherit;
}

.app-container {
  height: 100vh;
  height: calc(100vh - var(--safe-area-top) - var(--safe-area-bottom));
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 定义常见动画 */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  html {
    font-size: 14px;
  }
}
</style> 