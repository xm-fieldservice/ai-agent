<template>
  <div class="home-view">
    <h1>移动端适配测试</h1>
    <van-cell-group inset>
      <van-cell 
        title="功能测试" 
        is-link 
        @click="$router.push('/test')"
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
  padding: $spacing-base;
  padding-top: calc($spacing-base + var(--safe-area-top));
  padding-bottom: calc($spacing-base + var(--safe-area-bottom));

  h1 {
    margin: 0 0 $spacing-lg;
    font-size: $font-size-xl;
    font-weight: bold;
    color: $text-color;
    text-align: center;
  }
}
</style> 