<template>
  <div class="feature-panel" :class="{'expanded': expanded}">
    <!-- 面板头部 - 可点击展开/收起 -->
    <div class="panel-header" @click="togglePanel">
      <div class="panel-title">功能面板</div>
      <div class="panel-toggle">{{ expanded ? '收起' : '展开' }}</div>
    </div>
    
    <!-- 面板内容 -->
    <div class="panel-content" v-if="expanded">
      <!-- 功能列表 -->
      <div class="feature-list">
        <div
          v-for="feature in availableFeatures"
          :key="feature.id"
          class="feature-item"
          :class="{'active': selectedFeatureId === feature.id}"
          @click="selectFeature(feature)"
        >
          <div class="feature-icon">{{ getFeatureIcon(feature) }}</div>
          <div class="feature-info">
            <div class="feature-name">{{ feature.name }}</div>
            <div class="feature-desc" v-if="feature.description">{{ feature.description }}</div>
          </div>
        </div>
      </div>
      
      <!-- 消息输入区域 -->
      <div class="input-area" :class="{'expanded': inputState !== 'normal'}">
        <textarea 
          ref="inputRef"
          v-model="userInput" 
          class="input-field" 
          :placeholder="getPlaceholder()"
          @keydown.enter.prevent="handleEnterKey"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
        ></textarea>
        
        <div class="input-actions">
          <button 
            class="action-button expand-button" 
            @click="toggleInputExpand" 
            :title="inputState === 'expanded' ? '收起' : '展开'"
          >
            {{ inputState === 'expanded' ? '⬇' : '⬆' }}
          </button>
          <button 
            class="action-button send-button" 
            @click="sendMessage" 
            :disabled="!userInput.trim()"
            title="发送"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';

// 组件属性
const props = defineProps<{
  // 预定义的功能列表
  predefinedFeatures: any[];
  // 初始是否展开
  initialExpanded?: boolean;
}>();

// 向父组件发送的事件
const emit = defineEmits<{
  (event: 'feature-selected', feature: any): void;
  (event: 'message-sent', message: string, type: string): void;
  (event: 'expanded-changed', expanded: boolean): void;
  (event: 'input-state-changed', state: 'normal' | 'expanded' | 'fullscreen'): void;
}>();

// 组件状态
const expanded = ref(props.initialExpanded !== undefined ? props.initialExpanded : true);
const selectedFeatureId = ref('');
const userInput = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);
const inputState = ref<'normal' | 'expanded' | 'fullscreen'>('normal');

// 计算属性：当前可用的功能列表
const availableFeatures = computed(() => {
  return props.predefinedFeatures.filter(feature => !feature.disabled);
});

// 选择功能
function selectFeature(feature: any) {
  selectedFeatureId.value = feature.id;
  emit('feature-selected', feature);
  
  // 聚焦输入框
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  });
}

// 获取功能图标
function getFeatureIcon(feature: any): string {
  if (feature.icon) {
    return feature.icon;
  }
  
  // 默认图标
  switch (feature.type) {
    case 'notes':
      return '📝';
    case 'chat':
      return '💬';
    case 'llm':
      return '🤖';
    default:
      return '📌';
  }
}

// 切换面板展开/收起状态
function togglePanel() {
  expanded.value = !expanded.value;
  emit('expanded-changed', expanded.value);
}

// 获取输入框占位符
function getPlaceholder(): string {
  if (!selectedFeatureId.value) {
    return '请先选择功能...';
  }
  
  const selectedFeature = props.predefinedFeatures.find(f => f.id === selectedFeatureId.value);
  if (!selectedFeature) {
    return '输入内容...';
  }
  
  switch (selectedFeature.type) {
    case 'notes':
      return '输入要记录的笔记...';
    case 'chat':
      return '输入聊天内容...';
    case 'llm':
      return '向AI助手提问...';
    default:
      return '输入内容...';
  }
}

