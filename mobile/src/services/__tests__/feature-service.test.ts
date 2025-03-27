import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { FeatureService } from '../feature-service'
import { NetworkService, RequestPriority, NetworkError } from '../network-service'

// 模拟网络服务
vi.mock('../network-service', () => {
  const NetworkErrorMock = class NetworkError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NetworkError';
    }
  };
  
  return {
    NetworkService: {
      getInstance: vi.fn()
    },
    RequestPriority: {
      HIGH: 0,
      MEDIUM: 1,
      LOW: 2
    },
    NetworkError: NetworkErrorMock
  };
})

describe('FeatureService', () => {
  let featureService: FeatureService
  let mockNetworkService: any
  
  beforeEach(() => {
    // 重置单例
    (FeatureService as any).instance = null
    
    // 创建模拟的网络服务
    mockNetworkService = {
      request: vi.fn(),
      getNetworkStatus: vi.fn(() => ({ value: 'online' })),
      getQueueStatus: vi.fn(() => ({ pending: 0, processing: 0 }))
    }
    ;(NetworkService.getInstance as any).mockReturnValue(mockNetworkService)
    
    // 创建服务实例
    featureService = FeatureService.getInstance()
  })
  
  afterEach(() => {
    vi.clearAllMocks()
    
    // 不要在这里重置服务, 因为会影响 "状态重置" 测试
    // 由测试单独控制重置行为
  })
  
  describe('单例模式', () => {
    it('应该返回相同的实例', () => {
      const instance1 = FeatureService.getInstance()
      const instance2 = FeatureService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })
  
  describe('初始化', () => {
    it('应该成功初始化并获取功能列表', async () => {
      const mockFeatures = [
        { id: 'test1', name: '测试1', type: 'test' },
        { id: 'test2', name: '测试2', type: 'test' }
      ]
      
      mockNetworkService.request.mockResolvedValueOnce(mockFeatures)
      
      await featureService.initialize()
      
      expect(featureService.getFeatures()).toEqual(mockFeatures)
      expect(mockNetworkService.request).toHaveBeenCalledWith({
        url: '/api/features',
        priority: RequestPriority.HIGH,
        timeout: 5000,
        retryCount: 2,
        retryDelay: 1000
      })
    })
    
    it('应该在初始化失败时使用默认功能列表', async () => {
      mockNetworkService.request.mockRejectedValueOnce(new Error('Network error'))
      
      await featureService.initialize()
      
      const features = featureService.getFeatures()
      expect(features.length).toBe(3)
      expect(features[0].id).toBe('note')
      expect(features[1].id).toBe('chat')
      expect(features[2].id).toBe('llm')
    })
  })
  
  describe('功能查询', () => {
    beforeEach(async () => {
      const mockFeatures = [
        { id: 'note', name: '笔记', type: 'notes' },
        { id: 'chat', name: '聊天', type: 'chat' },
        { id: 'llm', name: 'LLM问答', type: 'llm' }
      ]
      mockNetworkService.request.mockResolvedValueOnce(mockFeatures)
      await featureService.initialize()
    })
    
    it('应该根据ID获取功能', () => {
      const feature = featureService.getFeatureById('note')
      expect(feature).toBeDefined()
      expect(feature?.name).toBe('笔记')
    })
    
    it('应该根据类型获取功能', () => {
      const features = featureService.getFeaturesByType('chat')
      expect(features.length).toBe(1)
      expect(features[0].name).toBe('聊天')
    })
  })
  
  describe('消息发送', () => {
    beforeEach(async () => {
      const mockFeatures = [
        { id: 'test', name: '测试', type: 'test' }
      ]
      mockNetworkService.request.mockResolvedValueOnce(mockFeatures)
      await featureService.initialize()
    })
    
    it('应该成功发送消息', async () => {
      mockNetworkService.request.mockResolvedValueOnce({ success: true })
      
      const result = await featureService.sendFeatureMessage('test', '测试消息')
      
      expect(result).toEqual({ success: true })
      expect(mockNetworkService.request).toHaveBeenCalledWith({
        url: '/api/features/test/message',
        method: 'POST',
        data: { content: '测试消息' },
        priority: RequestPriority.MEDIUM,
        timeout: 10000,
        retryCount: 2,
        batchKey: 'feature_message_test'
      })
    })
    
    it('应该在发送消息失败时抛出错误', async () => {
      // 使用已实现的 NetworkError 类
      const error = new NetworkError('发送失败')
      mockNetworkService.request.mockRejectedValueOnce(error)
      
      await expect(async () => {
        await featureService.sendFeatureMessage('test', '测试消息')
      }).rejects.toThrow('发送失败')
    })
    
    it('应该在功能不存在时抛出错误', async () => {
      await expect(async () => {
        await featureService.sendFeatureMessage('nonexistent', '测试消息')
      }).rejects.toThrow('功能 nonexistent 不存在')
    })
  })
  
  describe('批量消息发送', () => {
    beforeEach(async () => {
      const mockFeatures = [
        { id: 'test', name: '测试', type: 'test' }
      ]
      mockNetworkService.request.mockResolvedValueOnce(mockFeatures)
      await featureService.initialize()
    })
    
    it('应该成功批量发送消息', async () => {
      const messages = ['消息1', '消息2', '消息3']
      mockNetworkService.request.mockResolvedValueOnce([
        { success: true, id: 1 },
        { success: true, id: 2 },
        { success: true, id: 3 }
      ])
      
      const results = await featureService.sendFeatureMessages('test', messages)
      
      expect(results.length).toBe(3)
      expect(mockNetworkService.request).toHaveBeenCalledWith({
        url: '/api/features/test/messages',
        method: 'POST',
        data: messages.map(content => ({ content })),
        priority: RequestPriority.MEDIUM,
        timeout: 15000,
        retryCount: 2,
        batchKey: 'feature_messages_test'
      })
    })
  })
  
  describe('监听器', () => {
    it('应该正确添加和移除监听器', async () => {
      const listener = vi.fn()
      featureService.addChangeListener(listener)
      
      const mockFeatures = [
        { id: 'test', name: '测试', type: 'test' }
      ]
      mockNetworkService.request.mockResolvedValueOnce(mockFeatures)
      
      await featureService.initialize()
      
      expect(listener).toHaveBeenCalledWith(mockFeatures)
      
      featureService.removeChangeListener(listener)
      await featureService.initialize()
      
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })
  
  describe('状态重置', () => {
    it('应该正确重置服务状态', async () => {
      // 首先设置一些初始状态
      const mockFeatures = [
        { id: 'test', name: '测试', type: 'test' }
      ]
      mockNetworkService.request.mockResolvedValueOnce(mockFeatures)
      await featureService.initialize()
      
      // 验证初始状态已设置
      expect(featureService.getFeatures()).toEqual(mockFeatures)
      
      // 重置服务
      featureService.reset()
      
      // 验证状态已清空
      expect(featureService.getFeatures()).toHaveLength(0)
      
      // 再次准备请求响应
      mockNetworkService.request.mockResolvedValueOnce(mockFeatures)
      
      // 重新初始化
      await featureService.initialize()
      
      // 验证状态已恢复
      expect(featureService.getFeatures()).toEqual(mockFeatures)
    })
  })
}) 