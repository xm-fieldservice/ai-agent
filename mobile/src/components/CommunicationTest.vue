<template>
  <div class="communication-test">
    <h2>通信测试</h2>
    
    <!-- 环境测试部分 -->
    <div class="test-section">
      <h3>环境测试</h3>
      <div class="test-buttons">
        <button @click="testNodeVersion" :class="{ loading: loading.node }">
          测试Node版本
        </button>
        <button @click="testPackageManager" :class="{ loading: loading.pm }">
          测试包管理器
        </button>
        <button @click="testNetwork" :class="{ loading: loading.network }">
          测试网络环境
        </button>
        <button @click="testDatabaseConnection" :class="{ loading: loading.db }">
          测试数据库连接
        </button>
        <button @click="testResources" :class="{ loading: loading.resources }">
          测试系统资源
        </button>
      </div>
      
      <div class="test-results" v-if="envResults">
        <div class="result-item" v-if="envResults.node">
          <h4>Node.js版本:</h4>
          <p>版本: {{ envResults.node.version }}</p>
          <p>兼容性: {{ envResults.node.compatible ? '兼容' : '不兼容' }}</p>
          <p v-if="envResults.node.error" class="error-message">
            错误: {{ envResults.node.error }}
          </p>
        </div>
        
        <div class="result-item" v-if="envResults.pm">
          <h4>包管理器:</h4>
          <p>名称: {{ envResults.pm.name }}</p>
          <p>版本: {{ envResults.pm.version }}</p>
          <p v-if="envResults.pm.error" class="error-message">
            错误: {{ envResults.pm.error }}
          </p>
        </div>
        
        <div class="result-item" v-if="envResults.network">
          <h4>网络环境:</h4>
          <p>协议: {{ envResults.network.protocol }}</p>
          <p>CORS: {{ envResults.network.cors ? '已启用' : '未启用' }}</p>
          <p>安全性: {{ envResults.network.secure ? '安全' : '不安全' }}</p>
          <p v-if="envResults.network.error" class="error-message">
            错误: {{ envResults.network.error }}
          </p>
        </div>
        
        <div class="result-item" v-if="envResults.db">
          <h4>数据库状态:</h4>
          <p>类型: {{ envResults.db.type }}</p>
          <p>版本: {{ envResults.db.version }}</p>
          <p>连接: {{ envResults.db.connected ? '正常' : '异常' }}</p>
          <p v-if="envResults.db.error" class="error-message">
            错误: {{ envResults.db.error }}
          </p>
        </div>
        
        <div class="result-item" v-if="envResults.resources">
          <h4>系统资源:</h4>
          <p>CPU使用率: {{ envResults.resources.cpu }}%</p>
          <p>内存使用率: {{ envResults.resources.memory }}%</p>
          <p>磁盘使用率: {{ envResults.resources.disk }}%</p>
        </div>
      </div>
    </div>

    <van-cell-group inset>
      <!-- 环境检测部分 -->
      <van-cell title="环境检测">
        <template #right-icon>
          <van-button size="small" type="primary" @click="testEnvironment">
            开始检测
          </van-button>
        </template>
      </van-cell>
      
      <!-- 数据库测试部分 -->
      <van-cell title="数据库连接">
        <template #right-icon>
          <van-button size="small" type="primary" @click="testDatabase">
            测试连接
          </van-button>
        </template>
      </van-cell>
      
      <!-- PWA测试部分 -->
      <van-cell title="PWA功能">
        <template #right-icon>
          <van-button size="small" type="primary" @click="testPWA">
            检查PWA
          </van-button>
        </template>
      </van-cell>

      <!-- 测试消息发送 -->
      <van-field
        v-model="testMessage"
        label="测试消息"
        placeholder="输入测试消息"
        :autosize="{ minHeight: 60 }"
        type="textarea"
      />
      
      <!-- 消息类型选择 -->
      <van-radio-group v-model="messageType" direction="horizontal">
        <van-radio name="note">笔记</van-radio>
        <van-radio name="chat">聊天</van-radio>
        <van-radio name="llm">AI问答</van-radio>
      </van-radio-group>
      
      <!-- 测试选项 -->
      <van-cell-group>
        <van-cell title="测试类型">
          <template #right-icon>
            <van-dropdown-menu>
              <van-dropdown-item v-model="testType" :options="testTypeOptions" />
            </van-dropdown-menu>
          </template>
        </van-cell>
        
        <van-cell title="模拟错误">
          <template #right-icon>
            <van-switch v-model="simulateError" size="24" />
          </template>
        </van-cell>
        
        <van-cell title="模拟延迟(ms)">
          <template #right-icon>
            <van-stepper v-model="simulateDelay" step="500" min="0" max="5000" />
          </template>
        </van-cell>
      </van-cell-group>
      
      <!-- 测试按钮 -->
      <div class="button-group">
        <van-button 
          type="primary" 
          size="small" 
          :loading="sending"
          @click="testSendMessage"
        >
          发送测试消息
        </van-button>
        
        <van-button 
          type="info" 
          size="small" 
          :loading="loading"
          @click="testConnection"
        >
          测试连接
        </van-button>
        
        <van-button
          type="warning"
          size="small"
          :loading="streamTesting"
          @click="testStreamResponse"
        >
          测试流式响应
        </van-button>
      </div>
    </van-cell-group>
    
    <!-- 测试结果区域 -->
    <div class="test-result">
      <h3>测试结果</h3>
      <div class="status" :class="status">{{ statusText }}</div>
    </div>

    <!-- 响应数据区域 -->
    <div class="response-data" v-if="responseData">
      <h3>响应数据</h3>
      <div class="data-card">
        <pre>{{ formatJson(responseData) }}</pre>
      </div>
    </div>

    <!-- 流式响应区域 -->
    <div class="stream-response" v-if="streamContent">
      <h3>流式响应内容</h3>
      <div class="stream-card">
        <div class="content">{{ streamContent }}</div>
        <div class="progress" v-if="streamProgress">
          <van-progress :percentage="streamProgress" />
        </div>
      </div>
    </div>

    <!-- 错误信息区域 -->
    <div class="error-info" v-if="error">
      <h3>错误信息</h3>
      <div class="error-card">{{ error }}</div>
    </div>

    <!-- 测试结果展示区域 -->
    <div v-if="envTestResults.length > 0" class="test-section">
      <h3>环境测试结果</h3>
      <div class="env-results">
        <div v-for="(result, index) in envTestResults" :key="index" 
             :class="['result-item', result.status]">
          <span class="label">{{ result.label }}:</span>
          <span class="value">{{ result.value }}</span>
          <span class="status">{{ result.statusText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from 'vant'
import { useMessageStore } from '../stores/message'

// 服务器配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// 封装fetch请求
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    console.log('Fetching:', url) // 添加调试日志
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      mode: 'cors',  // 确保启用CORS
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    console.error('Fetch error:', error) // 添加错误日志
    throw error
  }
}

