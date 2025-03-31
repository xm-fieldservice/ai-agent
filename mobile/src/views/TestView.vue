<template>
  <div class="test-view">
    <van-nav-bar
      title="移动端适配测试"
      left-arrow
      @click-left="router.back()"
    />
    
    <div class="test-section">
      <h3>1. 键盘测试</h3>
      <van-field
        v-model="inputText"
        label="输入测试"
        placeholder="点击输入，测试键盘弹出"
        :autosize="{ maxHeight: 100, minHeight: 50 }"
      />
      <div class="status">
        <p>键盘状态: {{ isKeyboardVisible ? '显示' : '隐藏' }}</p>
        <p>键盘高度: {{ keyboardHeight }}px</p>
      </div>
    </div>

    <div class="test-section">
      <h3>2. 手势测试</h3>
      <van-cell-group inset>
        <van-cell title="下拉刷新">
          <template #label>
            <span>在页面顶部下拉测试刷新效果</span>
          </template>
        </van-cell>
        <van-cell v-if="isIOS" title="返回手势">
          <template #label>
            <span>从屏幕左边缘右滑测试返回效果</span>
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <div class="test-section">
      <h3>3. 安全区域测试</h3>
      <div class="safe-area-demo">
        <div class="top-area">顶部安全区域: {{ safeAreaTop }}px</div>
        <div class="bottom-area">底部安全区域: {{ safeAreaBottom }}px</div>
      </div>
    </div>

    <div class="test-section">
      <h3>4. 滚动测试</h3>
      <van-button type="primary" @click="toggleScroll">
        {{ isScrollDisabled ? '启用滚动' : '禁用滚动' }}
      </van-button>
      <div class="scroll-area">
        <p v-for="i in 20" :key="i">测试内容 {{ i }}</p>
      </div>
    </div>

    <div class="test-section">
      <h3>5. 设备信息</h3>
      <van-cell-group inset>
        <van-cell title="设备类型" :value="deviceType" />
        <van-cell title="窗口高度" :value="`${windowHeight}px`" />
        <van-cell title="视口宽度" :value="`${viewportWidth}px`" />
      </van-cell-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  isIOS,
  isAndroid,
  keyboardHeight,
  isKeyboardVisible,
  safeAreaTop,
  safeAreaBottom,
  windowHeight,
  disableScroll,
  enableScroll
} from '@/utils/mobileAdapter'

const router = useRouter()
const inputText = ref('')
const isScrollDisabled = ref(false)
const viewportWidth = ref(0)

onMounted(() => {
  viewportWidth.value = window.innerWidth
  window.addEventListener('resize', () => {
    viewportWidth.value = window.innerWidth
  })
})

const deviceType = computed(() => {
  if (isIOS) return 'iOS设备'
  if (isAndroid) return 'Android设备'
  return '其他设备'
})

const toggleScroll = () => {
  if (isScrollDisabled.value) {
    enableScroll()
  } else {
    disableScroll()
  }
  isScrollDisabled.value = !isScrollDisabled.value
}
</script>

<style lang="scss" scoped>
.test-view {
  // 样式已移至 components.scss
}
</style> 