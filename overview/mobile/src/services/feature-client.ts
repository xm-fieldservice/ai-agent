/**
 * 功能客户端 - 移动端与Overview模块功能系统的通信接口
 * 负责获取功能列表和触发功能事件
 */

/**
 * 功能类型枚举
 */
export enum FeatureType {
  NOTES = 'notes',        // 笔记功能
  CHAT = 'chat',          // 聊天功能
  LLM = 'llm',            // LLM问答功能
  SETTINGS = 'settings',  // 设置功能
  SEARCH = 'search'       // 搜索功能
}

/**
 * 功能项接口定义
 */
export interface Feature {
  id: string;             // 功能唯一标识
  type: string;           // 功能类型
  name: string;           // 功能名称
  description?: string;   // 功能描述
  icon?: string;          // 功能图标
  mobilePath?: string;    // 移动端路由路径
  pcPath?: string;        // PC端路由路径
  permissions?: string[]; // 所需权限
  disabled?: boolean;     // 是否禁用
  sortOrder?: number;     // 排序顺序
  handler?: (data?: any) => void; // 功能处理函数
  meta?: Record<string, any>; // 其他元数据
  group?: string;         // 分组
}

/**
 * 事件监听器类型定义
 */
type EventCallback = (data: any) => void;

/**
 * 功能客户端类
 * 移动端与Overview模块通信的接口
 */
export class FeatureClient {
  private apiBaseUrl: string;
  private features: Feature[] = [];
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private initialized = false;
  
  /**
   * 构造函数
   * @param apiBaseUrl API基础URL
   */
  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.initDefaultFeatures();
    
