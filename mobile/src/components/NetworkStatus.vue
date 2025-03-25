<template>
  <div class="network-status" :class="{ 'is-offline': !isOnline }">
    <van-icon :name="isOnline ? 'wifi' : 'warning'" />
    <span>{{ statusText }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { showToast } from 'vant'

const isOnline = ref(navigator.onLine)
const statusText = ref('')

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
  statusText.value = isOnline.value ? '已连接网络' : '当前处于离线状态'
  
  showToast({
    type: isOnline.value ? 'success' : 'warning',
    message: statusText.value,
    duration: 2000
  })
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  updateOnlineStatus()
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style lang="scss" scoped>
.network-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 4px 8px;
  background-color: #4caf50;
  color: white;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  transform: translateY(-100%);
  
  &.is-offline {
    background-color: #ff9800;
    transform: translateY(0);
  }
  
  .van-icon {
    margin-right: 4px;
  }
}
</style> 