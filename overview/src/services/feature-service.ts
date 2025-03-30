import { 
  featuresApi, 
  FeatureType, 
  type Feature as OverviewFeature,
  FeatureEvents, 
  eventBus 
} from '../../../overview/src';

export interface Feature {
  id: string;
  name: string;
  type: string;
  icon?: string;
  description?: string;
  order?: number;
  disabled?: boolean;
}

class FeatureService {
  private features: Feature[] = [];
  private isInitialized = false;
  private listeners: ((features: Feature[]) => void)[] = [];

  private mapOverviewFeature(feature: OverviewFeature): Feature {
    return {
      id: feature.id,
      name: feature.name,
      type: feature.type,
      icon: feature.icon,
      description: feature.description,
      order: feature.order,
      disabled: feature.disabled
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // 从Overview模块获取功能
      const overviewFeatures = await featuresApi.getVisibleFeatures();
      this.features = overviewFeatures.map(f => this.mapOverviewFeature(f));
      
      // 监听功能变化
      eventBus.subscribe(FeatureEvents.FEATURES_CHANGED, (features: OverviewFeature[]) => {
        this.features = features.map(f => this.mapOverviewFeature(f));
        this.notifyListeners();
      });
      
      this.isInitialized = true;
      this.notifyListeners();
      console.info('功能服务初始化完成');
    } catch (error) {
      console.error('功能服务初始化失败:', error);
      throw error;
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.features));
  }

  addListener(listener: (features: Feature[]) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (features: Feature[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  getFeatures(): Feature[] {
    return this.features;
  }

  getFeatureById(id: string): Feature | undefined {
    return this.features.find(f => f.id === id);
  }

  async sendFeatureMessage(featureId: string, message: string): Promise<any> {
    const feature = this.getFeatureById(featureId);
    if (!feature) {
      throw new Error(`功能[${featureId}]不存在`);
    }
    
    // 通过Overview的事件总线发送消息
    eventBus.publish(`feature:${featureId}:message`, {
      id: Date.now().toString(),
      featureId,
      content: message,
      timestamp: new Date().toISOString(),
      source: 'mobile'
    });
    
    // 返回Promise以支持异步响应
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new Error('请求超时'));
      }, 30000);

      const unsubscribe = eventBus.subscribe(`feature:${featureId}:response`, (response) => {
        clearTimeout(timeout);
        unsubscribe();
        resolve(response);
      });
    });
  }
}

export const featureService = new FeatureService(); 