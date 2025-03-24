<template>
  <div class="communication-test">
    <van-cell-group inset>
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

    <!-- 错误信息区域 -->
    <div class="error-info" v-if="error">
      <h3>错误信息</h3>
      <div class="error-card">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from 'vant'
import { useMessageStore } from '../stores/message'

const messageStore = useMessageStore()

// 状态变量
const testMessage = ref('')
const messageType = ref('chat')
const sending = ref(false)
const loading = ref(false)
const status = ref('pending')
const statusText = ref('等待测试')
const responseData = ref('')
const error = ref('')

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
  
  .response-data {
    margin-bottom: 20px;
    
    .data-card {
      padding: 12px;
      background-color: #fafafa;
      border-radius: 6px;
      overflow-x: auto;
      
      pre {
        margin: 0;
        font-family: monospace;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-all;
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
}
</style> 