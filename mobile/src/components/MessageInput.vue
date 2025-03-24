<template>
  <div class="message-input">
    <!-- 输入类型切换区域 -->
    <div class="input-types">
      <div 
        v-for="type in inputTypes" 
        :key="type.id"
        :class="['type-item', { 
          active: currentType === type.id,
          disabled: props.disabled 
        }]"
        @click="!props.disabled && switchType(type.id)"
      >
        <component :is="type.icon" />
        <span>{{ type.name }}</span>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <textarea
        ref="inputRef"
        v-model="inputText"
        :placeholder="placeholder"
        :disabled="props.disabled"
        :rows="1"
        @input="autoResize"
        @keydown.enter.prevent="handleEnter"
      ></textarea>
      <button 
        class="send-btn"
        :class="{ 
          active: inputText.trim() && !props.disabled,
          disabled: props.disabled
        }"
        :disabled="props.disabled || !inputText.trim()"
        @click="handleSend"
      >发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { NotesO, ChatO, QuestionO } from '@vant/icons'

// 输入类型定义
const inputTypes = [
  { id: 'note', name: '笔记', icon: NotesO },
  { id: 'chat', name: '聊天', icon: ChatO },
  { id: 'llm', name: 'LLM问答', icon: QuestionO }
]

// 响应式状态
const currentType = ref('note')
const inputText = ref('')
const inputRef = ref(null)

// 计算属性：根据类型显示不同的占位符
const placeholder = computed(() => {
  const placeholders = {
    note: '输入笔记内容...',
    chat: '输入聊天内容...',
    llm: '输入问题...'
  }
  return placeholders[currentType.value]
})

// 方法定义
const switchType = (type) => {
  currentType.value = type
}

const autoResize = () => {
  const textarea = inputRef.value
  if (!textarea) return
  
  // 重置高度
  textarea.style.height = 'auto'
  // 设置新高度
  const newHeight = Math.min(textarea.scrollHeight, 150) // 最大高度150px
  textarea.style.height = `${newHeight}px`
}

const handleEnter = (e) => {
  if (e.shiftKey) {
    // Shift+Enter 换行
    return
  }
  handleSend()
}

const handleSend = () => {
  if (!inputText.value.trim()) return
  
  // 发送消息
  const message = {
    type: currentType.value,
    content: inputText.value,
    timestamp: Date.now()
  }
  
  // 触发发送事件
  emit('send', message)
  
  // 清空输入
  inputText.value = ''
  // 重置输入框高度
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }
}

// 定义组件事件
const emit = defineEmits(['send'])

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped lang="scss">
.message-input {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 8px;
  border-top: 1px solid #eee;
  
  .input-types {
    display: flex;
    gap: 16px;
    margin-bottom: 8px;
    padding: 0 8px;
    
    .type-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 16px;
      font-size: 14px;
      color: #666;
      cursor: pointer;
      
      &.active {
        background: #f0f0f0;
        color: #333;
      }
      
      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      i {
        font-size: 16px;
      }
    }
  }
  
  .input-area {
    display: flex;
    gap: 8px;
    padding: 0 8px;
    
    textarea {
      flex: 1;
      min-height: 36px;
      max-height: 150px;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 18px;
      resize: none;
      outline: none;
      font-size: 14px;
      line-height: 1.5;
      
      &:focus {
        border-color: #007aff;
      }
    }
    
    .send-btn {
      width: 64px;
      border: none;
      border-radius: 18px;
      background: #eee;
      color: #999;
      font-size: 14px;
      cursor: pointer;
      
      &.active {
        background: #007aff;
        color: #fff;
      }
      
      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

// 适配底部安全区域
.message-input {
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
}
</style> 