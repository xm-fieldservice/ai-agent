import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'

export const useMessageStore = defineStore('message', () => {
  // 状态
  const messages = ref([])
  const loading = ref(false)
  const hasMore = ref(true)
  const error = ref(null)
  
  // 格式化时间戳
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  
  // 发送消息
  const sendMessage = async (message, options = {}) => {
    const { timeout } = options
    
    try {
      error.value = null
      loading.value = true
      
      // 检查网络状态
      if (!navigator.onLine) {
        throw new Error('网络连接已断开')
      }
      
      // 创建请求控制器
      const controller = new AbortController()
      const timeoutId = timeout && setTimeout(() => controller.abort(), timeout)
      
      const response = await request.post('/messages', message, {
        signal: controller.signal
      })
      
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      const newMessage = {
        ...message,
        id: response.id,
        timestamp: response.timestamp || Date.now(),
        formattedTime: formatTimestamp(response.timestamp || Date.now())
      }
      messages.value.push(newMessage)
      return newMessage
    } catch (err) {
      error.value = err.message
      if (err.name === 'AbortError') {
        throw new Error('请求超时')
      }
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 加载更多消息
  const loadMoreMessages = async () => {
    if (!hasMore.value || loading.value) return
    
    try {
      error.value = null
      loading.value = true
      
      // 检查网络状态
      if (!navigator.onLine) {
        throw new Error('网络连接已断开')
      }
      
      const lastId = messages.value[0]?.id
      const response = await request.get('/messages', {
        params: {
          before: lastId,
          limit: 20
        }
      })
      
      const newMessages = response.data.map(msg => ({
        ...msg,
        formattedTime: formatTimestamp(msg.timestamp)
      }))
      
      if (newMessages.length < 20) {
        hasMore.value = false
      }
      
      messages.value.unshift(...newMessages)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 测试连接
  const testConnection = async () => {
    try {
      error.value = null
      const response = await request.get('/health')
      return {
        status: 'success',
        timestamp: formatTimestamp(Date.now()),
        ...response
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }
  
  // 测试流式响应
  const testStreamResponse = async ({ onMessage, onProgress }) => {
    const mockText = '这是一个模拟的流式响应测试。我们将逐字发送这段文字，以模拟AI回答时的打字效果。'
    const chars = mockText.split('')
    let content = ''
    
    try {
      error.value = null
      
      for (let i = 0; i < chars.length; i++) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 100))
        
        content += chars[i]
        onMessage(chars[i])
        onProgress(Math.floor((i + 1) / chars.length * 100))
        
        // 随机模拟错误
        if (Math.random() < 0.01) {
          throw new Error('模拟的流式响应错误')
        }
      }
      
      return {
        status: 'success',
        content,
        timestamp: Date.now()
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }
  
  return {
    messages,
    loading,
    hasMore,
    error,
    sendMessage,
    loadMoreMessages,
    testConnection,
    testStreamResponse
  }
}) 