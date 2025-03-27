import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MessageHistory from '../../src/components/MessageHistory.vue'
import { featureService } from '../../src/services/feature-service'

// Mock feature service
vi.mock('../../src/services/feature-service', () => ({
  featureService: {
    sendFeatureMessage: vi.fn(),
  },
}))

describe('MessageHistory', () => {
  const mockProps = {
    featureId: 'test-feature',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render empty state when no messages', () => {
    const wrapper = mount(MessageHistory, {
      props: mockProps,
    })

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('暂无消息')
  })

  it('should render loading state', async () => {
    const wrapper = mount(MessageHistory, {
      props: mockProps,
    })

    // Set loading state
    await wrapper.setData({ loading: true })

    expect(wrapper.find('.loading-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('加载消息历史')
  })

  it('should render error state', async () => {
    const wrapper = mount(MessageHistory, {
      props: mockProps,
    })

    // Set error state
    await wrapper.setData({ error: '加载失败' })

    expect(wrapper.find('.error-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('加载失败')
  })

  it('should render messages correctly', async () => {
    const wrapper = mount(MessageHistory, {
      props: mockProps,
    })

    const messages = [
      {
        id: '1',
        content: 'Test message 1',
        timestamp: new Date().toISOString(),
        source: 'mobile',
      },
      {
        id: '2',
        content: 'Test message 2',
        timestamp: new Date().toISOString(),
        source: 'system',
      },
    ]

    // Add messages
    await wrapper.setData({ messages })

    const messageElements = wrapper.findAll('.message-item')
    expect(messageElements).toHaveLength(2)

    // Verify message classes
    expect(messageElements[0].classes()).toContain('sent')
    expect(messageElements[1].classes()).toContain('received')
  })

  it('should handle message resend', async () => {
    const wrapper = mount(MessageHistory, {
      props: mockProps,
    })

    const message = {
      id: '1',
      content: 'Test message',
      timestamp: new Date().toISOString(),
      source: 'mobile',
      error: true,
      featureId: mockProps.featureId,
    }

    // Add failed message
    await wrapper.setData({ messages: [message] })

    // Mock successful resend
    vi.mocked(featureService.sendFeatureMessage).mockResolvedValue({
      id: '2',
      content: 'response',
    })

    // Click resend button
    await wrapper.find('.resend-button').trigger('click')

    // Verify service was called
    expect(featureService.sendFeatureMessage).toHaveBeenCalledWith(
      mockProps.featureId,
      message.content
    )

    // Verify error state was removed
    const messages = wrapper.vm.messages
    expect(messages[0].error).toBe(false)
  })

  it('should handle resend failure', async () => {
    const wrapper = mount(MessageHistory, {
      props: mockProps,
    })

    const message = {
      id: '1',
      content: 'Test message',
      timestamp: new Date().toISOString(),
      source: 'mobile',
      error: true,
      featureId: mockProps.featureId,
    }

    // Add failed message
    await wrapper.setData({ messages: [message] })

    // Mock resend failure
    vi.mocked(featureService.sendFeatureMessage).mockRejectedValue(
      new Error('Send failed')
    )

    // Click resend button
    await wrapper.find('.resend-button').trigger('click')

    // Verify retry event was emitted
    expect(wrapper.emitted('retry')).toBeTruthy()
    expect(wrapper.emitted('retry')?.[0]).toEqual([message])
  })

  it('should format time correctly', () => {
    const wrapper = mount(MessageHistory, {
      props: mockProps,
    })

    const now = new Date()
    const formatted = wrapper.vm.formatTime(now.toISOString())

    expect(formatted).toMatch(/^\d{2}:\d{2}$/)
  })

  it('should scroll to bottom when adding messages', async () => {
    const wrapper = mount(MessageHistory, {
      props: mockProps,
    })

    // Mock scrollTo
    const scrollToSpy = vi.spyOn(wrapper.vm.historyRef, 'scrollTop', 'set')

    // Add message
    await wrapper.vm.addMessage({
      id: '1',
      content: 'Test message',
      timestamp: new Date().toISOString(),
      source: 'mobile',
    })

    // Wait for next tick
    await wrapper.vm.$nextTick()

    // Verify scroll was called
    expect(scrollToSpy).toHaveBeenCalled()
  })
}) 