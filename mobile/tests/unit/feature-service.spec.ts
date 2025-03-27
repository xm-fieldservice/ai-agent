import { describe, it, expect, beforeEach, vi } from 'vitest'
import { featureService } from '../../src/services/feature-service'
import { featuresApi, eventBus } from '../../../../overview/src'

// Mock Overview模块
vi.mock('../../../../overview/src', () => ({
  featuresApi: {
    getVisibleFeatures: vi.fn(),
  },
  eventBus: {
    publish: vi.fn(),
    subscribe: vi.fn(),
  },
  FeatureEvents: {
    FEATURES_CHANGED: 'features:changed',
  },
}))

describe('FeatureService', () => {
  const mockFeatures = [
    {
      id: '1',
      name: 'Test Feature 1',
      type: 'test',
      icon: 'test-icon',
      description: 'Test Description',
      order: 1,
      disabled: false,
    },
    {
      id: '2',
      name: 'Test Feature 2',
      type: 'test',
      icon: 'test-icon-2',
      description: 'Test Description 2',
      order: 2,
      disabled: true,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset service state
    featureService['features'] = []
    featureService['isInitialized'] = false
    featureService['listeners'] = []
  })

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      // Mock API response
      vi.mocked(featuresApi.getVisibleFeatures).mockResolvedValue(mockFeatures)

      // Initialize service
      await featureService.initialize()

      // Verify API was called
      expect(featuresApi.getVisibleFeatures).toHaveBeenCalled()

      // Verify features were mapped correctly
      const features = featureService.getFeatures()
      expect(features).toHaveLength(2)
      expect(features[0]).toEqual(expect.objectContaining({
        id: '1',
        name: 'Test Feature 1',
      }))
    })

    it('should handle initialization errors', async () => {
      // Mock API error
      const error = new Error('API Error')
      vi.mocked(featuresApi.getVisibleFeatures).mockRejectedValue(error)

      // Verify error is thrown
      await expect(featureService.initialize()).rejects.toThrow('功能服务初始化失败')
    })

    it('should not initialize twice', async () => {
      // Mock API response
      vi.mocked(featuresApi.getVisibleFeatures).mockResolvedValue(mockFeatures)

      // Initialize service twice
      await featureService.initialize()
      await featureService.initialize()

      // Verify API was called only once
      expect(featuresApi.getVisibleFeatures).toHaveBeenCalledTimes(1)
    })
  })

  describe('feature management', () => {
    beforeEach(async () => {
      vi.mocked(featuresApi.getVisibleFeatures).mockResolvedValue(mockFeatures)
      await featureService.initialize()
    })

    it('should get features correctly', () => {
      const features = featureService.getFeatures()
      expect(features).toHaveLength(2)
    })

    it('should get feature by id', () => {
      const feature = featureService.getFeatureById('1')
      expect(feature).toBeDefined()
      expect(feature?.name).toBe('Test Feature 1')
    })

    it('should return undefined for non-existent feature', () => {
      const feature = featureService.getFeatureById('non-existent')
      expect(feature).toBeUndefined()
    })
  })

  describe('message handling', () => {
    beforeEach(async () => {
      vi.mocked(featuresApi.getVisibleFeatures).mockResolvedValue(mockFeatures)
      await featureService.initialize()
    })

    it('should send message successfully', async () => {
      // Mock event bus
      const mockResponse = { id: '1', content: 'response' }
      vi.mocked(eventBus.subscribe).mockImplementation((topic, callback) => {
        setTimeout(() => callback(mockResponse), 0)
        return vi.fn()
      })

      // Send message
      const response = await featureService.sendFeatureMessage('1', 'test message')

      // Verify message was published
      expect(eventBus.publish).toHaveBeenCalledWith(
        'feature:1:message',
        expect.objectContaining({
          featureId: '1',
          content: 'test message',
        })
      )

      // Verify response
      expect(response).toEqual(mockResponse)
    })

    it('should handle send message timeout', async () => {
      // Mock event bus timeout
      vi.mocked(eventBus.subscribe).mockImplementation(() => vi.fn())

      // Verify timeout error
      await expect(
        featureService.sendFeatureMessage('1', 'test message')
      ).rejects.toThrow('请求超时')
    })

    it('should handle non-existent feature', async () => {
      await expect(
        featureService.sendFeatureMessage('non-existent', 'test message')
      ).rejects.toThrow('功能[non-existent]不存在')
    })
  })

  describe('listener management', () => {
    it('should handle listeners correctly', async () => {
      const listener = vi.fn()
      
      // Add listener
      featureService.addListener(listener)
      
      // Initialize service (should trigger listener)
      vi.mocked(featuresApi.getVisibleFeatures).mockResolvedValue(mockFeatures)
      await featureService.initialize()
      
      // Verify listener was called
      expect(listener).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: '1' })
      ]))
      
      // Remove listener
      featureService.removeListener(listener)
      
      // Trigger features changed event
      const eventCallback = vi.mocked(eventBus.subscribe).mock.calls[0][1]
      eventCallback(mockFeatures)
      
      // Verify listener was not called again
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })
}) 