const messageStore = useMessageStore()

// 状态变量
const testMessage = ref('')
const messageType = ref('chat')
const sending = ref(false)
const loading = ref({
  node: false,
  pm: false,
  network: false,
  db: false,
  resources: false
})
const streamTesting = ref(false)
const status = ref('pending')
const statusText = ref('等待测试')
const responseData = ref('')
const error = ref('')
const streamContent = ref('')
const streamProgress = ref(0)

// 测试配置
const testType = ref('normal')
const simulateError = ref(false)
const simulateDelay = ref(0)

const testTypeOptions = [
  { text: '普通测试', value: 'normal' },
  { text: '并发测试', value: 'concurrent' },
  { text: '超时测试', value: 'timeout' },
  { text: '断网测试', value: 'offline' }
]

// 环境测试相关
const envTestResults = ref([])
const envResults = ref({})

// 格式化JSON数据
const formatJson = (data) => {
  try {
    return JSON.stringify(data, null, 2)
  } catch (err) {
    return data
  }
}

// 测试发送消息
const testSendMessage = async () => {
  if (!testMessage.value) {
    showToast('请输入测试消息')
    return
  }
  
  sending.value = true
  status.value = 'pending'
  statusText.value = '发送中...'
  error.value = ''
  
  try {
    // 模拟延迟
    if (simulateDelay.value > 0) {
      await new Promise(resolve => setTimeout(resolve, simulateDelay.value))
    }
    
    // 模拟错误
    if (simulateError.value) {
      throw new Error('模拟的错误情况')
    }
    
    // 并发测试
    if (testType.value === 'concurrent') {
      const promises = Array(3).fill().map(() => 
        messageStore.sendMessage({
          type: messageType.value,
          content: testMessage.value
        })
      )
      const responses = await Promise.all(promises)
      responseData.value = responses
      status.value = 'success'
      statusText.value = '并发发送成功'
      return
    }
    
    // 断网测试
    if (testType.value === 'offline') {
      // 模拟断网
      const originalOnline = navigator.onLine
      Object.defineProperty(navigator, 'onLine', { value: false })
      
      try {
        await messageStore.sendMessage({
          type: messageType.value,
          content: testMessage.value
        })
      } finally {
        // 恢复在线状态
        Object.defineProperty(navigator, 'onLine', { value: originalOnline })
      }
    }
    
    // 超时测试
    if (testType.value === 'timeout') {
      await messageStore.sendMessage({
        type: messageType.value,
        content: testMessage.value,
        timeout: 1000 // 1秒超时
      })
    }
    
    // 普通测试
    const response = await messageStore.sendMessage({
      type: messageType.value,
      content: testMessage.value
    })
    
    status.value = 'success'
    statusText.value = '发送成功'
    responseData.value = response
  } catch (err) {
    status.value = 'error'
    statusText.value = '发送失败'
    error.value = err.message
    showToast({
      type: 'fail',
      message: '发送失败：' + err.message
    })
  } finally {
    sending.value = false
  }
}

