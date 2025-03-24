<template>
  <div class="chat-page">
    <Header
      @toggle-menu="toggleMenu"
      @toggle-phone="togglePhone"
    />
    
    <div class="chat-container">
      <div class="message-container" ref="messageContainer">
        <MessageList 
          :messages="messages" 
          :loading="loading" 
          @scroll="handleScroll"
        />
      </div>
    </div>

    <MessageInput 
      @send="handleSend" 
      :disabled="loading"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useModelStore } from '../stores/model'
import { useChatStore } from '../stores/chat'
import Header from '../components/Header.vue'
import MarkdownIt from 'markdown-it'
import MessageList from '@/components/MessageList.vue'
import MessageInput from '@/components/MessageInput.vue'
import { publicNotes, chat, llm } from '@/api'
import { Toast } from 'vant'

const md = new MarkdownIt()
const messageList = ref(null)
const inputText = ref('')
const loading = ref(false)
const error = ref(null)
const messageContainer = ref(null)

const modelStore = useModelStore()
const chatStore = useChatStore()
const { messages } = chatStore

const renderMessage = (content) => {
  return md.render(content)
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

const handleSend = async (message) => {
  try {
    loading.value = true
    
    // 添加用户消息到列表
    messages.value.push(message)
    await scrollToBottom()

    // 根据消息类型处理
    let response
    if (message.type === 'note') {
      // 保存到公共笔记
      response = await publicNotes.add(message.content)
      Toast.success('笔记已保存')
    } else if (message.type === 'llm') {
      // 发送到LLM并等待回复
      response = await llm.ask(message.content)
      // 添加LLM回复到消息列表
      messages.value.push({
        type: 'llm',
        content: response.text,
        timestamp: Date.now()
      })
      await scrollToBottom()
    } else {
      // 普通聊天消息
      response = await chat.send(message)
    }
  } catch (error) {
    Toast.fail(error.message || '发送失败')
  } finally {
    loading.value = false
  }
}

const toggleMenu = () => {
  // TODO: 实现菜单切换
}

const togglePhone = () => {
  // TODO: 实现语音功能
}

// 监听滚动事件
const handleScroll = (event) => {
  // 这里可以添加下拉加载历史消息的逻辑
  const { scrollTop } = event.target
  if (scrollTop === 0 && !loading.value) {
    loadHistory()
  }
}

// 加载历史消息
const loadHistory = async () => {
  try {
    loading.value = true
    const history = await chat.getHistory()
    messages.value = history
    await scrollToBottom()
  } catch (error) {
    Toast.fail('加载历史消息失败')
  } finally {
    loading.value = false
  }
}

// 监听错误状态显示提示
watch(error, (newError) => {
  if (newError) {
    // 使用 Vant 的 Toast 显示错误信息
    Toast.fail(newError)
  }
})

onMounted(() => {
  loadHistory()
})
</script>

<style lang="scss" scoped>
.chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 60px 16px 60px;
}

.message-container {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; // 优化iOS滚动
  padding-bottom: env(safe-area-inset-bottom); // 适配安全区域
}

.message-list {
  .message-item {
    margin-bottom: 16px;
    
    &.user {
      .message-content {
        background-color: #007AFF;
        color: #fff;
        margin-left: auto;
        border-radius: 16px 4px 16px 16px;
      }
    }
    
    &.assistant {
      .message-content {
        background-color: #fff;
        border-radius: 4px 16px 16px 16px;
      }
    }
    
    .message-content {
      max-width: 80%;
      padding: 12px 16px;
      font-size: 15px;
      line-height: 1.4;
      word-break: break-word;
      
      :deep(p) {
        margin: 0;
      }
      
      :deep(pre) {
        margin: 8px 0;
        padding: 12px;
        background-color: rgba(0, 0, 0, 0.04);
        border-radius: 8px;
        overflow-x: auto;
      }
    }
  }
}

.input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 8px 16px;
  border-top: 1px solid #ebedf0;
  
  :deep(.van-field__button) {
    margin-left: 8px;
  }
}
</style> 