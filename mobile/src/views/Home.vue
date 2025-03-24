<template>
  <div class="home">
    <van-nav-bar
      title="AI助手"
      left-arrow
      @click-left="onClickLeft"
    />
    
    <div class="content">
      <communication-test />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import CommunicationTest from '../components/CommunicationTest.vue'

const router = useRouter()

const onClickLeft = () => {
  router.back()
}
</script>

<style scoped lang="scss">
.home {
  height: 100vh;
  display: flex;
  flex-direction: column;
  
  .content {
    flex: 1;
    overflow-y: auto;
    background-color: #f7f8fa;
  }
}
</style> 