// 切换输入框展开/收起状态
function toggleInputExpand() {
  if (inputState.value === 'normal') {
    inputState.value = 'expanded';
  } else if (inputState.value === 'expanded') {
    inputState.value = 'normal';
  }
  
  emit('input-state-changed', inputState.value);
}

// 处理输入框获得焦点
function handleInputFocus() {
  // 如果需要，可以在这里添加更多逻辑
}

// 处理输入框失去焦点
function handleInputBlur() {
  // 如果需要，可以在这里添加更多逻辑
}

// 处理回车键
function handleEnterKey(event: KeyboardEvent) {
  if (event.shiftKey) {
    // Shift+Enter 换行，不发送
    return;
  }
  
  // Enter 键发送消息
  sendMessage();
}

// 发送消息
function sendMessage() {
  const message = userInput.value.trim();
  if (!message || !selectedFeatureId.value) {
    return;
  }
  
  const selectedFeature = props.predefinedFeatures.find(f => f.id === selectedFeatureId.value);
  if (!selectedFeature) {
    return;
  }
  
  // 发送消息到父组件
  emit('message-sent', message, selectedFeature.type);
  
  // 清空输入框
  userInput.value = '';
  
  // 如果输入框是展开状态，收起它
  if (inputState.value === 'expanded') {
    inputState.value = 'normal';
    emit('input-state-changed', inputState.value);
  }
}

// 监听功能列表变化，自动选择第一个功能
watch(
  () => props.predefinedFeatures,
  (newFeatures) => {
    if (newFeatures.length > 0 && !selectedFeatureId.value) {
      selectFeature(newFeatures[0]);
    }
  },
  { immediate: true }
);

// 组件挂载后自动展开面板
onMounted(() => {
  // 延迟1秒后自动展开面板（如果初始状态未指定）
  if (props.initialExpanded === undefined) {
    setTimeout(() => {
      expanded.value = true;
      emit('expanded-changed', true);
    }, 1000);
  }
  
  // 如果有功能列表，自动选择第一个功能
  if (availableFeatures.value.length > 0 && !selectedFeatureId.value) {
    selectFeature(availableFeatures.value[0]);
  }
});
</script>

<style scoped>
.feature-panel {
  position: fixed;
  bottom: 64px;
  left: 0;
  right: 0;
  background-color: white;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  transition: max-height 0.3s ease;
}

.feature-panel.expanded {
  overflow: hidden;
}

.feature-panel:not(.expanded) {
  max-height: 50px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
}

.panel-title {
  font-weight: 500;
  font-size: 16px;
}

.panel-toggle {
  color: #007bff;
  font-size: 14px;
}

.panel-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
}

.feature-list {
  display: flex;
  padding: 8px 12px;
  gap: 8px;
  overflow-x: auto;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: #f5f5f5;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.feature-item:hover {
  background-color: #e9ecef;
}

.feature-item.active {
  background-color: #e9f5ff;
  border: 1px solid #b8daff;
}

.feature-icon {
  font-size: 18px;
  margin-right: 8px;
}

.feature-name {
  font-weight: 500;
  font-size: 14px;
}

.feature-desc {
  font-size: 12px;
  color: #6c757d;
  margin-top: 2px;
}

.input-area {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  transition: height 0.3s ease;
}

.input-area.expanded {
  height: 150px;
}

.input-field {
  width: 100%;
  min-height: 40px;
  max-height: 120px;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 16px;
  resize: none;
  outline: none;
  transition: min-height 0.3s ease;
  margin-bottom: 8px;
}

.input-area.expanded .input-field {
  min-height: 100px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.action-button {
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  outline: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-button {
  background-color: #f0f0f0;
  color: #333;
}

.send-button {
  background-color: #007bff;
  color: white;
}

.send-button:disabled {
  background-color: #b0d0ff;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .feature-panel {
    max-height: 80vh;
  }
  
  .input-area.expanded {
    height: 120px;
  }
  
  .input-area.expanded .input-field {
    min-height: 80px;
  }
}
</style> 