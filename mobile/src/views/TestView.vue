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
        <van-cell title="视口宽度" :value="`${window.innerWidth}px`" />
      </van-cell-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
  min-height: 100vh;
  padding: 16px;
  padding-top: calc(46px + var(--safe-area-top));
  padding-bottom: var(--safe-area-bottom);
  background: #f7f8fa;

  .test-section {
    margin-bottom: 24px;
    background: #fff;
    border-radius: 8px;
    padding: 16px;

    h3 {
      margin: 0 0 16px;
      font-size: 16px;
      color: #323233;
    }

    .status {
      margin-top: 8px;
      font-size: 14px;
      color: #969799;
    }

    .safe-area-demo {
      position: relative;
      height: 100px;
      background: #f2f3f5;
      border-radius: 4px;
      overflow: hidden;

      .top-area,
      .bottom-area {
        position: absolute;
        left: 0;
        right: 0;
        height: 24px;
        line-height: 24px;
        text-align: center;
        font-size: 12px;
        color: #fff;
      }

      .top-area {
        top: 0;
        background: rgba(76, 175, 80, 0.5);
      }

      .bottom-area {
        bottom: 0;
        background: rgba(33, 150, 243, 0.5);
      }
    }

    .scroll-area {
      margin-top: 16px;
      height: 200px;
      overflow-y: auto;
      background: #f2f3f5;
      border-radius: 4px;
      padding: 8px;

      p {
        margin: 8px 0;
        padding: 8px;
        background: #fff;
        border-radius: 4px;
      }
    }
  }
}

.van-nav-bar {
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
</style> 