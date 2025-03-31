<template>
  <div class="app">
    <van-nav-bar
      title="内务系统"
      :left-arrow="showBack"
      @click-left="onClickLeft"
    />
    
    <div class="content">
      <router-view></router-view>
    </div>

    <van-tabbar v-model="active" route>
      <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/tasks" icon="todo-list-o">任务</van-tabbar-item>
      <van-tabbar-item to="/messages" icon="chat-o">消息</van-tabbar-item>
      <van-tabbar-item to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const active = ref(0)

const showBack = computed(() => {
  return route.path !== '/'
})

const onClickLeft = () => {
  router.back()
}
</script>

<style lang="scss" scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--background-color);
  
  .content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-base);
  }
}
</style> 