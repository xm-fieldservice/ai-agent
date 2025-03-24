import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 测试用的公共笔记文档API
export const publicNotes = {
  // 获取笔记列表
  getList: async () => {
    try {
      const response = await api.get('/notes')
      return response.data
    } catch (error) {
      console.error('获取笔记列表失败:', error)
      throw error
    }
  },

  // 添加新笔记
  add: async (content) => {
    try {
      const response = await api.post('/notes', { content })
      return response.data
    } catch (error) {
      console.error('添加笔记失败:', error)
      throw error
    }
  },

  // 更新笔记
  update: async (id, content) => {
    try {
      const response = await api.put(`/notes/${id}`, { content })
      return response.data
    } catch (error) {
      console.error('更新笔记失败:', error)
      throw error
    }
  }
}

// 聊天相关API
export const chat = {
  // 发送消息
  send: async (message) => {
    try {
      const response = await api.post('/chat', message)
      return response.data
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  },

  // 获取历史消息
  getHistory: async () => {
    try {
      const response = await api.get('/chat/history')
      return response.data
    } catch (error) {
      console.error('获取历史消息失败:', error)
      throw error
    }
  }
}

// LLM问答API
export const llm = {
  // 发送问题
  ask: async (question) => {
    try {
      const response = await api.post('/generate', { prompt: question })
      return response.data
    } catch (error) {
      console.error('发送问题失败:', error)
      throw error
    }
  }
} 