// 测试连接
const testConnection = async () => {
  loading.value = true
  status.value = 'pending'
  statusText.value = '测试中...'
  error.value = ''
  
  try {
    const response = await messageStore.testConnection()
    status.value = 'success'
    statusText.value = '连接正常'
    responseData.value = response
    showToast({
      type: 'success',
      message: '连接测试成功'
    })
  } catch (err) {
    status.value = 'error'
    statusText.value = '连接失败'
    error.value = err.message
    showToast({
      type: 'fail',
      message: '连接失败：' + err.message
    })
  } finally {
    loading.value = false
  }
}

// 测试流式响应
const testStreamResponse = async () => {
  streamTesting.value = true
  streamContent.value = ''
  streamProgress.value = 0
  status.value = 'pending'
  statusText.value = '测试流式响应中...'
  error.value = ''
  
  let retryCount = 0
  const maxRetries = 3
  
  const tryStreamResponse = async () => {
    try {
      await messageStore.testStreamResponse({
        onMessage: (text) => {
          streamContent.value += text
        },
        onProgress: (progress) => {
          streamProgress.value = progress
        },
        onError: (err) => {
          console.error('Stream error:', err)
          if (retryCount < maxRetries) {
            retryCount++
            console.log(`Retrying... (${retryCount}/${maxRetries})`)
            return tryStreamResponse()
          }
          throw err
        }
      })
      
      status.value = 'success'
      statusText.value = '流式响应完成'
    } catch (err) {
      if (retryCount < maxRetries) {
        retryCount++
        console.log(`Retrying... (${retryCount}/${maxRetries})`)
        return tryStreamResponse()
      }
      
      status.value = 'error'
      statusText.value = '流式响应失败'
      error.value = err.message
      showToast({
        type: 'fail',
        message: `流式响应失败 (重试${retryCount}次): ${err.message}`
      })
    }
  }
  
  try {
    await tryStreamResponse()
  } finally {
    streamTesting.value = false
  }
}

