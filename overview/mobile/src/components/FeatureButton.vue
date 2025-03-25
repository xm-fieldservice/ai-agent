<template>
  <div 
    class="feature-button" 
    :class="{ 'active': active }"
    @click="handleClick"
  >
    <div class="button-icon">
      <img v-if="iconUrl" :src="iconUrl" :alt="label" class="icon-image" />
      <component v-else-if="iconComponent" :is="iconComponent" class="icon-component" />
      <div v-else class="icon-placeholder">
        <template v-if="type === 'notes'">📝</template>
        <template v-else-if="type === 'chat'">💬</template>
        <template v-else-if="type === 'llm'">🤖</template>
        <template v-else>📱</template>
      </div>
    </div>
    <div class="button-label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

// 组件属性
const props = defineProps<{
  // 功能类型，用于确定默认图标
  type: string;
  // 按钮文本
  label: string;
  // 图标URL，如有则优先使用
  iconUrl?: string;
  // 图标组件，如有则其次使用
  iconComponent?: any;
  // 是否激活状态
  active?: boolean;
  // 点击处理函数，可选
  onClick?: Function;
}>();

// 事件
const emit = defineEmits<{
  (e: 'click', type: string): void;
}>();

// 处理点击事件
function handleClick() {
  // 如果提供了onClick函数，则调用
  if (props.onClick) {
    props.onClick(props.type);
  }
  
  // 发出点击事件
  emit('click', props.type);
}
</script>

<style scoped>
.feature-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-width: 64px;
  user-select: none;
}

.feature-button:hover {
  background-color: #f0f0f0;
}

.feature-button.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.button-icon {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 4px;
}

.icon-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.icon-component {
  width: 100%;
  height: 100%;
}

.icon-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
}

.button-label {
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@media (max-width: 360px) {
  .feature-button {
    min-width: 56px;
  }
  
  .button-icon {
    width: 28px;
    height: 28px;
  }
  
  .icon-placeholder {
    font-size: 20px;
  }
  
  .button-label {
    font-size: 11px;
  }
}
</style> 