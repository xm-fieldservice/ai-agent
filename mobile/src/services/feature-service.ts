import { ref } from 'vue'
import { NetworkService, RequestPriority, NetworkError } from './network-service'

// 功能类型定义
export interface Feature {
  id: string
  name: string
  type: string
  icon?: string
  iconComponent?: any
  description?: string
  order?: number
  disabled?: boolean
}

// 功能服务类
export class FeatureService {
  private static instance: FeatureService
  private features: Feature[] = []
  private networkService: NetworkService
  private featureChangeListeners: ((features: Feature[]) => void)[] = []
  private isInitialized = false
  
  private constructor() {
    this.networkService = NetworkService.getInstance()
  }
  
  // 单例模式获取实例
  public static getInstance(): FeatureService {
    if (!FeatureService.instance) {
      FeatureService.instance = new FeatureService()
    }
    return FeatureService.instance
  }
  
  // 初始化服务
  public async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      // 使用高优先级请求获取功能列表
      const response = await this.networkService.request<Feature[]>({
        url: '/api/features',
        priority: RequestPriority.HIGH,
        timeout: 5000,
        retryCount: 2,
        retryDelay: 1000
      })
      
      this.features = response
      this.isInitialized = true
      this.notifyListeners()
    } catch (error) {
      console.error('初始化功能服务失败:', error)
      // 使用默认功能列表作为后备
      this.features = this.getDefaultFeatures()
      this.isInitialized = true
      this.notifyListeners()
    }
  }
  
  // 获取默认功能列表
  private getDefaultFeatures(): Feature[] {
    return [
      { 
        id: 'note', 
        name: '笔记',
        type: 'notes',
        icon: '/icons/note-icon.svg',
        order: 1
      },
      { 
        id: 'chat', 
        name: '聊天',
        type: 'chat',
        icon: '/icons/chat-icon.svg',
        order: 2
      },
      { 
        id: 'llm', 
        name: 'LLM问答',
        type: 'llm',
        icon: '/icons/llm-icon.svg',
        order: 3
      }
    ]
  }
  
  // 获取所有功能
  public getFeatures(): Feature[] {
    return [...this.features]
  }
  
  // 根据ID获取功能
  public getFeatureById(id: string): Feature | undefined {
    return this.features.find(feature => feature.id === id)
  }
  
  // 根据类型获取功能
  public getFeaturesByType(type: string): Feature[] {
    return this.features.filter(feature => feature.type === type)
  }
  
  // 发送功能消息
  public async sendFeatureMessage(featureId: string, content: string): Promise<any> {
    const feature = this.getFeatureById(featureId)
    if (!feature) {
      throw new Error(`功能 ${featureId} 不存在`)
    }
    
    try {
      // 使用批处理发送消息
      return await this.networkService.request({
        url: `/api/features/${featureId}/message`,
        method: 'POST',
        data: { content },
        priority: RequestPriority.MEDIUM,
        timeout: 10000,
        retryCount: 2,
        batchKey: `feature_message_${featureId}` // 使用批处理键
      })
    } catch (error) {
      if (error instanceof NetworkError) {
        console.error(`发送消息到功能 ${featureId} 失败:`, error.message)
      } else {
        console.error(`发送消息到功能 ${featureId} 失败:`, error)
      }
      throw error
    }
  }
  
  // 批量发送功能消息
  public async sendFeatureMessages(featureId: string, messages: string[]): Promise<any[]> {
    const feature = this.getFeatureById(featureId)
    if (!feature) {
      throw new Error(`功能 ${featureId} 不存在`)
    }
    
    try {
      // 使用批处理发送多条消息
      return await this.networkService.request({
        url: `/api/features/${featureId}/messages`,
        method: 'POST',
        data: messages.map(content => ({ content })),
        priority: RequestPriority.MEDIUM,
        timeout: 15000,
        retryCount: 2,
        batchKey: `feature_messages_${featureId}` // 使用批处理键
      })
    } catch (error) {
      if (error instanceof NetworkError) {
        console.error(`批量发送消息到功能 ${featureId} 失败:`, error.message)
      } else {
        console.error(`批量发送消息到功能 ${featureId} 失败:`, error)
      }
      throw error
    }
  }
  
  // 添加功能变更监听器
  public addChangeListener(listener: (features: Feature[]) => void): void {
    this.featureChangeListeners.push(listener)
  }
  
  // 移除功能变更监听器
  public removeChangeListener(listener: (features: Feature[]) => void): void {
    const index = this.featureChangeListeners.indexOf(listener)
    if (index > -1) {
      this.featureChangeListeners.splice(index, 1)
    }
  }
  
  // 通知所有监听器
  private notifyListeners(): void {
    this.featureChangeListeners.forEach(listener => {
      listener(this.features)
    })
  }
  
  // 获取网络状态
  public getNetworkStatus() {
    return this.networkService.getNetworkStatus()
  }
  
  // 获取请求队列状态
  public getQueueStatus() {
    return this.networkService.getQueueStatus()
  }
  
  // 重置服务状态
  public reset(): void {
    this.isInitialized = false
    this.features = []
    this.featureChangeListeners = []
  }
} 