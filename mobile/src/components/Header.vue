<template>
  <div class="header safe-area-top">
    <van-nav-bar
      :title="currentModel.name"
      left-arrow
      @click-left="toggleMenu"
    >
      <template #right>
        <van-icon name="exchange" size="18" @click="showModelSelect = true" />
        <van-icon name="phone-o" size="18" class="ml-4" @click="togglePhone" />
      </template>
    </van-nav-bar>

    <van-popup
      v-model:show="showModelSelect"
      position="bottom"
      round
      closeable
    >
      <div class="model-select">
        <div class="title">选择模型</div>
        <van-cell-group>
          <van-cell
            v-for="model in models"
            :key="model.id"
            :title="model.name"
            clickable
            @click="selectModel(model)"
          />
        </van-cell-group>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useModelStore } from '../stores/model'

const modelStore = useModelStore()
const showModelSelect = ref(false)
const { currentModel, models } = modelStore

const emit = defineEmits(['toggle-menu', 'toggle-phone'])

const toggleMenu = () => {
  emit('toggle-menu')
}

const togglePhone = () => {
  emit('toggle-phone')
}

const selectModel = (model) => {
  modelStore.setCurrentModel(model)
  showModelSelect.value = false
}
</script>

<style lang="scss" scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: #fff;
}

.ml-4 {
  margin-left: 16px;
}

.model-select {
  padding: 16px 0;
  
  .title {
    margin: 0 16px 16px;
    font-size: 16px;
    font-weight: 600;
  }
}
</style> 