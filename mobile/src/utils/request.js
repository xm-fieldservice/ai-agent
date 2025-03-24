import axios from 'axios'
import { showNotify, showDialog } from 'vant'

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 在这里可以添加token等认证信息
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    
    // 这里可以根据后端的响应结构进行适配
    if (res.code && res.code !== 200) {
      showNotify({
        type: 'danger',
        message: res.message || '请求失败'
      })
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res
  },
  error => {
    console.error('响应错误:', error)
    
    // 处理不同类型的错误
    let message = '请求失败'
    if (error.response) {
      // 服务器返回错误状态码
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `请求失败: ${error.response.status}`
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时，请检查网络连接'
    } else if (error.message.includes('Network Error')) {
      message = '网络错误，请检查后端服务是否正常运行'
      // 显示更详细的错误对话框
      showDialog({
        title: '连接错误',
        message: '无法连接到后端服务，请确保：\n1. 后端服务已启动\n2. 服务地址配置正确\n3. 网络连接正常',
        confirmButtonText: '我知道了'
      })
    } else {
      message = error.message
    }
    
    showNotify({
      type: 'danger',
      message
    })
    
    return Promise.reject(error)
  }
)

export default request 