/**
 * 功能注册表系统
 * 管理系统中所有功能模块的注册与发现
 */

// 功能类型定义
export enum FeatureType {
  NOTE = 'note',          // 笔记功能
  CHAT = 'chat',          // 聊天功能
  LLM = 'llm',            // LLM问答功能
  SETTINGS = 'settings',  // 设置功能
  SEARCH = 'search'       // 搜索功能
}

// 功能项接口定义
export interface Feature {
  id: string;             // 功能唯一标识符
  type: FeatureType;      // 功能类型
  name: string;           // 功能显示名称
  description?: string;   // 功能描述
  icon?: string;          // 功能图标
  order?: number;         // 显示顺序
  component?: string;     // 关联的组件名称
  permission?: string[];  // 所需权限
  disabled?: boolean;     // 是否禁用
  visible?: boolean;      // 是否可见
  config?: Record<string, any>; // 功能配置
  metadata?: Record<string, any>; // 元数据
}

// 功能注册表类
class FeatureRegistry {
  private features: Map<string, Feature> = new Map();
  private listeners: Array<(features: Feature[]) => void> = [];

  /**
   * 注册功能
   * @param feature 功能定义
   * @returns 是否注册成功
   */
  register(feature: Feature): boolean {
    if (this.features.has(feature.id)) {
      console.warn(`Feature with id "${feature.id}" already exists.`);
      return false;
    }

    this.features.set(feature.id, {
      ...feature,
      visible: feature.visible !== false,
      disabled: !!feature.disabled,
      order: feature.order || 999
    });

    this.notifyListeners();
    return true;
  }

  /**
   * 批量注册功能
   * @param features 功能定义数组
   */
  registerBatch(features: Feature[]): void {
    let updated = false;
    
    features.forEach(feature => {
      if (!this.features.has(feature.id)) {
        this.features.set(feature.id, {
          ...feature,
          visible: feature.visible !== false,
          disabled: !!feature.disabled,
          order: feature.order || 999
        });
        updated = true;
      }
    });

    if (updated) {
      this.notifyListeners();
    }
  }

  /**
   * 更新功能
   * @param id 功能ID
   * @param updates 更新内容
   * @returns 是否更新成功
   */
  update(id: string, updates: Partial<Feature>): boolean {
    if (!this.features.has(id)) {
      console.warn(`Feature with id "${id}" not found.`);
      return false;
    }

    const feature = this.features.get(id)!;
    this.features.set(id, { ...feature, ...updates });
    this.notifyListeners();
    return true;
  }

  /**
   * 删除功能
   * @param id 功能ID
   * @returns 是否删除成功
   */
  unregister(id: string): boolean {
    if (!this.features.has(id)) {
      return false;
    }

    this.features.delete(id);
    this.notifyListeners();
    return true;
  }

  /**
   * 设置功能可见性
   * @param id 功能ID
   * @param visible 是否可见
   * @returns 是否设置成功
   */
  setVisibility(id: string, visible: boolean): boolean {
    return this.update(id, { visible });
  }

  /**
   * 设置功能禁用状态
   * @param id 功能ID
   * @param disabled 是否禁用
   * @returns 是否设置成功
   */
  setDisabled(id: string, disabled: boolean): boolean {
    return this.update(id, { disabled });
  }

  /**
   * 获取所有功能
   * @returns 功能列表
   */
  getAllFeatures(): Feature[] {
    return Array.from(this.features.values())
      .sort((a, b) => (a.order || 999) - (b.order || 999));
  }

  /**
   * 获取指定类型的功能
   * @param type 功能类型
   * @returns 功能列表
   */
  getFeaturesByType(type: FeatureType): Feature[] {
    return this.getAllFeatures().filter(f => f.type === type);
  }

  /**
   * 获取可见的功能
   * @returns 可见功能列表
   */
  getVisibleFeatures(): Feature[] {
    return this.getAllFeatures().filter(f => f.visible && !f.disabled);
  }

  /**
   * 根据ID获取功能
   * @param id 功能ID
   * @returns 功能定义或undefined
   */
  getFeature(id: string): Feature | undefined {
    return this.features.get(id);
  }

  /**
   * 监听功能变化
   * @param listener 监听器函数
   * @returns 取消监听的函数
   */
  onFeaturesChanged(listener: (features: Feature[]) => void): () => void {
    this.listeners.push(listener);
    
    // 立即通知当前状态
    listener(this.getAllFeatures());
    
    // 返回取消监听的函数
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    const features = this.getAllFeatures();
    this.listeners.forEach(listener => listener(features));
  }
}

// 创建单例实例
export const featureRegistry = new FeatureRegistry();

// 默认导出
export default featureRegistry; 