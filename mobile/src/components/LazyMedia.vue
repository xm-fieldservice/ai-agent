<template>
  <div 
    class="lazy-media" 
    :class="[type, { loading, error: !!errorMessage }]"
    :style="mediaStyle"
  >
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span v-if="loadingProgress" class="loading-progress">
        {{ Math.round(loadingProgress) }}%
      </span>
    </div>

    <!-- 错误状态 -->
    <div v-if="errorMessage" class="error-overlay">
      <span class="error-message">{{ errorMessage }}</span>
      <button @click="retryLoading" class="retry-button">重试</button>
    </div>

    <!-- 图片预览 -->
    <template v-if="type === 'image'">
      <!-- 缩略图 -->
      <img
        v-if="thumbnailUrl && !isLoaded"
        :src="thumbnailUrl"
        class="thumbnail"
        :style="thumbnailStyle"
        alt="缩略图"
      />
      <!-- 完整图片 -->
      <img
        ref="imageRef"
        v-show="isLoaded"
        :src="url"
        :alt="alt"
        class="full-image"
        @load="handleLoad"
        @error="handleError"
      />
    </template>

    <!-- 视频预览 -->
    <template v-else-if="type === 'video'">
      <video
        ref="videoRef"
        class="video-player"
        :poster="thumbnailUrl"
        controls
        preload="metadata"
        @loadedmetadata="handleLoad"
        @error="handleError"
      >
        <source :src="url" :type="mediaType">
        您的浏览器不支持视频播放
      </video>
    </template>

    <!-- 音频预览 -->
    <template v-else-if="type === 'audio'">
      <audio
        ref="audioRef"
        class="audio-player"
        controls
        preload="metadata"
        @loadedmetadata="handleLoad"
        @error="handleError"
      >
        <source :src="url" :type="mediaType">
        您的浏览器不支持音频播放
      </audio>
    </template>

    <!-- 文件预览 -->
    <template v-else-if="type === 'file'">
      <div class="file-preview" @click="handleFileClick">
        <div class="file-icon">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="currentColor"/>
            <path d="M14 3v5h5" fill="currentColor"/>
          </svg>
        </div>
        <div class="file-info">
          <span class="file-name">{{ fileName }}</span>
          <span class="file-size">{{ formatFileSize(fileSize) }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const props = defineProps<{
  url: string
  type: 'image' | 'video' | 'audio' | 'file'
  thumbnailUrl?: string
  alt?: string
  width?: number
  height?: number
  mediaType?: string
  fileName?: string
  fileSize?: number
}>()

const emit = defineEmits<{
  (e: 'load'): void
  (e: 'error', error: Error): void
  (e: 'click'): void
}>()

// 状态
const loading = ref(false)
const isLoaded = ref(false)
const errorMessage = ref<string | null>(null)
const loadingProgress = ref<number | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)

// 计算属性
const mediaStyle = computed(() => {
  if (props.width && props.height) {
    return {
      aspectRatio: `${props.width}/${props.height}`,
      maxWidth: '100%',
      height: 'auto'
    }
  }
  return {}
})

const thumbnailStyle = computed(() => {
  return {
    filter: 'blur(10px)',
    transform: 'scale(1.1)'
  }
})

// 方法
function handleLoad() {
  isLoaded.value = true
  loading.value = false
  errorMessage.value = null
  emit('load')
}

function handleError(event: ErrorEvent) {
  loading.value = false
  errorMessage.value = '加载失败'
  emit('error', event.error || new Error('加载失败'))
}

function retryLoading() {
  errorMessage.value = null
  loading.value = true
  loadMedia()
}

function handleFileClick() {
  emit('click')
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '未知大小'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// 加载媒体
async function loadMedia() {
  if (isLoaded.value || loading.value) return
  
  loading.value = true
  loadingProgress.value = 0
  
  try {
    if (props.type === 'image') {
      // 图片加载进度模拟
      const interval = setInterval(() => {
        if (loadingProgress.value && loadingProgress.value < 90) {
          loadingProgress.value += 10
        }
      }, 200)
      
      // 清理定时器
      onUnmounted(() => clearInterval(interval))
    } else if (props.type === 'video' || props.type === 'audio') {
      const mediaElement = props.type === 'video' ? videoRef.value : audioRef.value
      if (mediaElement) {
        mediaElement.load()
      }
    }
  } catch (error) {
    console.error('媒体加载失败:', error)
    errorMessage.value = '加载失败'
    loading.value = false
  }
}

// 使用 Intersection Observer 实现懒加载
const { stop } = useIntersectionObserver(
  imageRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      loadMedia()
      stop()
    }
  },
  { threshold: 0.1 }
)

onMounted(() => {
  if (props.type !== 'image') {
    loadMedia()
  }
})
</script>

<style scoped lang="scss">
.lazy-media {
  position: relative;
  width: 100%;
  background-color: var(--background-secondary);
  border-radius: 8px;
  overflow: hidden;
  
  &.loading {
    min-height: 100px;
  }
  
  &.error {
    min-height: 100px;
    background-color: var(--error-background);
  }
  
  .loading-overlay,
  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    z-index: 1;
  }
  
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-progress {
    margin-top: 8px;
    font-size: 14px;
  }
  
  .error-message {
    margin-bottom: 8px;
    font-size: 14px;
  }
  
  .retry-button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    background-color: var(--primary-color);
    color: white;
    font-size: 14px;
    cursor: pointer;
    
    &:hover {
      opacity: 0.9;
    }
  }
  
  .thumbnail,
  .full-image {
    display: block;
    width: 100%;
    height: auto;
  }
  
  .thumbnail {
    transition: filter 0.3s ease;
  }
  
  .video-player,
  .audio-player {
    display: block;
    width: 100%;
    max-height: 400px;
  }
  
  .file-preview {
    display: flex;
    align-items: center;
    padding: 12px;
    cursor: pointer;
    
    &:hover {
      background-color: var(--hover-background);
    }
    
    .file-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      margin-right: 12px;
      color: var(--text-secondary);
    }
    
    .file-info {
      flex: 1;
      min-width: 0;
      
      .file-name {
        display: block;
        font-size: 14px;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .file-size {
        display: block;
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 4px;
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 