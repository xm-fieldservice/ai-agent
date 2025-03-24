import { defineStore } from 'pinia'

export const useModelStore = defineStore('model', {
  state: () => ({
    currentModel: {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5'
    },
    models: [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5'
      },
      {
        id: 'deepseek',
        name: 'DeepSeek'
      }
    ]
  }),
  
  actions: {
    setCurrentModel(model) {
      this.currentModel = model
    }
  }
}) 