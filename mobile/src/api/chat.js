import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 发送消息到服务器
export const sendMessage = async (message) => {
  try {
    const response = await api.post('/chat', message)
    return response.data
  } catch (error) {
    console.error('发送消息失败:', error)
    throw error
  }
}

// 获取笔记内容
export const getNotes = async () => {
  try {
    const response = await api.get('/notes')
    return response.data
  } catch (error) {
    console.error('获取笔记失败:', error)
    throw error
  }
}

// 保存笔记
export const saveNote = async (note) => {
  try {
    const response = await api.post('/notes', note)
    return response.data
  } catch (error) {
    console.error('保存笔记失败:', error)
    throw error
  }
} 