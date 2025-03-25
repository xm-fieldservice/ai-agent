<template>
  <div class="home-view">
    <h1>移动端适配测试</h1>
    <van-cell-group inset>
      <van-cell 
        title="功能测试" 
        is-link 
        @click="router.push('/test')"
      >
        <template #label>
          <span>测试键盘处理、手势操作等功能</span>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style lang="scss" scoped>
.home-view {
  padding: 16px;
  padding-top: calc(16px + var(--safe-area-top));
  padding-bottom: calc(16px + var(--safe-area-bottom));

  h1 {
    margin: 0 0 24px;
    font-size: 24px;
    font-weight: bold;
    color: #323233;
    text-align: center;
  }
}
</style> 