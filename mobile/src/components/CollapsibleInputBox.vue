<template>
  <div 
    class="collapsible-input-box" 
    :class="{ 'expanded': isExpanded, 'collapsed': !isExpanded }"
  >
    <div class="input-header" @click="toggleExpand">
      <div class="current-type">{{ currentTypeLabel }}</div>
      <div class="toggle-button">
        <svg 
          class="toggle-icon" 
          viewBox="0 0 24 24" 
          :style="{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }"
        >
          <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
        </svg>
      </div>
    </div>

    <transition
      name="expand"
      @enter="startExpandTransition"
      @leave="startCollapseTransition"
    >
      <div class="input-content" v-show="isExpanded">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          :placeholder="placeholder"
          class="input-textarea"
          @input="onInput"
          @keydown.enter.prevent="onEnterPress"
        ></textarea>
        
        <div class="input-actions">
          <transition-group name="fade" tag="div" class="action-buttons">
            <button 
              v-for="action in inputActions" 
              :key="action.id"
              class="action-button"
              @click="onActionClick(action)"
            >
              <component v-if="action.iconComponent" :is="action.iconComponent" />
              <span v-else-if="action.icon" class="action-icon">
                <img :src="action.icon" :alt="action.label">
              </span>
              <span v-else class="action-label">{{ action.label }}</span>
            </button>
          </transition-group>
          
          <button 
            class="send-button"
            :disabled="!canSend"
            @click="sendMessage"
          >
            发送
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

interface ActionButton {
  icon: string
  tooltip?: string
}

const props = defineProps<{
  type?: string
  expanded?: boolean
  placeholder?: string
  actionButtons?: ActionButton[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'expand'): void
  (e: 'collapse'): void
  (e: 'send', text: string): void
  (e: 'action-click', action: ActionButton): void
}>()

const isExpanded = ref(props.expanded || false)
const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// 计算属性
const inputTypeLabel = computed(() => {
  switch (props.type) {
    case 'chat':
      return '聊天输入'
    case 'note':
      return '笔记输入'
    case 'llm':
      return 'AI 输入'
    default:
      return '文本输入'
  }
})

const canSend = computed(() => {
  return inputText.value.trim().length > 0
})

// 方法
function toggleExpand() {
  if (props.disabled) return
  
  if (isExpanded.value) {
    collapse()
  } else {
    expand()
  }
}

function expand() {
  if (props.disabled) return
  
  isExpanded.value = true
  emit('expand')
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus()
    }
  })
}

function collapse() {
  isExpanded.value = false
  emit('collapse')
}

function handleInput(event: Event) {
  const textarea = event.target as HTMLTextAreaElement
  
  // 自动调整高度
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

function handleEnter(event: KeyboardEvent) {
  if (event.shiftKey) {
    // Shift + Enter 允许换行
    return
  }
  
  handleSend()
}

function handleSend() {
  if (!canSend.value || props.disabled) return
  
  const text = inputText.value.trim()
  emit('send', text)
  
  // 清空输入
  inputText.value = ''
  
  // 重置高度
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

function handleActionClick(action: ActionButton) {
  if (props.disabled) return
  emit('action-click', action)
}

// 重置输入框
function reset() {
  inputText.value = ''
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

// 监听展开状态变化
watch(() => props.expanded, (newValue) => {
  isExpanded.value = newValue || false
})

// 展开过渡
function startExpandTransition(el: Element, done: () => void) {
  const element = el as HTMLElement;
  element.style.height = '0';
  element.style.opacity = '0';
  
  requestAnimationFrame(() => {
    element.style.height = `${element.scrollHeight}px`;
    element.style.opacity = '1';
    
    element.addEventListener('transitionend', function handler() {
      element.style.height = 'auto';
      element.removeEventListener('transitionend', handler);
      done();
    });
  });
}

// 收起过渡
function startCollapseTransition(el: Element, done: () => void) {
  const element = el as HTMLElement;
  element.style.height = `${element.scrollHeight}px`;
  element.style.opacity = '1';
  
  requestAnimationFrame(() => {
    element.style.height = '0';
    element.style.opacity = '0';
    
    element.addEventListener('transitionend', function handler() {
      element.removeEventListener('transitionend', handler);
      done();
    });
  });
}

// 暴露方法给父组件
defineExpose({
  reset,
  expand,
  collapse
})
</script>

<style lang="scss" scoped>
.collapsible-input-box {
  width: 100%;
  background-color: #fff;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  
  &.collapsed {
    border-bottom: 1px solid #e0e0e0;
  }
  
  &.expanded {
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  }
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  &:active {
    background-color: #f1f3f4;
  }
}

.current-type {
  font-weight: 500;
  color: #333;
  transition: color 0.2s ease;
}

.toggle-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-icon {
  width: 24px;
  height: 24px;
  fill: #666;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-content {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.input-textarea {
  width: 100%;
  min-height: v-bind('props.minExpandedHeight + "px"');
  max-height: v-bind('props.maxExpandedHeight + "px"');
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  resize: none;
  font-family: inherit;
  font-size: 16px;
  line-height: 1.5;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.1);
  }
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.action-button {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f1f3f4;
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  .action-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    img {
      max-width: 100%;
      max-height: 100%;
      transition: transform 0.2s ease;
    }
  }
  
  .action-label {
    font-size: 14px;
  }
}

.send-button {
  margin-left: auto;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 16px;
  padding: 8px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #3367d6;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: none;
  }
  
  &:disabled {
    background-color: #9aa0a6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

// 展开/收起过渡
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

// 动作按钮过渡
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.fade-move {
  transition: transform 0.2s ease;
}
</style> 