<template>
  <div class="chat-view">
    <div class="feature-container">
      <FeatureSelector
        :initial-features="availableFeatures"
        @select="handleFeatureSelect"
        @features-loaded="handleFeaturesLoaded"
      />
    </div>
    
    <div class="chat-content">
      <!-- 聊天内容区域 -->
      <div v-if="selectedFeature" class="feature-content">
        <div class="placeholder-content">
          {{ selectedFeature.name }} 内容区域
        </div>
      </div>
      <div v-else class="placeholder-content">
        请选择功能
      </div>
    </div>
    
    <div class="input-container">
      <CollapsibleInputBox
        ref="inputBoxRef"
        :type="currentInputType"
        :placeholder="getPlaceholderForType(currentInputType)"
        :actions="inputActions"
        @send="handleSendMessage"
        @type-change="handleTypeChange"
        @action="handleInputAction"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import FeatureSelector from '../components/FeatureSelector.vue';
import CollapsibleInputBox, { InputType, type InputAction } from '../components/CollapsibleInputBox.vue';

// 模拟Feature类型
interface Feature {
  id: string;
  name: string;
  type: string;
  icon?: string;
  [key: string]: any;
}

// 状态
const selectedFeature = ref<Feature | null>(null);
const availableFeatures = ref<Feature[]>([]);
const currentInputType = ref(InputType.TEXT);
const inputBoxRef = ref<InstanceType<typeof CollapsibleInputBox> | null>(null);

// 输入操作
const inputActions = ref<InputAction[]>([
  {
    id: 'attach',
    label: '附件',
    icon: '/icons/attach-icon.svg'
  },
  {
    id: 'voice',
    label: '语音',
    icon: '/icons/voice-icon.svg'
  }
]);

// 计算属性
const getPlaceholderForType = (type: InputType) => {
  switch (type) {
    case InputType.NOTE:
      return '写笔记...';
    case InputType.CHAT:
      return '发送消息...';
    case InputType.LLM:
      return '提问问题...';
    default:
      return '输入内容...';
  }
};

// 方法
const handleFeatureSelect = (feature: Feature) => {
  selectedFeature.value = feature;
  
  // 根据功能类型设置输入类型
  switch (feature.id) {
    case 'note':
      setInputType(InputType.NOTE);
      break;
    case 'chat':
      setInputType(InputType.CHAT);
      break;
    case 'llm':
      setInputType(InputType.LLM);
      break;
    default:
      setInputType(InputType.TEXT);
  }
};

const handleFeaturesLoaded = (features: Feature[]) => {
  availableFeatures.value = features;
  
  // 默认选择第一个功能
  if (features.length > 0 && !selectedFeature.value) {
    handleFeatureSelect(features[0]);
  }
};

const handleSendMessage = (text: string, type: InputType) => {
  console.log(`发送${type}消息:`, text);
  
  // 这里应处理消息发送逻辑
  // 实际应用中应通过API发送到对应服务
};

const handleTypeChange = (type: InputType) => {
  currentInputType.value = type;
};

const handleInputAction = (actionId: string) => {
  console.log('输入操作:', actionId);
  
  // 处理不同的操作
  switch (actionId) {
    case 'attach':
      // 处理附件操作
      break;
    case 'voice':
      // 处理语音操作
      break;
  }
};

const setInputType = (type: InputType) => {
  currentInputType.value = type;
  inputBoxRef.value?.setInputType(type);
};

// 生命周期钩子
onMounted(() => {
  // 实际应用中，这里应从Overview模块获取功能列表
  // 这里模拟已经在FeatureSelector中实现
});
</script>

<style lang="scss" scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  position: relative;
  background-color: #f5f5f5;
}

.feature-container {
  padding: 16px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
  z-index: 2;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.feature-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  color: #757575;
  font-size: 16px;
  text-align: center;
  padding: 32px;
  background-color: white;
  border-radius: 8px;
  margin: 16px 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.input-container {
  position: sticky;
  bottom: 0;
  width: 100%;
  z-index: 3;
}
</style> 