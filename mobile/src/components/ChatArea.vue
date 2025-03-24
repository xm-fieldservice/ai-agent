<template>
  <div class="chat-area" ref="chatContainer">
    <div 
      v-for="(message, index) in messages" 
      :key="index"
      class="message"
      :class="message.role"
    >
      <div class="content markdown-body" v-html="renderMessage(message.content)" />
    </div>
    
    <div v-if="loading" class="loading">
      <van-loading type="spinner" size="24px">思考中...</van-loading>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Loading } from 'vant'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const chatContainer = ref(null)
const md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (__) {}
    }
    return ''
  }
})

const renderMessage = (content) => {
  return md.render(content)
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    const container = chatContainer.value
    container.scrollTop = container.scrollHeight
  }
}

watch(() => props.messages, () => {
  setTimeout(scrollToBottom, 100)
}, { deep: true })

onMounted(() => {
  scrollToBottom()
})
</script>

<style lang="scss" scoped>
.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;

  .message {
    margin-bottom: 16px;
    max-width: 85%;
    
    &.user {
      margin-left: auto;
      .content {
        background-color: #95ec69;
        border-radius: 16px 4px 16px 16px;
      }
    }
    
    &.assistant {
      margin-right: auto;
      .content {
        background-color: #fff;
        border-radius: 4px 16px 16px 16px;
      }
    }

    .content {
      padding: 12px;
      font-size: 15px;
      line-height: 1.4;
    }
  }

  .loading {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }
}

:deep(.markdown-body) {
  background: transparent;
  
  pre {
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
    overflow-x: auto;
  }
  
  code {
    font-size: 14px;
    font-family: Consolas, Monaco, 'Courier New', monospace;
  }
}
</style> 