    // 监听全局消息事件
    this.setupMessageListener();
  }
  
  /**
   * 初始化默认功能
   * 在真实环境中，这些功能应该从服务器获取
   */
  private initDefaultFeatures() {
    // 模拟从Overview模块获取的功能列表
    this.features = [
      {
        id: 'notes',
        type: 'notes',
        name: '笔记',
        description: '记录和管理您的笔记',
        icon: '📝',
        mobilePath: '/notes',
        sortOrder: 1
      },
      {
        id: 'chat',
        type: 'chat',
        name: '聊天',
        description: '与AI助手对话',
        icon: '💬',
        mobilePath: '/chat',
        sortOrder: 2
      },
      {
        id: 'llm',
        type: 'llm',
        name: 'LLM问答',
        description: '智能问答服务',
        icon: '🤖',
        mobilePath: '/llm',
        sortOrder: 3
      }
    ];
  }
  
  /**
   * 设置消息监听器
   * 用于接收来自父窗口的消息
   */
  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      // 安全检查：确保消息来源可信
      if (!this.isValidMessageSource(event.origin)) {
        return;
      }

      const { type, data } = event.data || {};
      if (!type) return;

      // 处理不同类型的消息
      switch (type) {
        case 'feature-list':
          if (Array.isArray(data)) {
            this.updateFeatures(data);
          }
          break;
        case 'feature-activate':
          if (data && data.featureId) {
            this.handleFeatureActivated(data.featureId, data.params);
          }
          break;
        default:
          // 触发自定义事件监听器
          this.triggerEvent(type, data);
      }
    });
  }

  /**
   * 检查消息来源是否有效
   */
  private isValidMessageSource(origin: string): boolean {
    // 开发环境下允许localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return true;
    }

    // 这里应该添加实际部署环境的域名验证
    const validOrigins = [
      window.location.origin,
      // 添加其他可信的源，如主应用的域名
    ];

    return validOrigins.includes(origin);
  }

  /**
   * 向父窗口发送消息
   */
  private postMessageToParent(type: string, data: any): void {
    // 如果在iframe中运行，则向父窗口发送消息
    if (window.parent !== window) {
      window.parent.postMessage({ type, data }, '*');
    }
  }
  
  /**
   * 从服务器获取功能列表
   * @returns Promise<Feature[]>
   */
  async fetchFeatures(): Promise<Feature[]> {
    try {
      // 检查是否在iframe中运行
      const isInIframe = window.parent !== window;
      
      if (isInIframe) {
        // 向父窗口请求功能列表
        this.postMessageToParent('get-features', {});
        
        // 返回Promise，会在收到消息时通过updateFeatures更新
        return new Promise((resolve) => {
          const listener = (event: MessageEvent) => {
            if (!this.isValidMessageSource(event.origin)) {
              return;
            }
            
            const { type, data } = event.data || {};
            if (type === 'feature-list' && Array.isArray(data)) {
              this.updateFeatures(data);
              window.removeEventListener('message', listener);
              resolve(this.features);
            }
          };
          
          window.addEventListener('message', listener);
          
          // 5秒超时，使用默认功能列表
          setTimeout(() => {
            window.removeEventListener('message', listener);
            console.log('获取功能列表超时，使用默认功能列表');
            resolve(this.features);
          }, 5000);
        });
      } else {
        // 模拟API调用，实际开发中应替换为真实的API请求
        console.log('使用模拟功能列表（开发环境）');
        return Promise.resolve(this.features);
      }
    } catch (error) {
      console.error('获取功能列表失败', error);
      return this.features;
    } finally {
      this.initialized = true;
    }
  }
  
  /**
   * 更新功能列表
   */
  private updateFeatures(newFeatures: Feature[]): void {
    // 合并新功能列表，保留本地状态
    if (Array.isArray(newFeatures) && newFeatures.length > 0) {
      // 保留现有功能的状态
      const updatedFeatures = newFeatures.map(newFeature => {
        const existingFeature = this.features.find(f => f.id === newFeature.id);
        if (existingFeature) {
          // 合并现有状态
          return { ...existingFeature, ...newFeature };
        }
        return newFeature;
      });
      
      this.features = updatedFeatures;
      console.log('功能列表已更新', this.features);
    }
  }
  
  /**
   * 获取所有功能
   * @returns Feature[]
   */
  getAllFeatures(): Feature[] {
    return [...this.features]
      .filter(feature => !feature.disabled)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  
  /**
   * 获取指定类型的功能
   * @param type 功能类型
   * @returns Feature[]
   */
  getFeaturesByType(type: FeatureType): Feature[] {
    return this.getAllFeatures().filter(feature => feature.type === type);
  }
  
  /**
   * 获取指定ID的功能
   * @param id 功能ID
   * @returns Feature | undefined
   */
  getFeatureById(id: string): Feature | undefined {
    return this.features.find(feature => feature.id === id);
  }
  
  /**
   * 激活功能
   * @param featureId 功能ID
   * @param params 参数对象
   */
  activateFeature(featureId: string, params: any = {}): void {
    const feature = this.getFeatureById(featureId);
    
    if (!feature) {
      console.warn(`激活功能失败: 未找到ID为 '${featureId}' 的功能`);
      return;
    }
    
    if (feature.disabled) {
      console.warn(`激活功能失败: 功能已禁用 ${featureId}`);
      return;
    }
    
    // 触发本地事件
    this.triggerEvent('feature-activated', { featureId, params });
    
    // 向父窗口发送激活消息
    this.postMessageToParent('feature-activate', { featureId, params });
    
    console.log(`功能已激活: ${feature.name} (${featureId})`, params);
  }
  
  /**
   * 处理功能被激活的事件
   */
  private handleFeatureActivated(featureId: string, data: any): void {
    const feature = this.getFeatureById(featureId);
    if (!feature) {
      console.warn(`处理功能激活失败: 未找到功能ID ${featureId}`);
      return;
    }
    
    // 执行功能处理函数
    if (typeof feature.handler === 'function') {
      try {
        feature.handler(data);
      } catch (error) {
        console.error(`功能处理函数执行出错: ${featureId}`, error);
      }
    }
  }
  
  /**
   * 注册事件监听器
   */
  addEventListener(eventType: string, callback: EventCallback): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)?.add(callback);
  }
  
  /**
   * 移除事件监听器
   */
  removeEventListener(eventType: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  /**
   * 触发事件
   */
  private triggerEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件监听器执行出错: ${eventType}`, error);
        }
      });
    }
  }
}

// 创建并导出功能客户端实例
export const featureClient = new FeatureClient(); 