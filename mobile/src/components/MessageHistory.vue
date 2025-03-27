<template>
  <div class="message-history" ref="historyRef">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载消息历史...</span>
    </div>
    
    <div v-else-if="error" class="error-state">
      <span class="error-message">{{ error }}</span>
      <button @click="retryLoading" class="retry-button">重试</button>
    </div>
    
    <template v-else>
      <div v-if="messages.length === 0" class="empty-state">
        <span>暂无消息</span>
      </div>
      
      <RecycleScroller
        v-else
        class="message-list"
        :items="messages"
        :item-size="estimateMessageHeight"
        key-field="id"
        v-slot="{ item: message }"
        @visible="handleVisibleItems"
      >
        <div 
          class="message-item"
          :class="[
            message.source === 'mobile' ? 'sent' : 'received',
            { 'status-failed': message.status === 'failed' },
            'animate-message'
          ]"
        >
          <div class="message-content">
            <div v-if="message.type === 'text'" class="message-text">
              {{ message.content }}
            </div>
            <LazyMedia
              v-else
              :url="message.type === 'file' ? message.file?.url : message.media?.url"
              :type="message.type"
              :thumbnail-url="message.media?.thumbnailUrl"
              :width="message.media?.width"
              :height="message.media?.height"
              :media-type="message.media?.type"
              :file-name="message.file?.name"
              :file-size="message.file?.size"
              class="message-media"
              @error="handleMediaError(message)"
            />
            <div class="message-meta">
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              <transition name="fade">
                <span v-if="message.status === 'failed'" class="message-error">
                  发送失败
                  <button @click="resendMessage(message)" class="resend-button">
                    重试
                  </button>
                </span>
                <span v-else-if="message.status === 'pending'" class="message-pending">
                  发送中...
                </span>
              </transition>
            </div>
          </div>
        </div>
      </RecycleScroller>
      
      <div v-if="hasMoreMessages" class="load-more">
        <button 
          @click="loadMoreMessages" 
          :disabled="loadingMore" 
          class="load-more-button"
        >
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { featureService } from '../services/feature-service'
import { storageService, type Message } from '../services/storage-service'
import LazyMedia from './LazyMedia.vue'

const props = defineProps<{
  featureId: string
}>()

const emit = defineEmits<{
  (e: 'retry', message: Message): void
}>()

