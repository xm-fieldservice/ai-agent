import { showNotify } from 'vant'

// 错误类型定义
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  API: 'API',
  VALIDATION: 'VALIDATION',
  AUTH: 'AUTH',
  UNKNOWN: 'UNKNOWN'
}

// 错误处理类
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, originalError = null) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.originalError = originalError
  }
}

// 错误消息映射
const errorMessages = {
  [ErrorTypes.NETWORK]: '网络连接失败，请检查网络设置',
  [ErrorTypes.API]: 'API请求失败',
  [ErrorTypes.VALIDATION]: '输入数据验证失败',
  [ErrorTypes.AUTH]: '认证失败，请重新登录',
  [ErrorTypes.UNKNOWN]: '发生未知错误'
}

// 错误处理函数
export const handleError = (error) => {
  console.error('Error:', error)
  
  let appError
  if (error instanceof AppError) {
    appError = error
  } else if (error.response) {
    // API错误
    appError = new AppError(
      error.response.data?.message || '请求失败',
      ErrorTypes.API,
      error
    )
  } else if (error.request) {
    // 网络错误
    appError = new AppError(
      '网络请求失败',
      ErrorTypes.NETWORK,
      error
    )
  } else {
    // 其他错误
    appError = new AppError(
      error.message || '未知错误',
      ErrorTypes.UNKNOWN,
      error
    )
  }
  
  // 显示错误通知
  showNotify({
    type: 'danger',
    message: errorMessages[appError.type] + ': ' + appError.message
  })
  
  return appError
}

// 验证错误
export const createValidationError = (message) => {
  return new AppError(message, ErrorTypes.VALIDATION)
}

// API错误
export const createApiError = (message, originalError = null) => {
  return new AppError(message, ErrorTypes.API, originalError)
}

// 网络错误
export const createNetworkError = (message = '网络连接失败', originalError = null) => {
  return new AppError(message, ErrorTypes.NETWORK, originalError)
}

// 认证错误
export const createAuthError = (message = '认证失败', originalError = null) => {
  return new AppError(message, ErrorTypes.AUTH, originalError)
} 