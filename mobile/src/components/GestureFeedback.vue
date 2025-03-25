<template>
  <div class="gesture-feedback">
    <!-- 下拉刷新指示器 -->
    <div class="pull-refresh" :class="{ 'is-active': isPulling }">
      <van-loading v-if="isPulling" type="spinner" />
      <van-icon v-else name="down" />
      <span>{{ pullText }}</span>
    </div>
    
    <!-- 返回手势指示器 -->
    <div class="back-gesture" :class="{ 'is-active': isBackGesture }">
      <van-icon name="arrow-left" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isPulling = ref(false)
const isBackGesture = ref(false)
const pullText = ref('下拉刷新')

// 监听下拉刷新事件
const handlePullToRefresh = () => {
  isPulling.value = true
  pullText.value = '正在刷新...'
  
  // 模拟刷新
  setTimeout(() => {
    isPulling.value = false
    pullText.value = '下拉刷新'
    window.location.reload()
  }, 1500)
}

// 监听返回手势事件
const handleBackGesture = () => {
  isBackGesture.value = true
  setTimeout(() => {
    isBackGesture.value = false
    router.back()
  }, 300)
}

onMounted(() => {
  window.addEventListener('pullToRefresh', handlePullToRefresh)
  window.addEventListener('backGesture', handleBackGesture)
})

onUnmounted(() => {
  window.removeEventListener('pullToRefresh', handlePullToRefresh)
  window.removeEventListener('backGesture', handleBackGesture)
})
</script>

<style lang="scss" scoped>
.gesture-feedback {
  pointer-events: none;
  
  .pull-refresh {
    position: fixed;
    top: -50px;
    left: 0;
    right: 0;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--background-color);
    transition: transform 0.3s;
    
    &.is-active {
      transform: translateY(50px);
    }
    
    .van-icon {
      margin-right: 8px;
    }
  }
  
  .back-gesture {
    position: fixed;
    top: 50%;
    left: -50px;
    width: 50px;
    height: 50px;
    border-radius: 25px;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateY(-50%);
    transition: all 0.3s;
    
    &.is-active {
      transform: translate(70px, -50%);
      opacity: 0;
    }
    
    .van-icon {
      color: white;
      font-size: 24px;
    }
  }
}
</style> 