// 测试环境兼容性
const testEnvironment = async () => {
  envTestResults.value = []
  status.value = 'pending'
  
  // Node.js 版本检测
  try {
    const response = await fetch('http://localhost:8000/system/node-version')
    const nodeVersion = await response.json()
    envTestResults.value.push({
      label: 'Node.js版本',
      value: nodeVersion.version,
      status: nodeVersion.compatible ? 'success' : 'warning',
      statusText: nodeVersion.compatible ? '兼容' : '可能不兼容'
    })
  } catch (err) {
    envTestResults.value.push({
      label: 'Node.js版本',
      value: '检测失败',
      status: 'error',
      statusText: err.message
    })
  }
  
  // 包管理器检测
  try {
    const response = await fetch('http://localhost:8000/system/package-manager')
    const pkgManager = await response.json()
    envTestResults.value.push({
      label: '包管理器',
      value: pkgManager.name,
      status: 'success',
      statusText: '正常'
    })
  } catch (err) {
    envTestResults.value.push({
      label: '包管理器',
      value: '检测失败',
      status: 'error',
      statusText: err.message
    })
  }
  
  // 网络环境检测
  try {
    const response = await fetch('http://localhost:8000/system/network')
    const network = await response.json()
    envTestResults.value.push({
      label: '网络环境',
      value: `${network.protocol} | ${network.cors ? 'CORS已配置' : 'CORS未配置'}`,
      status: network.secure ? 'success' : 'warning',
      statusText: network.secure ? '安全' : '不安全'
    })
  } catch (err) {
    envTestResults.value.push({
      label: '网络环境',
      value: '检测失败',
      status: 'error',
      statusText: err.message
    })
  }
}

// 测试数据库连接
const testDatabase = async () => {
  try {
    const response = await fetch('http://localhost:8000/system/database')
    const dbStatus = await response.json()
    envTestResults.value = [{
      label: '数据库连接',
      value: `${dbStatus.type} | ${dbStatus.version}`,
      status: dbStatus.connected ? 'success' : 'error',
      statusText: dbStatus.connected ? '已连接' : '未连接'
    }]
  } catch (err) {
    envTestResults.value = [{
      label: '数据库连接',
      value: '检测失败',
      status: 'error',
      statusText: err.message
    }]
  }
}

// 测试PWA功能
const testPWA = async () => {
  envTestResults.value = []
  
  // Service Worker 检测
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      envTestResults.value.push({
        label: 'Service Worker',
        value: registration ? '已注册' : '未注册',
        status: registration ? 'success' : 'warning',
        statusText: registration ? '正常' : '需要注册'
      })
    } catch (err) {
      envTestResults.value.push({
        label: 'Service Worker',
        value: '检测失败',
        status: 'error',
        statusText: err.message
      })
    }
  }
  
  // 缓存存储检测
  try {
    const storage = await navigator.storage.estimate()
    envTestResults.value.push({
      label: '缓存存储',
      value: `${Math.round(storage.usage / 1024 / 1024)}MB / ${Math.round(storage.quota / 1024 / 1024)}MB`,
      status: 'success',
      statusText: '正常'
    })
  } catch (err) {
    envTestResults.value.push({
      label: '缓存存储',
      value: '检测失败',
      status: 'error',
      statusText: err.message
    })
  }
  
  // 推送API检测
  if ('Notification' in window) {
    envTestResults.value.push({
      label: '推送通知',
      value: Notification.permission,
      status: Notification.permission === 'granted' ? 'success' : 'warning',
      statusText: Notification.permission === 'granted' ? '已授权' : '未授权'
    })
  }
}

// 环境测试函数
const testNodeVersion = async () => {
  loading.value.node = true
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/system/node-version`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    envResults.value.node = data
    showToast({
      type: 'success',
      message: '检测成功'
    })
  } catch (error) {
    console.error('Node版本测试失败:', error)
    showToast({
      type: 'fail',
      message: error.name === 'AbortError' ? '请求超时' : `检测失败: ${error.message}`
    })
    envResults.value.node = {
      version: '未知',
      compatible: false,
      error: error.name === 'AbortError' ? '请求超时' : error.message
    }
  }
  loading.value.node = false
}

const testPackageManager = async () => {
  loading.value.pm = true
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/system/package-manager`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    envResults.value.pm = data
    showToast({
      type: 'success',
      message: '检测成功'
    })
  } catch (error) {
    console.error('包管理器测试失败:', error)
    showToast({
      type: 'fail',
      message: error.name === 'AbortError' ? '请求超时' : `检测失败: ${error.message}`
    })
    envResults.value.pm = {
      name: '未知',
      version: '0.0.0',
      error: error.name === 'AbortError' ? '请求超时' : error.message
    }
  }
  loading.value.pm = false
}

