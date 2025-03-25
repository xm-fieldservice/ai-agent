/**
 * 功能注册表 - 系统功能注册和发现机制
 * 用于管理各模块提供的功能，支持动态注册和权限控制
 */

import { EventEmitter } from './event-bus';

// 功能类型定义
export enum FeatureType {
  NOTES = 'notes',        // 笔记功能
  CHAT = 'chat',          // 聊天功能
  LLM = 'llm',            // LLM问答功能
  SETTINGS = 'settings',  // 设置功能
  SEARCH = 'search'       // 搜索功能
}

// 功能项接口定义
export interface Feature {
  id: string;             // 功能唯一标识
  type: FeatureType;      // 功能类型
  name: string;           // 功能名称
  description?: string;   // 功能描述
  icon?: string;          // 功能图标
  mobilePath?: string;    // 移动端路由路径
  pcPath?: string;        // PC端路由路径
  permissions?: string[]; // 所需权限
  disabled?: boolean;     // 是否禁用
  sortOrder?: number;     // 排序顺序
  handler?: Function;     // 功能处理函数
  meta?: Record<string, any>; // 其他元数据
}

// 功能注册事件类型
export enum FeatureRegistryEvent {
  FEATURE_REGISTERED = 'feature:registered',
  FEATURE_UPDATED = 'feature:updated',
  FEATURE_REMOVED = 'feature:removed'
}

/**
 * 功能注册表类
 * 管理系统中所有功能的注册、更新、移除和查询
 */
export class FeatureRegistry {
  private features: Map<string, Feature> = new Map();
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 注册新功能
   * @param feature 功能配置对象
   * @returns 是否注册成功
   */
  registerFeature(feature: Feature): boolean {
    // 验证功能配置
    if (!feature.id || !feature.type || !feature.name) {
      console.error('功能注册失败: 缺少必要字段', feature);
      return false;
    }

    // 检查ID是否已存在
    if (this.features.has(feature.id)) {
      console.warn(`功能ID '${feature.id}' 已存在，将被覆盖`);
    }

    // 存储功能配置
    this.features.set(feature.id, feature);

    // 触发注册事件
    this.eventEmitter.emit(FeatureRegistryEvent.FEATURE_REGISTERED, feature);
    
    console.log(`功能 '${feature.name}' (${feature.id}) 注册成功`);
    return true;
  }

  /**
   * 批量注册功能
   * @param features 功能配置对象数组
   * @returns 成功注册的功能数量
   */
  registerFeatures(features: Feature[]): number {
    let successCount = 0;
    
    features.forEach(feature => {
      if (this.registerFeature(feature)) {
        successCount++;
      }
    });
    
    return successCount;
  }

  /**
   * 更新已注册功能
   * @param id 功能ID
   * @param updates 更新内容
   * @returns 是否更新成功
   */
  updateFeature(id: string, updates: Partial<Feature>): boolean {
    if (!this.features.has(id)) {
      console.error(`更新失败: 未找到ID为 '${id}' 的功能`);
      return false;
    }

    const feature = this.features.get(id)!;
    const updatedFeature = { ...feature, ...updates };
    this.features.set(id, updatedFeature);

    // 触发更新事件
    this.eventEmitter.emit(FeatureRegistryEvent.FEATURE_UPDATED, updatedFeature);
    
    return true;
  }

  /**
   * 移除已注册功能
   * @param id 功能ID
   * @returns 是否移除成功
   */
  removeFeature(id: string): boolean {
    if (!this.features.has(id)) {
      return false;
    }

    const feature = this.features.get(id)!;
    this.features.delete(id);

    // 触发移除事件
    this.eventEmitter.emit(FeatureRegistryEvent.FEATURE_REMOVED, feature);
    
    return true;
  }

  /**
   * 获取功能配置
   * @param id 功能ID
   * @returns 功能配置对象或undefined
   */
  getFeature(id: string): Feature | undefined {
    return this.features.get(id);
  }

  /**
   * 获取指定类型的所有功能
   * @param type 功能类型
   * @returns 功能数组
   */
  getFeaturesByType(type: FeatureType): Feature[] {
    const result: Feature[] = [];
    
    this.features.forEach(feature => {
      if (feature.type === type) {
        result.push(feature);
      }
    });
    
    // 根据sortOrder排序
    return result.sort((a, b) => 
      (a.sortOrder || 999) - (b.sortOrder || 999)
    );
  }

  /**
   * 获取所有已注册功能
   * @returns 所有功能的数组
   */
  getAllFeatures(): Feature[] {
    return Array.from(this.features.values());
  }

  /**
   * 获取按类型分组的功能
   * @returns 按类型分组的功能对象
   */
  getFeaturesByGroup(): Record<string, Feature[]> {
    const result: Record<string, Feature[]> = {};
    
    this.features.forEach(feature => {
      const type = feature.type;
      if (!result[type]) {
        result[type] = [];
      }
      result[type].push(feature);
    });
    
    // 对每个组内的功能进行排序
    Object.keys(result).forEach(type => {
      result[type].sort((a, b) => 
        (a.sortOrder || 999) - (b.sortOrder || 999)
      );
    });
    
    return result;
  }

  /**
   * 是否存在指定ID的功能
   * @param id 功能ID
   * @returns 是否存在
   */
  hasFeature(id: string): boolean {
    return this.features.has(id);
  }

  /**
   * 启用功能
   * @param id 功能ID
   * @returns 是否成功
   */
  enableFeature(id: string): boolean {
    return this.updateFeature(id, { disabled: false });
  }

  /**
   * 禁用功能
   * @param id 功能ID
   * @returns 是否成功
   */
  disableFeature(id: string): boolean {
    return this.updateFeature(id, { disabled: true });
  }
}

// 导出默认实例
let featureRegistry: FeatureRegistry;

/**
 * 获取功能注册表实例
 * @param eventEmitter 事件总线实例
 * @returns 功能注册表实例
 */
export function getFeatureRegistry(eventEmitter?: EventEmitter): FeatureRegistry {
  if (!featureRegistry && eventEmitter) {
    featureRegistry = new FeatureRegistry(eventEmitter);
  } else if (!featureRegistry) {
    throw new Error('功能注册表尚未初始化，请提供事件总线实例');
  }
  
  return featureRegistry;
} 