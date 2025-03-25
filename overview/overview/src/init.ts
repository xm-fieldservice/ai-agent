/**
 * 系统初始化模块
 * 负责初始化各个功能模块
 */

import { registerDefaultFeatures } from './features/default-features';
import { featuresApi } from './api/features-api';
import eventBus from './core/event-bus';

/**
 * 系统初始化函数
 * @param options 初始化选项
 */
export async function initializeSystem(options: {
  enabledModules?: string[];
  config?: Record<string, any>;
} = {}): Promise<void> {
  console.info('开始初始化AI助手系统...');

  try {
    // 注册默认功能
    registerDefaultFeatures();
    console.info('默认功能注册完成');

    // 初始化配置
    if (options.config) {
      console.info('应用自定义配置');
      // 这里可以添加配置处理逻辑
    }

    // 发布系统初始化事件
    eventBus.publish('system:initialized', {
      timestamp: Date.now(),
      enabledModules: options.enabledModules || ['all']
    });

    console.info('AI助手系统初始化完成');
  } catch (error) {
    console.error('系统初始化失败:', error);
    throw error;
  }
}

/**
 * 注册外部模块
 * @param moduleName 模块名称
 * @param features 模块提供的功能
 */
export function registerExternalModule(
  moduleName: string,
  features: any[]
): void {
  console.info(`注册外部模块: ${moduleName}`);
  
  // 注册模块提供的功能
  if (features && features.length > 0) {
    featuresApi.registerFeatures(features);
  }
  
  // 发布模块注册事件
  eventBus.publish('system:module:registered', {
    moduleName,
    timestamp: Date.now()
  });
}

/**
 * 导出系统API
 */
export const systemApi = {
  initialize: initializeSystem,
  registerModule: registerExternalModule,
  features: featuresApi,
  events: eventBus
};

export default systemApi; 