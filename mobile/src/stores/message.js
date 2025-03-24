import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'

export const useMessageStore = defineStore('message', () => {
  // 状态
  const messages = ref([])
  const loading = ref(false)
  const hasMore = ref(true)
  
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
  const sendMessage = async (message) => {
    try {
      loading.value = true
      const response = await request.post('/messages', message)
      const newMessage = {
        ...message,
        id: response.id,
        timestamp: response.timestamp || Date.now(),
        formattedTime: formatTimestamp(response.timestamp || Date.now())
      }
      messages.value.push(newMessage)
      return newMessage
    } finally {
      loading.value = false
    }
  }
  
  // 加载更多消息
  const loadMoreMessages = async () => {
    if (!hasMore.value || loading.value) return
    
    try {
      loading.value = true
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
    } finally {
      loading.value = false
    }
  }
  
  // 测试连接
  const testConnection = async () => {
    const response = await request.get('/health')
    return {
      status: 'success',
      timestamp: formatTimestamp(Date.now()),
      ...response
    }
  }
  
  return {
    messages,
    loading,
    hasMore,
    sendMessage,
    loadMoreMessages,
    testConnection
  }
}) 