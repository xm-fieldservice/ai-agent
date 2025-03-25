/**
 * 功能服务 - 负责处理功能注册和跨模块通信
 * 作为Overview模块中的核心服务，连接各功能模块
 */

import { eventBus } from '../modules/event-bus';
import { getFeatureRegistry, FeatureType, Feature } from '../modules/features-registry';

// 获取功能注册表实例
const featureRegistry = getFeatureRegistry(eventBus);

/**
 * 功能类型枚举
 */
export enum FeatureType {
  NOTES = 'notes',
  CHAT = 'chat',
  LLM = 'llm',
  SETTINGS = 'settings',
  SEARCH = 'search'
}

/**
 * 功能项接口定义
 */
export interface Feature {
  // 唯一标识
  id: string;
  // 功能类型
  type: string;
  // 功能名称
  name: string;
  // 功能描述
  description?: string;
  // 图标URL或图标名称
  icon?: string;
  // 移动端路径
  mobilePath?: string;
  // PC端路径
  pcPath?: string;
  // 所需权限
  permissions?: string[];
  // 是否禁用
  disabled?: boolean;
  // 排序顺序
  sortOrder?: number;
  // 处理函数
  handler?: (data?: any) => void;
  // 元数据，用于存储额外信息
  meta?: Record<string, any>;
  // 功能分组
  group?: string;
}

/**
 * 功能注册事件类型
 */
export type FeatureRegistrationEvent = {
  type: 'register' | 'unregister';
  feature: Feature;
};

/**
 * 功能注册事件回调函数类型
 */
export type FeatureRegistrationCallback = (event: FeatureRegistrationEvent) => void;

/**
 * 功能激活事件类型
 */
export type FeatureActivationEvent = {
  featureId: string;
  data?: any;
};

/**
 * 功能激活事件回调函数类型
 */
export type FeatureActivationCallback = (event: FeatureActivationEvent) => void;

/**
 * 功能注册服务类
 * 提供与功能注册和发现相关的API
 */
export class FeatureService {
  // 存储注册的功能
  private features: Map<string, Feature> = new Map();
  // 功能注册事件监听器
  private registrationListeners: Set<FeatureRegistrationCallback> = new Set();
  // 功能激活事件监听器
  private activationListeners: Set<FeatureActivationCallback> = new Set();

  /**
   * 注册单个功能
   * @param feature 功能定义
   * @returns 是否注册成功
   */
  registerFeature(feature: Feature): boolean {
    // 验证功能数据
    if (!this.validateFeature(feature)) {
      console.warn(`功能注册失败: 无效的功能数据`, feature);
      return false;
    }

    // 存储功能
    this.features.set(feature.id, feature);
    
    // 触发注册事件
    this.notifyRegistrationListeners({
      type: 'register',
      feature
    });
    
    console.log(`功能注册成功: ${feature.name} (${feature.id})`);
    return true;
  }

  /**
   * 注册多个功能
   * @param features 功能定义数组
   * @returns 成功注册的功能数量
   */
  registerFeatures(features: Feature[]): number {
    if (!Array.isArray(features)) {
      console.warn('注册多个功能失败: 参数不是数组');
      return 0;
    }

    let successCount = 0;
    
    // 过滤有效的功能并注册
    features.forEach(feature => {
      if (this.registerFeature(feature)) {
        successCount++;
      }
    });
    
    console.log(`批量注册功能完成: ${successCount}/${features.length} 个功能注册成功`);
    return successCount;
  }

  /**
   * 验证功能数据是否有效
   * @param feature 功能定义
   * @returns 是否有效
   */
  private validateFeature(feature: any): feature is Feature {
    // 检查必填字段
    if (!feature || 
        typeof feature !== 'object' || 
        !feature.id || 
        !feature.type || 
        !feature.name) {
      return false;
    }
    
    // 检查ID是否已存在
    if (this.features.has(feature.id)) {
      console.warn(`功能ID已存在: ${feature.id}`);
      return false;
    }
    
    return true;
  }

