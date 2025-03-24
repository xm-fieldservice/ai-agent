import { ref } from 'vue'
import axios from 'axios'

export function useChat() {
  const messages = ref([])
  const loading = ref(false)
  const currentModel = ref('gpt-3.5-turbo')
  
  const sendMessage = async (content) => {
    if (loading.value) return
    
    // 添加用户消息
    messages.value.push({
      role: 'user',
      content
    })
    
    loading.value = true
    
    try {
      const response = await axios.post('/api/chat', {
        messages: messages.value,
        model: currentModel.value
      })
      
      // 添加助手回复
      messages.value.push({
        role: 'assistant',
        content: response.data.content
      })
    } catch (error) {
      console.error('发送消息失败:', error)
      messages.value.push({
        role: 'assistant',
        content: '抱歉，发生了一些错误。请稍后重试。'
      })
    } finally {
      loading.value = false
    }
  }
  
  const setModel = (model) => {
    currentModel.value = model
  }
  
  return {
    messages,
    loading,
    currentModel,
    sendMessage,
    setModel
  }
} 