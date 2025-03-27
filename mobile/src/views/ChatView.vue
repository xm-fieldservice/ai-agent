<template>
  <div class="chat-view">
    <div class="feature-container">
      <FeatureSelector
        :initial-features="availableFeatures"
        :active-feature-id="selectedFeatureId"
        @feature-selected="handleFeatureSelect"
        @features-loaded="handleFeaturesLoaded"
      />
    </div>

    <div class="chat-content">
      <template v-if="selectedFeature">
        <MessageHistory
          :feature-id="selectedFeature.id"
          ref="messageHistoryRef"
          @retry="handleMessageRetry"
        />
      </template>
      <div v-else class="no-feature-selected">
        请选择一个功能开始对话
      </div>
    </div>

    <div class="input-container">
      <CollapsibleInputBox
        :type="currentInputType"
        :expanded="inputExpanded"
        :placeholder="getInputPlaceholder"
        :action-buttons="inputActions"
        :disabled="!isOnline && !selectedFeature"
        @expand="handleInputExpand"
        @collapse="handleInputCollapse"
        @send="handleSendMessage"
        @action-click="handleInputAction"
        ref="inputBoxRef"
      />
    </div>
    
    <div v-if="!isOnline" class="offline-indicator">
      <span>离线模式</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import FeatureSelector from '../components/FeatureSelector.vue'
import MessageHistory from '../components/MessageHistory.vue'
import CollapsibleInputBox from '../components/CollapsibleInputBox.vue'
import { featureService, type Feature } from '../services/feature-service'
import { storageService, type Message } from '../services/storage-service'

// 状态
const availableFeatures = ref<Feature[]>([])
const selectedFeature = ref<Feature | null>(null)
const selectedFeatureId = computed(() => selectedFeature.value?.id)
const inputExpanded = ref(false)
const currentInputType = ref('text')
const messageHistoryRef = ref<InstanceType<typeof MessageHistory> | null>(null)
const inputBoxRef = ref<InstanceType<typeof CollapsibleInputBox> | null>(null)
const isOnline = ref(navigator.onLine)

// 输入框占位符
const getInputPlaceholder = computed(() => {
  if (!selectedFeature.value) return '请先选择一个功能'
  if (!isOnline.value) return '离线模式 - 消息将在恢复连接后发送'
  return `发送消息给 ${selectedFeature.value.name}`
})

// 输入框操作按钮
const inputActions = [
  { icon: 'image', tooltip: '发送图片' },
  { icon: 'attachment', tooltip: '发送附件' },
  { icon: 'emoji', tooltip: '选择表情' }
]

// 处理功能选择
async function handleFeatureSelect(feature: Feature) {
  selectedFeature.value = feature
  // 重置输入框状态
  inputExpanded.value = false
  if (inputBoxRef.value) {
    inputBoxRef.value.reset()
  }
}

// 处理功能加载完成
function handleFeaturesLoaded(features: Feature[]) {
  availableFeatures.value = features
  // 默认选择第一个功能
  if (features.length > 0 && !selectedFeature.value) {
    handleFeatureSelect(features[0])
  }
}

// 处理输入框展开/折叠
function handleInputExpand() {
  inputExpanded.value = true
}

function handleInputCollapse() {
  inputExpanded.value = false
}

// 处理消息发送
async function handleSendMessage(content: string) {
  if (!selectedFeature.value) return

  const messageId = Date.now().toString()
  const timestamp = new Date()

  // 创建消息对象
  const message: Message = {
    id: messageId,
    featureId: selectedFeature.value.id,
    content,
    timestamp,
    source: 'mobile',
    status: isOnline.value ? 'pending' : 'failed'
  }

  // 如果不在线，添加错误信息
  if (!isOnline.value) {
    message.error = '设备离线，消息将在恢复连接后发送'
  }

  // 添加消息到历史记录
  if (messageHistoryRef.value) {
    await messageHistoryRef.value.addMessage(message)
  }

  // 如果在线，发送消息
  if (isOnline.value) {
    try {
      await featureService.sendFeatureMessage(
        selectedFeature.value.id,
        content
      )
      
      // 更新消息状态为已发送
      if (messageHistoryRef.value) {
        await messageHistoryRef.value.updateMessageStatus(messageId, 'sent')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      
      // 更新消息状态为发送失败
      if (messageHistoryRef.value) {
        const errorMessage = error instanceof Error ? error.message : '发送失败'
        await messageHistoryRef.value.updateMessageStatus(messageId, 'failed', errorMessage)
      }
    }
  }
}

// 处理消息重试
async function handleMessageRetry(message: Message) {
  if (!selectedFeature.value || !isOnline.value) return
  
  try {
    // 更新状态为发送中
    if (messageHistoryRef.value) {
      await messageHistoryRef.value.updateMessageStatus(message.id, 'pending')
    }
    
    // 重发消息
    await featureService.sendFeatureMessage(
      selectedFeature.value.id,
      message.content
    )
    
    // 更新状态为成功
    if (messageHistoryRef.value) {
      await messageHistoryRef.value.updateMessageStatus(message.id, 'sent')
    }
  } catch (error) {
    console.error('重发消息失败:', error)
    
    // 更新状态为失败
    if (messageHistoryRef.value) {
      const errorMessage = error instanceof Error ? error.message : '发送失败'
      await messageHistoryRef.value.updateMessageStatus(message.id, 'failed', errorMessage)
    }
  }
}

// 处理网络状态变化
function handleOnlineStatus() {
  const wasOffline = !isOnline.value
  isOnline.value = navigator.onLine
  
  // 如果从离线变为在线，尝试发送所有失败的消息
  if (wasOffline && isOnline.value) {
    retrySendFailedMessages()
  }
}

// 尝试发送失败的消息
async function retrySendFailedMessages() {
  if (!selectedFeature.value) return
  
  try {
    // 获取当前功能的所有消息
    const allMessages = await storageService.getMessagesByFeature(selectedFeature.value.id)
    
    // 筛选出失败的消息
    const failedMessages = allMessages.filter(m => m.status === 'failed')
    
    // 逐个重发
    for (const message of failedMessages) {
      await handleMessageRetry(message)
    }
  } catch (error) {
    console.error('重发失败消息出错:', error)
  }
}

// 处理输入框操作按钮点击
function handleInputAction(action: { icon: string }) {
  // TODO: 实现各种操作按钮的功能
  console.log('Input action clicked:', action)
}

// 初始化
onMounted(async () => {
  try {
    // 初始化存储服务
    await storageService.initialize()
    
    // 初始化功能服务
    await featureService.initialize()
    handleFeaturesLoaded(featureService.getFeatures())
    
    // 添加网络状态监听
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)
  } catch (error) {
    console.error('初始化失败:', error)
    // TODO: 显示错误提示
  }
})

// 清理事件监听
onUnmounted(() => {
  window.removeEventListener('online', handleOnlineStatus)
  window.removeEventListener('offline', handleOnlineStatus)
})
</script>

<style scoped lang="scss">
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--background-color);
  position: relative;
  
  .feature-container {
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-color);
  }
  
  .chat-content {
    flex: 1;
    overflow: hidden;
    position: relative;
    
    .no-feature-selected {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);
    }
  }
  
  .input-container {
    flex-shrink: 0;
    border-top: 1px solid var(--border-color);
  }
  
  .offline-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    background-color: var(--error-color);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    z-index: 10;
  }
}
</style> 