const messages = ref<Message[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const historyRef = ref<HTMLElement | null>(null)
const messageOffset = ref(0)
const messagesPerPage = 20
const hasMoreMessages = ref(false)
const visibleItems = ref<{ item: Message; index: number }[]>([])

// 估算消息高度
function estimateMessageHeight(message: Message): number {
  // 基础高度（包含padding、margin等）
  const baseHeight = 60
  // 每行文字高度（假设每行20个字符）
  const lineHeight = 24
  const linesCount = Math.ceil(message.content.length / 20)
  return baseHeight + (lineHeight * linesCount)
}

// 处理可见项变化
function handleVisibleItems(items: { item: Message; index: number }[]) {
  visibleItems.value = items
  
  // 如果滚动到底部附近，自动加载更多
  const lastVisibleIndex = items[items.length - 1]?.index
  if (lastVisibleIndex && lastVisibleIndex >= messages.value.length - 5) {
    if (hasMoreMessages.value && !loadingMore.value) {
      loadMoreMessages()
    }
  }
}

// 格式化时间
function formatTime(timestamp: Date | string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 重新加载消息
async function retryLoading() {
  error.value = null
  messageOffset.value = 0
  await loadMessages()
}

// 加载更多消息
async function loadMoreMessages() {
  if (loadingMore.value) return
  
  loadingMore.value = true
  try {
    messageOffset.value += messagesPerPage
    const olderMessages = await storageService.getMessagesByFeaturePaginated(
      props.featureId,
      messagesPerPage,
      messageOffset.value
    )
    
    if (olderMessages.length > 0) {
      messages.value = [...messages.value, ...olderMessages]
      hasMoreMessages.value = olderMessages.length === messagesPerPage
    } else {
      hasMoreMessages.value = false
    }
  } catch (err) {
    console.error('加载更多消息失败:', err)
  } finally {
    loadingMore.value = false
  }
}

// 重发消息
async function resendMessage(message: Message) {
  try {
    // 标记为发送中
    await storageService.updateMessage(message.id, { status: 'pending' })
    const messageIndex = messages.value.findIndex(m => m.id === message.id)
    if (messageIndex !== -1) {
      messages.value[messageIndex] = { ...messages.value[messageIndex], status: 'pending' }
    }
    
    // 重发消息
    await featureService.sendFeatureMessage(props.featureId, message.content)
    
    // 更新状态为成功
    await storageService.updateMessage(message.id, { status: 'sent', error: undefined })
    if (messageIndex !== -1) {
      messages.value[messageIndex] = { 
        ...messages.value[messageIndex], 
        status: 'sent',
        error: undefined
      }
    }
  } catch (err) {
    console.error('重发消息失败:', err)
    
    // 更新状态为失败
    const error = err instanceof Error ? err.message : '发送失败'
    await storageService.updateMessage(message.id, { 
      status: 'failed', 
      error 
    })
    
    const messageIndex = messages.value.findIndex(m => m.id === message.id)
    if (messageIndex !== -1) {
      messages.value[messageIndex] = { 
        ...messages.value[messageIndex], 
        status: 'failed',
        error
      }
    }
    
    emit('retry', message)
  }
}

// 加载消息历史
async function loadMessages() {
  loading.value = true
  error.value = null
  messageOffset.value = 0
  
  try {
    await storageService.initialize()
    
    // 从存储中加载消息
    const storedMessages = await storageService.getMessagesByFeaturePaginated(
      props.featureId,
      messagesPerPage,
      0
    )
    
    messages.value = storedMessages
    hasMoreMessages.value = storedMessages.length === messagesPerPage
    
    // 更新功能访问记录
    const feature = featureService.getFeatureById(props.featureId)
    if (feature) {
      await storageService.updateFeatureAccess(props.featureId, feature.name)
    }
  } catch (err) {
    console.error('加载消息失败:', err)
    error.value = '加载消息失败，请重试'
  } finally {
    loading.value = false
  }
}

// 滚动到底部
function scrollToBottom() {
  if (historyRef.value) {
    historyRef.value.scrollTo({
      top: historyRef.value.scrollHeight,
      behavior: 'smooth'
    });
  }
}

// 添加新消息
async function addMessage(message: Message): Promise<void> {
  // 保存到存储
  await storageService.addMessage(message)
  
  // 添加到UI
  messages.value.unshift(message)
  
  // 下一个事件循环滚动到底部
  setTimeout(scrollToBottom, 0)
}

// 更新消息状态
async function updateMessageStatus(
  messageId: string, 
  status: 'sent' | 'received' | 'failed' | 'pending',
  errorMessage?: string
): Promise<void> {
  // 更新存储
  await storageService.updateMessage(messageId, { 
    status, 
    error: errorMessage 
  })
  
  // 更新UI
  const index = messages.value.findIndex(m => m.id === messageId)
  if (index !== -1) {
    messages.value[index] = {
      ...messages.value[index],
      status,
      error: errorMessage
    }
  }
}

// 监听功能ID变化
watch(() => props.featureId, () => {
  loadMessages()
})

// 组件挂载时加载消息
onMounted(() => {
  loadMessages()
})

// 暴露方法给父组件
defineExpose({
  addMessage,
  updateMessageStatus,
  scrollToBottom
})

// 处理媒体加载错误
function handleMediaError(message: Message) {
  console.error('媒体加载失败:', message)
  // 可以在这里添加错误处理逻辑，比如显示错误提示或重试加载
}
</script>

<style scoped lang="scss">
.message-history {
  height: 100%;
  overflow: hidden;
  padding: 16px;
  background-color: var(--background-color);
  
  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-secondary);
  }
  
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-color);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .error-message {
    margin-bottom: 12px;
  }
  
  .retry-button,
  .resend-button,
  .load-more-button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    background-color: var(--primary-color);
    color: white;
    cursor: pointer;
    
    &:hover {
      opacity: 0.9;
    }
    
    &:disabled {
      background-color: var(--border-color);
      cursor: not-allowed;
    }
  }
  
  .message-list {
    height: calc(100% - 32px);
    overflow-y: auto;
    scroll-behavior: smooth;
    
    .message-item {
      display: flex;
      flex-direction: column;
      max-width: 80%;
      margin: 8px 0;
      opacity: 0;
      transform: translateY(20px);
      
      &.animate-message {
        animation: messageAppear 0.3s ease forwards;
      }
      
      &.sent {
        align-self: flex-end;
        margin-left: auto;
        
        .message-content {
          background-color: var(--primary-color);
          color: white;
          transform-origin: bottom right;
        }
      }
      
      &.received {
        align-self: flex-start;
        margin-right: auto;
        
        .message-content {
          background-color: var(--message-background);
          transform-origin: bottom left;
        }
      }
      
      &.status-failed .message-content {
        border: 1px solid var(--error-color);
        animation: shake 0.5s ease;
      }
    }
  }
  
  .message-content {
    padding: 8px 12px;
    border-radius: 12px;
    word-break: break-word;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.02);
    }
  }
  
  .message-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .message-error {
    color: var(--error-color);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .message-pending {
    color: var(--text-secondary);
    font-style: italic;
  }
  
  .load-more {
    display: flex;
    justify-content: center;
    margin: 16px 0;
  }
  
  .message-media {
    margin: 8px 0;
    max-width: 100%;
    border-radius: 8px;
    overflow: hidden;
  }
}

// 消息状态过渡
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 加载更多按钮动画
.load-more-button {
  transition: all 0.3s ease;
  
  &:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    transition: background-color 0.3s ease;
  }
}

// 消息出现动画
@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 抖动动画（用于发送失败状态）
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 