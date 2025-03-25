/**
 * 功能服务
 * 用于连接Overview模块的功能注册表
 */

// 导入Overview模块API
// 实际应用中，这里应该导入实际的Overview模块API
// import { featuresApi, type Feature, FeatureType } from '@overview/api';

// 模拟Feature类型
export interface Feature {
  id: string;
  name: string;
  type: string;
  icon?: string;
  iconComponent?: any;
  description?: string;
  order?: number;
  disabled?: boolean;
  [key: string]: any;
}

// 输入类型
export enum InputType {
  TEXT = 'text',
  NOTE = 'note',
  CHAT = 'chat',
  LLM = 'llm'
}

/**
 * 功能服务类
 * 负责与Overview模块的功能注册表通信
 */
class FeatureService {
  private features: Feature[] = [];
  private listeners: ((features: Feature[]) => void)[] = [];
  private isInitialized = false;

  /**
   * 初始化功能服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // 实际应用中，应该从Overview模块获取功能
      // const features = await featuresApi.getVisibleFeatures();
      
      // 模拟功能数据
      this.features = [
        {
          id: 'note',
          name: '笔记',
          type: 'note',
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
      ];
      
      this.isInitialized = true;
      this.notifyListeners();
      
      // 实际应用中，还应该监听功能变化
      // featuresApi.onFeaturesChanged(this.handleFeaturesChanged);
      
      console.info('功能服务初始化完成');
    } catch (error) {
      console.error('功能服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 处理功能变化
   */
  private handleFeaturesChanged = (features: Feature[]) => {
    this.features = features;
    this.notifyListeners();
  };

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getVisibleFeatures()));
  }

  /**
   * 获取所有可见功能
   */
  getVisibleFeatures(): Feature[] {
    return this.features
      .filter(feature => !feature.disabled)
      .sort((a, b) => (a.order || 999) - (b.order || 999));
  }

  /**
   * 根据ID获取功能
   */
  getFeatureById(id: string): Feature | undefined {
    return this.features.find(feature => feature.id === id);
  }

  /**
   * 根据类型获取功能
   */
  getFeaturesByType(type: string): Feature[] {
    return this.features.filter(feature => feature.type === type);
  }

  /**
   * 监听功能变化
   */
  onFeaturesChanged(listener: (features: Feature[]) => void): () => void {
    this.listeners.push(listener);
    
    // 如果已初始化，立即通知
    if (this.isInitialized) {
      listener(this.getVisibleFeatures());
    }
    
    // 返回取消监听的函数
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 映射输入类型
   */
  mapFeatureToInputType(featureId: string): InputType {
    switch (featureId) {
      case 'note':
        return InputType.NOTE;
      case 'chat':
        return InputType.CHAT;
      case 'llm':
        return InputType.LLM;
      default:
        return InputType.TEXT;
    }
  }

  /**
   * 发送功能消息
   */
  async sendFeatureMessage(featureId: string, message: string): Promise<any> {
    // 实际应用中，应该通过Overview模块发送消息
    console.log(`向功能[${featureId}]发送消息:`, message);
    
    // 模拟异步响应
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `已处理[${featureId}]消息: ${message}`
        });
      }, 500);
    });
  }
}

// 创建单例实例
export const featureService = new FeatureService();

// 默认导出
export default featureService; 