const testNetwork = async () => {
  loading.value.network = true
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/system/network`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    envResults.value.network = data
    showToast({
      type: 'success',
      message: '检测成功'
    })
  } catch (error) {
    console.error('网络环境测试失败:', error)
    showToast({
      type: 'fail',
      message: error.name === 'AbortError' ? '请求超时' : `检测失败: ${error.message}`
    })
    envResults.value.network = {
      protocol: 'unknown',
      cors: false,
      secure: false,
      error: error.name === 'AbortError' ? '请求超时' : error.message
    }
  }
  loading.value.network = false
}

const testDatabaseConnection = async () => {
  loading.value.db = true
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/system/database`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    envResults.value.db = data
    showToast({
      type: 'success',
      message: '检测成功'
    })
  } catch (error) {
    console.error('数据库测试失败:', error)
    showToast({
      type: 'fail',
      message: error.name === 'AbortError' ? '请求超时' : `检测失败: ${error.message}`
    })
    envResults.value.db = {
      type: '未知',
      version: '0.0',
      connected: false,
      error: error.name === 'AbortError' ? '请求超时' : error.message
    }
  }
  loading.value.db = false
}

async function testResources() {
  loading.value.resources = true
  try {
    const response = await fetch('http://localhost:8000/system/resources')
    envResults.value.resources = await response.json()
  } catch (error) {
    console.error('系统资源测试失败:', error)
  }
  loading.value.resources = false
}
</script>

<style scoped lang="scss">
.communication-test {
  padding: 16px;
  
  .van-cell-group {
    margin-bottom: 16px;
  }
  
  .van-radio-group {
    padding: 12px 16px;
    display: flex;
    justify-content: space-around;
  }
  
  .button-group {
    padding: 12px 16px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .test-result {
    margin-bottom: 20px;
    
    .status {
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      
      &.pending {
        background-color: #e6f7ff;
        color: #1890ff;
      }
      
      &.success {
        background-color: #f6ffed;
        color: #52c41a;
      }
      
      &.error {
        background-color: #fff2f0;
        color: #ff4d4f;
      }
    }
  }
  
  .response-data,
  .stream-response {
    margin-bottom: 20px;
    
    .data-card,
    .stream-card {
      padding: 12px;
      background-color: #fafafa;
      border-radius: 6px;
      overflow-x: auto;
      
      pre,
      .content {
        margin: 0;
        font-family: monospace;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-all;
      }
      
      .progress {
        margin-top: 12px;
      }
    }
  }
  
  .error-info {
    .error-card {
      padding: 12px;
      background-color: #fff2f0;
      border: 1px solid #ffccc7;
      border-radius: 6px;
      color: #ff4d4f;
      font-size: 14px;
    }
  }
  
  .error-message {
    color: #ff4d4f;
    margin-top: 8px;
    font-size: 14px;
  }
  
  .test-buttons {
    button {
      &.loading {
        opacity: 0.7;
        cursor: not-allowed;
        
        &::after {
          content: '...';
          display: inline-block;
          animation: loading-dots 1s infinite;
        }
      }
    }
  }
}

@keyframes loading-dots {
  0% { content: '.'; }
  33% { content: '..'; }
  66% { content: '...'; }
}

.test-section {
  margin-top: 20px;
  padding: 16px;
  
  h3 {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 500;
  }
}

.env-results {
  .result-item {
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    
    &.success {
      background-color: #f6ffed;
      border: 1px solid #b7eb8f;
    }
    
    &.warning {
      background-color: #fffbe6;
      border: 1px solid #ffe58f;
    }
    
    &.error {
      background-color: #fff2f0;
      border: 1px solid #ffccc7;
    }
    
    .label {
      font-weight: 500;
      margin-right: 8px;
    }
    
    .value {
      flex: 1;
      color: #666;
    }
    
    .status {
      padding: 2px 8px;
      border-radius: 2px;
      font-size: 12px;
      
      .success & {
        background-color: #f6ffed;
        color: #52c41a;
      }
      
      .warning & {
        background-color: #fffbe6;
        color: #faad14;
      }
      
      .error & {
        background-color: #fff2f0;
        color: #ff4d4f;
      }
    }
  }
}
</style> 