  /**
   * 取消注册功能
   * @param featureId 功能ID
   * @returns 是否成功取消注册
   */
  unregisterFeature(featureId: string): boolean {
    if (!this.features.has(featureId)) {
      console.warn(`取消注册功能失败: 功能ID不存在 ${featureId}`);
      return false;
    }
    
    const feature = this.features.get(featureId)!;
    this.features.delete(featureId);
    
    // 触发取消注册事件
    this.notifyRegistrationListeners({
      type: 'unregister',
      feature
    });
    
    console.log(`功能取消注册成功: ${feature.name} (${featureId})`);
    return true;
  }

  /**
   * 获取所有注册的功能
   * @returns 功能列表
   */
  getAllFeatures(): Feature[] {
    return Array.from(this.features.values())
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  /**
   * 根据类型获取功能列表
   * @param type 功能类型
   * @returns 功能列表
   */
  getFeaturesByType(type: string): Feature[] {
    return this.getAllFeatures().filter(feature => feature.type === type);
  }

  /**
   * 根据分组获取功能列表
   * @param group 功能分组
   * @returns 功能列表
   */
  getFeaturesByGroup(group: string): Feature[] {
    return this.getAllFeatures().filter(feature => feature.group === group);
  }

  /**
   * 根据ID获取功能
   * @param id 功能ID
   * @returns 功能定义
   */
  getFeatureById(id: string): Feature | undefined {
    return this.features.get(id);
  }

  /**
   * 激活功能
   * @param featureId 功能ID
   * @param data 可选的激活数据
   * @returns 是否成功激活
   */
  activateFeature(featureId: string, data?: any): boolean {
    const feature = this.features.get(featureId);
    if (!feature) {
      console.warn(`激活功能失败: 功能ID不存在 ${featureId}`);
      return false;
    }
    
    if (feature.disabled) {
      console.warn(`激活功能失败: 功能已禁用 ${featureId}`);
      return false;
    }
    
    // 调用功能处理函数
    if (typeof feature.handler === 'function') {
      try {
        feature.handler(data);
      } catch (error) {
        console.error(`功能处理函数执行出错: ${featureId}`, error);
      }
    }
    
    // 触发激活事件
    this.notifyActivationListeners({
      featureId,
      data
    });
    
    console.log(`功能激活成功: ${feature.name} (${featureId})`, data);
    return true;
  }

  /**
   * 设置功能启用状态
   * @param featureId 功能ID
   * @param enabled 是否启用
   * @returns 是否设置成功
   */
  setFeatureEnabled(featureId: string, enabled: boolean): boolean {
    const feature = this.features.get(featureId);
    if (!feature) {
      console.warn(`设置功能状态失败: 功能ID不存在 ${featureId}`);
      return false;
    }
    
    feature.disabled = !enabled;
    console.log(`功能状态已更新: ${feature.name} (${featureId}) 已${enabled ? '启用' : '禁用'}`);
    return true;
  }

  /**
   * 添加功能注册事件监听器
   * @param callback 回调函数
   */
  addRegistrationListener(callback: FeatureRegistrationCallback): void {
    this.registrationListeners.add(callback);
  }

  /**
   * 移除功能注册事件监听器
   * @param callback 回调函数
   */
  removeRegistrationListener(callback: FeatureRegistrationCallback): void {
    this.registrationListeners.delete(callback);
  }

  /**
   * 添加功能激活事件监听器
   * @param callback 回调函数
   */
  addActivationListener(callback: FeatureActivationCallback): void {
    this.activationListeners.add(callback);
  }

  /**
   * 移除功能激活事件监听器
   * @param callback 回调函数
   */
  removeActivationListener(callback: FeatureActivationCallback): void {
    this.activationListeners.delete(callback);
  }

  /**
   * 通知所有注册事件监听器
   * @param event 注册事件
   */
  private notifyRegistrationListeners(event: FeatureRegistrationEvent): void {
    this.registrationListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('功能注册事件监听器执行出错', error);
      }
    });
  }

  /**
   * 通知所有激活事件监听器
   * @param event 激活事件
   */
  private notifyActivationListeners(event: FeatureActivationEvent): void {
    this.activationListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('功能激活事件监听器执行出错', error);
      }
    });
  }
}

// 创建单例实例
export const featureService = new FeatureService();

export default featureService; 