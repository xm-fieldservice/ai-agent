/**
 * 功能API服务
 * 暴露功能注册表给其他模块使用
 */

import { Feature, FeatureType, featureRegistry } from '../features/registry';
import eventBus from '../core/event-bus';

// 功能相关事件名称常量
export const FeatureEvents = {
  FEATURES_CHANGED: 'features:changed',
  FEATURE_SELECTED: 'features:selected',
  FEATURE_ACTION: 'features:action'
};

/**
 * 功能API服务类
 * 提供功能注册和访问的接口
 */
class FeaturesApiService {
  /**
   * 注册新功能
   * @param feature 功能定义
   * @returns 是否注册成功
   */
  registerFeature(feature: Feature): boolean {
    const result = featureRegistry.register(feature);
    if (result) {
      eventBus.publish(FeatureEvents.FEATURES_CHANGED, this.getAllFeatures());
    }
    return result;
  }

  /**
   * 批量注册功能
   * @param features 功能列表
   */
  registerFeatures(features: Feature[]): void {
    featureRegistry.registerBatch(features);
    eventBus.publish(FeatureEvents.FEATURES_CHANGED, this.getAllFeatures());
  }

  /**
   * 更新功能
   * @param id 功能ID
   * @param updates 更新内容
   * @returns 是否更新成功
   */
  updateFeature(id: string, updates: Partial<Feature>): boolean {
    const result = featureRegistry.update(id, updates);
    if (result) {
      eventBus.publish(FeatureEvents.FEATURES_CHANGED, this.getAllFeatures());
    }
    return result;
  }

  /**
   * 删除功能
   * @param id 功能ID
   * @returns 是否删除成功
   */
  unregisterFeature(id: string): boolean {
    const result = featureRegistry.unregister(id);
    if (result) {
      eventBus.publish(FeatureEvents.FEATURES_CHANGED, this.getAllFeatures());
    }
    return result;
  }

  /**
   * 设置功能可见性
   * @param id 功能ID
   * @param visible 是否可见
   * @returns 是否设置成功
   */
  setFeatureVisibility(id: string, visible: boolean): boolean {
    return this.updateFeature(id, { visible });
  }

  /**
   * 设置功能禁用状态
   * @param id 功能ID
   * @param disabled 是否禁用
   * @returns 是否设置成功
   */
  setFeatureDisabled(id: string, disabled: boolean): boolean {
    return this.updateFeature(id, { disabled });
  }

  /**
   * 获取所有功能
   * @returns 功能列表
   */
  getAllFeatures(): Feature[] {
    return featureRegistry.getAllFeatures();
  }

  /**
   * 获取指定类型的功能
   * @param type 功能类型
   * @returns 功能列表
   */
  getFeaturesByType(type: FeatureType): Feature[] {
    return featureRegistry.getFeaturesByType(type);
  }

  /**
   * 获取可见的功能
   * @returns 可见功能列表
   */
  getVisibleFeatures(): Feature[] {
    return featureRegistry.getVisibleFeatures();
  }

  /**
   * 根据ID获取功能
   * @param id 功能ID
   * @returns 功能定义或undefined
   */
  getFeature(id: string): Feature | undefined {
    return featureRegistry.getFeature(id);
  }

  /**
   * 选择功能
   * @param id 功能ID
   */
  selectFeature(id: string): void {
    const feature = this.getFeature(id);
    if (feature) {
      eventBus.publish(FeatureEvents.FEATURE_SELECTED, feature);
    }
  }

  /**
   * 执行功能操作
   * @param id 功能ID
   * @param action 操作名称
   * @param payload 操作参数
   */
  performFeatureAction(id: string, action: string, payload?: any): void {
    const feature = this.getFeature(id);
    if (feature) {
      eventBus.publish(FeatureEvents.FEATURE_ACTION, {
        feature,
        action,
        payload
      });
    }
  }

  /**
   * 监听功能变化
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  onFeaturesChanged(callback: (features: Feature[]) => void): () => void {
    return eventBus.subscribe(FeatureEvents.FEATURES_CHANGED, callback);
  }

  /**
   * 监听功能选择
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  onFeatureSelected(callback: (feature: Feature) => void): () => void {
    return eventBus.subscribe(FeatureEvents.FEATURE_SELECTED, callback);
  }

  /**
   * 监听功能操作
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  onFeatureAction(callback: (data: { feature: Feature; action: string; payload?: any }) => void): () => void {
    return eventBus.subscribe(FeatureEvents.FEATURE_ACTION, callback);
  }
}

// 创建单例实例
export const featuresApi = new FeaturesApiService();

// 默认导出
export default featuresApi; 