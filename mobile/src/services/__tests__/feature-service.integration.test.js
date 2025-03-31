/**
 * Feature Service 集成测试
 * 测试与Overview模块的集成
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { featureService } from '../feature-service';
// 模拟Overview模块
vi.mock('../../../../overview/src', () => {
    const mockFeatures = [
        {
            id: 'feature-1',
            name: '功能1',
            type: 'test',
            icon: 'test-icon',
            description: '测试功能1',
            order: 1,
            disabled: false
        },
        {
            id: 'feature-2',
            name: '功能2',
            type: 'test',
            icon: 'test-icon',
            description: '测试功能2',
            order: 2,
            disabled: true
        }
    ];
    // 事件监听器
    const listeners = {};
    return {
        featuresApi: {
            getVisibleFeatures: vi.fn().mockResolvedValue(mockFeatures),
            getFeaturesByType: vi.fn().mockReturnValue(mockFeatures.filter(f => f.type === 'test')),
            getFeature: vi.fn().mockImplementation((id) => mockFeatures.find(f => f.id === id))
        },
        FeatureType: {
            NOTE: 'note',
            CHAT: 'chat',
            LLM: 'llm',
            TEST: 'test'
        },
        FeatureEvents: {
            FEATURES_CHANGED: 'features:changed',
            FEATURE_SELECTED: 'features:selected'
        },
        eventBus: {
            subscribe: vi.fn().mockImplementation((event, callback) => {
                if (!listeners[event]) {
                    listeners[event] = [];
                }
                listeners[event].push(callback);
                return () => {
                    listeners[event] = listeners[event].filter(cb => cb !== callback);
                };
            }),
            publish: vi.fn().mockImplementation((event, data) => {
                if (listeners[event]) {
                    listeners[event].forEach(callback => callback(data));
                }
                // 特殊处理功能消息事件
                if (event.startsWith('feature:') && event.endsWith(':message')) {
                    const featureId = event.split(':')[1];
                    setTimeout(() => {
                        if (listeners[`feature:${featureId}:response`]) {
                            listeners[`feature:${featureId}:response`].forEach(callback => {
                                callback({
                                    id: Date.now().toString(),
                                    content: '响应内容',
                                    featureId
                                });
                            });
                        }
                    }, 100);
                }
            })
        }
    };
});
describe('Feature Service 集成测试', () => {
    // 每个测试前重置服务状态
    beforeEach(async () => {
        vi.clearAllMocks();
        // @ts-ignore - 重置私有属性
        featureService.isInitialized = false;
        // @ts-ignore - 重置私有属性
        featureService.features = [];
        // @ts-ignore - 重置私有属性
        featureService.listeners = [];
    });
    // 每个测试后清理
    afterEach(() => {
        vi.resetAllMocks();
    });
    it('应该成功初始化并加载功能列表', async () => {
        // 执行初始化
        await featureService.initialize();
        // 验证调用了Overview的API
        const { featuresApi } = await import('../../../../overview/src');
        expect(featuresApi.getVisibleFeatures).toHaveBeenCalledTimes(1);
        // 验证功能已经加载
        const features = featureService.getFeatures();
        expect(features).toHaveLength(2);
        expect(features[0].id).toBe('feature-1');
        expect(features[1].id).toBe('feature-2');
    });
    it('应该监听功能变化事件', async () => {
        // 准备一个监听器
        const listener = vi.fn();
        featureService.addListener(listener);
        // 初始化服务
        await featureService.initialize();
        // 验证监听器被调用
        expect(listener).toHaveBeenCalledTimes(1);
        // 触发功能变化事件
        const { eventBus, FeatureEvents } = await import('../../../../overview/src');
        eventBus.publish(FeatureEvents.FEATURES_CHANGED, [
            {
                id: 'feature-3',
                name: '功能3',
                type: 'test',
                icon: 'test-icon',
                description: '测试功能3',
                order: 3,
                disabled: false
            }
        ]);
        // 验证监听器再次被调用，并且功能列表已更新
        expect(listener).toHaveBeenCalledTimes(2);
        const features = featureService.getFeatures();
        expect(features).toHaveLength(1);
        expect(features[0].id).toBe('feature-3');
    });
    it('应该能够发送功能消息并接收响应', async () => {
        // 初始化服务
        await featureService.initialize();
        // 发送消息并等待响应
        const response = await featureService.sendFeatureMessage('feature-1', '测试消息');
        // 验证消息已发送
        const { eventBus } = await import('../../../../overview/src');
        expect(eventBus.publish).toHaveBeenCalledWith('feature:feature-1:message', expect.objectContaining({
            featureId: 'feature-1',
            content: '测试消息'
        }));
        // 验证接收到响应
        expect(response).toEqual(expect.objectContaining({
            content: '响应内容',
            featureId: 'feature-1'
        }));
    });
    it('应该在功能不存在时抛出错误', async () => {
        // 初始化服务
        await featureService.initialize();
        // 尝试发送消息到不存在的功能
        await expect(featureService.sendFeatureMessage('non-existent', '测试消息')).rejects.toThrow('功能[non-existent]不存在');
    });
    it('应该能够添加和移除监听器', async () => {
        // 初始化服务
        await featureService.initialize();
        // 添加监听器
        const listener = vi.fn();
        featureService.addListener(listener);
        // 触发功能变化
        const { eventBus, FeatureEvents } = await import('../../../../overview/src');
        eventBus.publish(FeatureEvents.FEATURES_CHANGED, [
            {
                id: 'feature-3',
                name: '功能3',
                type: 'test',
                icon: 'test-icon',
                description: '测试功能3',
                order: 3,
                disabled: false
            }
        ]);
        // 验证监听器被调用
        expect(listener).toHaveBeenCalledTimes(1);
        // 移除监听器
        featureService.removeListener(listener);
        // 再次触发功能变化
        eventBus.publish(FeatureEvents.FEATURES_CHANGED, [
            {
                id: 'feature-4',
                name: '功能4',
                type: 'test',
                icon: 'test-icon',
                description: '测试功能4',
                order: 4,
                disabled: false
            }
        ]);
        // 验证监听器不再被调用
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
