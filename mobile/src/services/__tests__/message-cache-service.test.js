import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MessageCacheService } from '../message-cache-service';
// 确保测试环境标志
process.env.NODE_ENV = 'test';
// 测试调试辅助函数
function testDebug(...args) {
    console.log('[TEST-DEBUG]', ...args);
}
// 先定义所有模拟
vi.mock('../storage-service');
vi.mock('../network-service');
vi.mock('../conflict-resolution-service');
// 模拟 window 方法
vi.stubGlobal('setInterval', vi.fn().mockReturnValue(123));
vi.stubGlobal('clearInterval', vi.fn());
// 导入实际模块，这样我们可以访问模拟实例
import { StorageService } from '../storage-service';
import { NetworkService } from '../network-service';
import { ConflictResolutionService } from '../conflict-resolution-service';
// 设置模拟对象
const mockStorageServiceObj = {
    addMessage: vi.fn().mockResolvedValue(true),
    getMessagesByFeaturePaginated: vi.fn().mockResolvedValue([]),
    updateMessage: vi.fn().mockResolvedValue(true),
    getPendingMessages: vi.fn().mockResolvedValue([]),
    syncMessages: vi.fn().mockResolvedValue({ success: 0, failed: 0 }),
    cleanupOldData: vi.fn().mockResolvedValue(0),
    getMessage: vi.fn().mockResolvedValue(undefined),
    deleteMessage: vi.fn().mockResolvedValue(undefined),
    saveConversation: vi.fn().mockResolvedValue('conv-id'),
    getConversation: vi.fn().mockResolvedValue(undefined),
    getConversationsByFeature: vi.fn().mockResolvedValue([]),
    deleteConversation: vi.fn().mockResolvedValue(undefined),
    saveSetting: vi.fn().mockResolvedValue(undefined),
    getSetting: vi.fn().mockResolvedValue(null)
};
const mockNetworkStatus = { value: 'online' };
const mockNetworkServiceObj = {
    getNetworkStatus: vi.fn().mockReturnValue(mockNetworkStatus),
    request: vi.fn().mockResolvedValue({ data: {} }),
    RequestPriority: {
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low'
    }
};
const mockConflictServiceObj = {
    getConflictStatus: vi.fn().mockReturnValue({ pendingCount: { value: 0 }, isResolving: { value: false } }),
    detectConflicts: vi.fn().mockResolvedValue({ detected: 0, resolved: 0, failed: 0, manual: 0 }),
    resolveConflict: vi.fn().mockResolvedValue(true),
    autoResolveAllConflicts: vi.fn().mockResolvedValue({ resolved: 0, failed: 0, manual: 0 })
};
describe('MessageCacheService', () => {
    beforeEach(() => {
        testDebug('======== beforeEach called ========');
        // 重置所有模拟
        vi.clearAllMocks();
        // 重置单例
        MessageCacheService.resetInstance();
        // 再次明确设置模拟实现
        vi.mocked(StorageService.getInstance).mockReturnValue(mockStorageServiceObj);
        vi.mocked(NetworkService.getInstance).mockReturnValue(mockNetworkServiceObj);
        vi.mocked(ConflictResolutionService.getInstance).mockReturnValue(mockConflictServiceObj);
        testDebug('Setting up mock services:');
        testDebug('StorageService.getInstance() =', StorageService.getInstance());
        testDebug('NetworkService.getInstance() =', NetworkService.getInstance());
        testDebug('ConflictService.getInstance() =', ConflictResolutionService.getInstance());
        // 重置网络状态
        mockNetworkStatus.value = 'online';
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe('Singleton behavior', () => {
        it('应该返回相同的实例', () => {
            testDebug('Test: 应该返回相同的实例');
            const instance1 = MessageCacheService.getInstance();
            const instance2 = MessageCacheService.getInstance();
            expect(instance1).toBe(instance2);
        });
        it('应该提供测试专用实例', () => {
            testDebug('Test: 应该提供测试专用实例');
            const testInstance = MessageCacheService.getTestInstance();
            testDebug('Got test instance');
            expect(testInstance).toBeDefined();
            expect(testInstance).not.toBe(MessageCacheService.getInstance());
            // 验证服务引用
            testDebug('验证服务引用:');
            // @ts-ignore - 访问私有属性进行测试
            testDebug('storageService =', testInstance.storageService);
            // @ts-ignore
            testDebug('networkService =', testInstance.networkService);
            // @ts-ignore
            testDebug('conflictService =', testInstance.conflictService);
        });
    });
    describe('消息缓存 - 简化测试集', () => {
        it('应该能添加消息到本地存储 (带服务手动初始化)', async () => {
            testDebug('Test: 应该能添加消息到本地存储');
            const testInstance = MessageCacheService.getTestInstance();
            // 手动初始化内部服务
            testDebug('手动初始化服务:');
            // @ts-ignore - 访问并直接设置私有属性
            testInstance.storageService = mockStorageServiceObj;
            // @ts-ignore 
            testInstance.networkService = mockNetworkServiceObj;
            // @ts-ignore
            testInstance.conflictService = mockConflictServiceObj;
            testDebug('检查服务是否已初始化:');
            // @ts-ignore
            testDebug('storageService =', testInstance.storageService === mockStorageServiceObj);
            // @ts-ignore
            testDebug('networkService =', testInstance.networkService === mockNetworkServiceObj);
            // @ts-ignore
            testDebug('conflictService =', testInstance.conflictService === mockConflictServiceObj);
            const message = {
                content: '测试消息',
                featureId: 'test',
                type: 'text',
                source: 'mobile',
                status: 'pending',
                conversationId: 'session1',
                timestamp: Date.now()
            };
            await testInstance.addMessage(message);
            expect(mockStorageServiceObj.addMessage).toHaveBeenCalled();
        });
    });
});
