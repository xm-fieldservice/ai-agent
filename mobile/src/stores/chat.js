import { defineStore } from 'pinia'
import axios from 'axios'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: []
  }),
  
  actions: {
    async sendMessage({ content, model }) {
      // 添加用户消息
      this.messages.push({
        role: 'user',
        content
      })
      
      try {
        const response = await axios.post('/api/chat', {
          messages: [{ role: 'user', content }],
          model: model.id
        })
        
        // 添加助手回复
        this.messages.push({
          role: 'assistant',
          content: response.data.content
        })
        
        return response.data
      } catch (error) {
        console.error('发送消息失败:', error)
        throw error
      }
    },
    
    clearMessages() {
      this.messages = []
    }
  }
}) 