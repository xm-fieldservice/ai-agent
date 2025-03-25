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
        
        <button 
          class="send-button"
          :disabled="!canSend"
          @click="sendMessage"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import type { Ref } from 'vue';

// 输入类型定义
export enum InputType {
  TEXT = 'text',
  NOTE = 'note',
  CHAT = 'chat',
  LLM = 'llm'
}

// 输入动作定义
export interface InputAction {
  id: string;
  label: string;
  icon?: string;
  iconComponent?: any;
  type?: InputType;
  handler?: () => void;
}

// Props 定义
const props = withDefaults(defineProps<{
  type?: InputType;
  expanded?: boolean;
  placeholder?: string;
  actions?: InputAction[];
  maxLength?: number;
  minExpandedHeight?: number;
  maxExpandedHeight?: number;
}>(), {
  type: InputType.TEXT,
  expanded: false,
  placeholder: '输入内容...',
  actions: () => [],
  maxLength: 2000,
  minExpandedHeight: 100,
  maxExpandedHeight: 200
});

// Emits 定义
const emit = defineEmits<{
  (e: 'expand', expanded: boolean): void;
  (e: 'input', text: string): void;
  (e: 'send', text: string, type: InputType): void;
  (e: 'typeChange', type: InputType): void;
  (e: 'action', actionId: string): void;
}>();

// 内部状态
const isExpanded = ref(props.expanded);
const inputText = ref('');
const textareaRef: Ref<HTMLTextAreaElement | null> = ref(null);
const currentType = ref(props.type);

// 计算属性
const canSend = computed(() => inputText.value.trim().length > 0);

const currentTypeLabel = computed(() => {
  switch (currentType.value) {
    case InputType.NOTE:
      return '笔记';
    case InputType.CHAT:
      return '聊天';
    case InputType.LLM:
      return 'LLM问答';
    default:
      return '对话';
  }
});

const inputActions = computed(() => {
  // 筛选当前类型可用的动作
  return props.actions.filter(action => 
    !action.type || action.type === currentType.value
  );
});

// 方法
function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  emit('expand', isExpanded.value);
  
  if (isExpanded.value) {
    nextTick(() => {
      textareaRef.value?.focus();
    });
  }
}

function onInput(event: Event) {
  const textarea = event.target as HTMLTextAreaElement;
  autoResizeTextarea(textarea);
  emit('input', inputText.value);
}

function autoResizeTextarea(textarea: HTMLTextAreaElement) {
  // 重置高度以正确计算
  textarea.style.height = 'auto';
  
  // 获取内容高度
  const scrollHeight = textarea.scrollHeight;
  
  // 应用高度限制
  const newHeight = Math.max(
    props.minExpandedHeight,
    Math.min(props.maxExpandedHeight, scrollHeight)
  );
  
  textarea.style.height = `${newHeight}px`;
}

function onEnterPress(event: KeyboardEvent) {
  if (event.shiftKey) {
    // Shift+Enter插入换行
    const textarea = textareaRef.value;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // 插入换行
      inputText.value = 
        inputText.value.substring(0, start) + 
        '\n' + 
        inputText.value.substring(end);
      
      // 设置光标位置
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      });
    }
  } else if (canSend.value) {
    // 普通Enter发送消息
    sendMessage();
  }
}

function sendMessage() {
  if (!canSend.value) return;
  
  const text = inputText.value.trim();
  emit('send', text, currentType.value);
  
  // 清空输入
  inputText.value = '';
  
  // 重置文本框高度
  if (textareaRef.value) {
    textareaRef.value.style.height = `${props.minExpandedHeight}px`;
  }
  
  // 保持焦点
  nextTick(() => {
    textareaRef.value?.focus();
  });
}

function onActionClick(action: InputAction) {
  // 如果动作有处理函数，调用它
  if (action.handler) {
    action.handler();
  }
  
  // 发出事件
  emit('action', action.id);
}

function setInputType(type: InputType) {
  currentType.value = type;
  emit('typeChange', type);
}

// 监听props变化
watch(() => props.expanded, (newVal) => {
  isExpanded.value = newVal;
});

watch(() => props.type, (newVal) => {
  currentType.value = newVal;
});

// 暴露方法给父组件
defineExpose({
  toggleExpand,
  setInputType,
  focusInput: () => textareaRef.value?.focus(),
  clearInput: () => {
    inputText.value = '';
    if (textareaRef.value) {
      textareaRef.value.style.height = `${props.minExpandedHeight}px`;
    }
  }
});

// 生命周期钩子
onMounted(() => {
  if (isExpanded.value && textareaRef.value) {
    textareaRef.value.focus();
  }
});
</script>

<style lang="scss" scoped>
.collapsible-input-box {
  width: 100%;
  background-color: #fff;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  position: relative;
  
  &.collapsed {
    border-bottom: 1px solid #e0e0e0;
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
}

.current-type {
  font-weight: 500;
  color: #333;
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
  transition: transform 0.3s ease;
}

.input-content {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  
  &:focus {
    outline: none;
    border-color: #4285f4;
  }
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
  
  &:hover {
    background-color: #f1f3f4;
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
  
  &:hover {
    background-color: #3367d6;
  }
  
  &:disabled {
    background-color: #9aa0a6;
    cursor: not-allowed;
  }
}
</style> 