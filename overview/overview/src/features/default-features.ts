/**
 * 默认功能注册模块
 * 定义系统默认功能项
 */

import { Feature, FeatureType, featureRegistry } from './registry';

// 默认功能列表
const defaultFeatures: Feature[] = [
  {
    id: 'note',
    type: FeatureType.NOTE,
    name: '笔记',
    description: '创建和管理笔记',
    icon: 'note-icon', // 实际应使用正确的图标资源
    order: 1,
    component: 'NoteComponent'
  },
  {
    id: 'chat',
    type: FeatureType.CHAT,
    name: '聊天',
    description: '与AI助手对话',
    icon: 'chat-icon', // 实际应使用正确的图标资源
    order: 2,
    component: 'ChatComponent'
  },
  {
    id: 'llm',
    type: FeatureType.LLM,
    name: 'LLM问答',
    description: '专业知识问答',
    icon: 'llm-icon', // 实际应使用正确的图标资源
    order: 3,
    component: 'LLMComponent'
  },
  {
    id: 'settings',
    type: FeatureType.SETTINGS,
    name: '设置',
    description: '应用设置和首选项',
    icon: 'settings-icon', // 实际应使用正确的图标资源
    order: 100, // 放在末尾
    component: 'SettingsComponent',
    visible: false // 默认不在主界面显示
  }
];

/**
 * 注册默认功能
 */
export function registerDefaultFeatures(): void {
  featureRegistry.registerBatch(defaultFeatures);
  console.info('已注册默认功能模块');
}

/**
 * 获取特定类型的默认功能
 * @param type 功能类型
 * @returns 功能列表
 */
export function getDefaultFeaturesByType(type: FeatureType): Feature[] {
  return defaultFeatures.filter(feature => feature.type === type);
}

/**
 * 获取所有默认功能
 * @returns 默认功能列表
 */
export function getAllDefaultFeatures(): Feature[] {
  return [...defaultFeatures];
}

export default defaultFeatures; 