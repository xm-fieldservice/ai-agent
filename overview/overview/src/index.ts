/**
 * AI助手系统Overview模块
 * 系统集成与协调中心
 */

// 导出核心API
export { systemApi, initializeSystem, registerExternalModule } from './init';
export { eventBus } from './core/event-bus';
export { featuresApi, FeatureEvents } from './api/features-api';
export { 
  featureRegistry,
  FeatureType, 
  type Feature 
} from './features/registry';
export { 
  registerDefaultFeatures,
  getDefaultFeaturesByType,
  getAllDefaultFeatures
} from './features/default-features';

// 系统核心常量
export const SYSTEM_VERSION = '1.0.0';
export const SYSTEM_NAME = 'AI助手系统';

// 系统事件常量
export const SystemEvents = {
  INITIALIZED: 'system:initialized',
  MODULE_REGISTERED: 'system:module:registered',
  CONFIG_CHANGED: 'system:config:changed',
  ERROR: 'system:error'
};

/**
 * 系统模块信息
 */
export const SystemInfo = {
  name: SYSTEM_NAME,
  version: SYSTEM_VERSION,
  modules: [
    { name: 'overview', description: '系统核心模块' },
    { name: 'mobile', description: '移动端界面模块', optional: false },
    { name: 'pc', description: '桌面端界面模块', optional: true },
    { name: 'llm', description: '大语言模型模块', optional: false },
    { name: 'data', description: '数据存储模块', optional: false }
  ]
};

/**
 * 获取系统信息
 * @returns 系统信息对象
 */
export function getSystemInfo() {
  return { ...SystemInfo };
}

// 默认导出
export default {
  name: SYSTEM_NAME,
  version: SYSTEM_VERSION,
  api: { 
    system: systemApi,
    features: featuresApi,
    events: eventBus
  },
  info: getSystemInfo
}; 