<template>
  <div class="toolbar">
    <div class="input-area">
      <van-field
        v-model="message"
        type="textarea"
        placeholder="输入消息..."
        rows="1"
        autosize
        @keypress.enter.prevent="handleSend"
      />
    </div>
    <div class="action-area">
      <van-button 
        :loading="loading"
        type="primary" 
        size="small"
        round
        @click="handleSend"
      >
        发送
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Field, Button } from 'vant'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['send'])

const message = ref('')

const handleSend = () => {
  if (!message.value.trim() || props.loading) return
  
  emit('send', message.value)
  message.value = ''
}
</script>

<style lang="scss" scoped>
.toolbar {
  padding: 8px 16px;
  background-color: #f7f8fa;
  border-top: 1px solid #ebedf0;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  
  .input-area {
    flex: 1;
    
    :deep(.van-field) {
      background-color: #fff;
      border-radius: 4px;
      padding: 4px 8px;
      
      .van-field__control {
        min-height: 20px;
        max-height: 100px;
      }
    }
  }
  
  .action-area {
    flex-shrink: 0;
    padding-bottom: 4px;
  }
}
</style> 