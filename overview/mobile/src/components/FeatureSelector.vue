<template>
  <div class="feature-selector">
    <div class="feature-list">
      <div 
        v-for="feature in features" 
        :key="feature.id"
        class="feature-item"
        :class="{ 'active': activeFeatureId === feature.id }"
        @click="selectFeature(feature)"
      >
        <div class="feature-icon">
          <component 
            v-if="feature.iconComponent" 
            :is="feature.iconComponent" 
          />
          <img 
            v-else-if="feature.icon" 
            :src="feature.icon" 
            :alt="feature.name"
          />
          <div v-else class="icon-placeholder">{{ feature.name.charAt(0) }}</div>
        </div>
        <div class="feature-name">{{ feature.id }}. {{ feature.name }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';

// 从Overview模块导入类型和API
// 实际使用时，需要通过正确的路径导入
interface Feature {
  id: string;
  name: string;
  icon?: string;
  iconComponent?: any;
  description?: string;
  order?: number;
  disabled?: boolean;
  [key: string]: any;
}

// Props定义
const props = withDefaults(defineProps<{
  initialFeatures?: Feature[];
  defaultActiveId?: string;
}>(), {
  initialFeatures: () => [],
  defaultActiveId: ''
});

// Emits定义
const emit = defineEmits<{
  (e: 'select', feature: Feature): void;
  (e: 'featuresLoaded', features: Feature[]): void;
}>();

// 状态
const features: Ref<Feature[]> = ref([...props.initialFeatures]);
const activeFeatureId = ref(props.defaultActiveId || '');

// 从overview模块加载功能
// 实际使用时，通过正确方式引入featuresApi
async function loadFeatures() {
  try {
    // 模拟从Overview模块获取功能
    // 实际应用中应通过API获取
    const loadedFeatures = [
      { 
        id: 'note', 
        name: '笔记',
        icon: '/icons/note-icon.svg',
        order: 1
      },
      { 
        id: 'chat', 
        name: '聊天',
        icon: '/icons/chat-icon.svg',
        order: 2
      },
      { 
        id: 'llm', 
        name: 'LLM问答',
        icon: '/icons/llm-icon.svg',
        order: 3
      }
    ];
    
    // 更新状态
    features.value = loadedFeatures;
    
    // 如果未设置激活功能，默认选择第一个
    if (!activeFeatureId.value && features.value.length > 0) {
      activeFeatureId.value = features.value[0].id;
    }
    
    emit('featuresLoaded', features.value);
  } catch (error) {
    console.error('加载功能失败:', error);
  }
}

// 选择功能
function selectFeature(feature: Feature) {
  if (feature.disabled) return;
  
  activeFeatureId.value = feature.id;
  emit('select', feature);
}

// 生命周期钩子
onMounted(async () => {
  if (features.value.length === 0) {
    await loadFeatures();
  }
});

// 未来可能需要的清理逻辑
onUnmounted(() => {
  // 清理逻辑
});
</script>

<style lang="scss" scoped>
.feature-selector {
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e8eaed;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  
  &:hover {
    background-color: #f1f3f4;
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &.active {
    background-color: #e8f0fe;
    color: #1a73e8;
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.feature-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    max-width: 100%;
    max-height: 100%;
  }
  
  .icon-placeholder {
    width: 100%;
    height: 100%;
    background-color: #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-weight: bold;
    color: #555;
  }
}

.feature-name {
  font-size: 16px;
  font-weight: 500;
}
</style> 