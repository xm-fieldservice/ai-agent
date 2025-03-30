<template>
  <div class="message-list-container">
    <RecycleScroller
      class="message-list"
      :items="messages"
      :item-size="estimatedItemSize"
      key-field="timestamp"
      v-slot="{ item: message }"
      @scroll="handleScroll"
    >
      <div
        :class="['message-item', message.type]"
      >
        <!-- 消息图标 -->
        <div class="message-icon">
          <component :is="getIcon(message.type)" />
        </div>

        <!-- 消息内容 -->
        <div class="message-content">
          <div
            class="message-text markdown-body"
            v-html="renderMarkdown(message.content)"
          ></div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>
    </RecycleScroller>

    <!-- 加载状态 -->
    <div v-if="loading" class="message-item loading">
      <div class="message-icon">
        <Loading />
      </div>
      <div class="message-content">
        <div class="message-text">
          <van-loading type="spinner" size="24px">处理中...</van-loading>
        </div>
      </div>
    </div>

    <!-- 到顶加载更多 -->
    <div v-if="hasMore" class="load-more" @click="$emit('loadMore')">
      <van-loading v-if="loadingMore" size="16px">加载中...</van-loading>
      <span v-else>下拉加载更多</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { NotesO, ChatO, QuestionO, Loading } from '@vant/icons'
import { Loading as VanLoading } from 'vant'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

// 配置markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (__) {}
    }
    return '' // 使用默认的转义
  }
})

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingMore: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  }
})

defineEmits(['loadMore'])

// 预估的每个消息项的高度（像素）
const estimatedItemSize = 100

// 处理滚动事件，可用于检测是否需要加载更多
const handleScroll = (event) => {
  const { scrollTop } = event.target
  // 如果滚动到顶部且有更多消息可加载
  if (scrollTop < 50 && props.hasMore && !props.loadingMore) {
    emits('loadMore')
  }
}

// 根据消息类型获取对应图标
const getIcon = (type) => {
  const icons = {
    note: NotesO,
    chat: ChatO,
    llm: QuestionO
  }
  return icons[type]
}

// 渲染Markdown内容
const renderMarkdown = (content) => {
  return md.render(content || '')
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped lang="scss">
.message-list-container {
  height: 100%;
  position: relative;
  overflow: hidden;

  .message-list {
    height: 100%;
    padding: 16px;
    overflow-y: auto;
  }

  .message-item {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;

    .message-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .message-content {
      flex: 1;
      max-width: 85%;

      .message-text {
        padding: 12px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        font-size: 14px;
        line-height: 1.5;
      }

      .message-time {
        margin-top: 4px;
        font-size: 12px;
        color: #999;
      }
    }

    // 不同类型消息的样式
    &.note {
      .message-icon {
        color: #10b981;
        background: #ecfdf5;
      }
    }

    &.chat {
      .message-icon {
        color: #3b82f6;
        background: #eff6ff;
      }
    }

    &.llm {
      .message-icon {
        color: #8b5cf6;
        background: #f5f3ff;
      }

      .message-text {
        background: #f8f7ff;
      }
    }

    &.loading {
      opacity: 0.6;

      .message-icon {
        color: #666;
        background: #f5f5f5;
        animation: pulse 1.5s infinite;
      }
    }
  }
}

// Markdown样式
:deep(.markdown-body) {
  font-size: 14px;
  line-height: 1.6;

  p {
    margin: 0 0 10px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  pre {
    margin: 10px 0;
    padding: 12px;
    background: #f6f8fa;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 13px;

    code {
      padding: 0;
      background: none;
    }
  }

  code {
    padding: 2px 4px;
    background: #f6f8fa;
    border-radius: 4px;
    font-size: 13px;
  }

  ul, ol {
    margin: 10px 0;
    padding-left: 20px;
  }

  img {
    max-width: 100%;
    border-radius: 6px;
  }
}

.load-more {
  text-align: center;
  color: #666;
  font-size: 14px;
  padding: 10px 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
</style> 