export const API_BASE_URL = 'http://121.43.126.173/api'

export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

export const fetchWithConfig = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...API_HEADERS,
      ...options.headers
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

// 系统资源API
export const getSystemResources = () => fetchWithConfig('/system/resources')

// 系统状态API
export const getSystemStatus = () => fetchWithConfig('/health') 