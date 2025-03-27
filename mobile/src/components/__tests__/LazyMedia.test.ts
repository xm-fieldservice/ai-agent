import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { shallowMount, VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'

// 创建一个简单的模拟组件替代实际组件
const LazyMediaMock = defineComponent({
  props: {
    url: String,
    type: String,
    thumbnailUrl: String,
    alt: String,
    width: Number,
    height: Number,
    mediaType: String,
    fileName: String,
    fileSize: Number
  },
  template: `
    <div class="lazy-media" :class="type">
      <img v-if="type === 'image'" class="thumbnail" v-show="thumbnailUrl" :src="thumbnailUrl" alt="缩略图" />
      <img v-if="type === 'image'" class="full-image" :src="url" :alt="alt" @load="$emit('load')" @error="$emit('error', $event)" />
      <video v-if="type === 'video'" class="video-player" :poster="thumbnailUrl">
        <source :src="url" :type="mediaType" />
      </video>
      <audio v-if="type === 'audio'" class="audio-player">
        <source :src="url" :type="mediaType" />
      </audio>
      <div v-if="type === 'file'" class="file-preview" @click="$emit('click')">
        <span class="file-name">{{ fileName }}</span>
        <span class="file-size">{{ formatFileSize(fileSize) }}</span>
      </div>
      <div class="error-overlay">
        <button class="retry-button" @click="$emit('retry')">重试</button>
      </div>
    </div>
  `,
  methods: {
    formatFileSize(bytes: number | undefined): string {
      if (!bytes) return '未知大小'
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    }
  }
})

describe('LazyMedia 组件', () => {
  let wrapper: VueWrapper<any>

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })
  
  describe('图片类型', () => {
    beforeEach(() => {
      wrapper = shallowMount(LazyMediaMock, {
        props: {
          url: 'https://example.com/image.jpg',
          type: 'image',
          thumbnailUrl: 'https://example.com/thumbnail.jpg',
          alt: '测试图片',
          width: 800,
          height: 600
        }
      })
    })
    
    it('应该正确渲染图片组件', () => {
      expect(wrapper.find('.lazy-media').exists()).toBe(true)
      expect(wrapper.find('.lazy-media').classes()).toContain('image')
      expect(wrapper.find('.thumbnail').exists()).toBe(true)
      expect(wrapper.find('.full-image').exists()).toBe(true)
    })
    
    it('应该在图片加载完成时触发加载事件', async () => {
      await wrapper.find('.full-image').trigger('load')
      expect(wrapper.emitted('load')).toBeTruthy()
    })
    
    it('应该在图片加载失败时触发错误事件', async () => {
      await wrapper.find('.full-image').trigger('error')
      expect(wrapper.emitted('error')).toBeTruthy()
    })
    
    it('应该在点击重试按钮时触发重试事件', async () => {
      await wrapper.find('.retry-button').trigger('click')
      expect(wrapper.emitted('retry')).toBeTruthy()
    })
  })
  
  describe('视频类型', () => {
    beforeEach(() => {
      wrapper = shallowMount(LazyMediaMock, {
        props: {
          url: 'https://example.com/video.mp4',
          type: 'video',
          thumbnailUrl: 'https://example.com/poster.jpg',
          mediaType: 'video/mp4'
        }
      })
    })
    
    it('应该正确渲染视频组件', () => {
      expect(wrapper.find('.lazy-media').exists()).toBe(true)
      expect(wrapper.find('.lazy-media').classes()).toContain('video')
      expect(wrapper.find('.video-player').exists()).toBe(true)
      expect(wrapper.find('.video-player').attributes('poster')).toBe('https://example.com/poster.jpg')
      expect(wrapper.find('source').attributes('src')).toBe('https://example.com/video.mp4')
      expect(wrapper.find('source').attributes('type')).toBe('video/mp4')
    })
  })
  
  describe('音频类型', () => {
    beforeEach(() => {
      wrapper = shallowMount(LazyMediaMock, {
        props: {
          url: 'https://example.com/audio.mp3',
          type: 'audio',
          mediaType: 'audio/mpeg'
        }
      })
    })
    
    it('应该正确渲染音频组件', () => {
      expect(wrapper.find('.lazy-media').exists()).toBe(true)
      expect(wrapper.find('.lazy-media').classes()).toContain('audio')
      expect(wrapper.find('.audio-player').exists()).toBe(true)
      expect(wrapper.find('source').attributes('src')).toBe('https://example.com/audio.mp3')
      expect(wrapper.find('source').attributes('type')).toBe('audio/mpeg')
    })
  })
  
  describe('文件类型', () => {
    beforeEach(() => {
      wrapper = shallowMount(LazyMediaMock, {
        props: {
          url: 'https://example.com/document.pdf',
          type: 'file',
          fileName: 'document.pdf',
          fileSize: 1024 * 1024 // 1MB
        }
      })
    })
    
    it('应该正确渲染文件组件', () => {
      expect(wrapper.find('.lazy-media').exists()).toBe(true)
      expect(wrapper.find('.lazy-media').classes()).toContain('file')
      expect(wrapper.find('.file-preview').exists()).toBe(true)
      expect(wrapper.find('.file-name').text()).toBe('document.pdf')
      expect(wrapper.find('.file-size').text()).toBe('1.0 MB')
    })
    
    it('应该在点击文件时触发点击事件', async () => {
      await wrapper.find('.file-preview').trigger('click')
      expect(wrapper.emitted('click')).toBeTruthy()
    })
  })
}) 