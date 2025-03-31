import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StorageService } from '../storage-service';
// 不使用复杂的模拟，而是直接模拟服务的方法
describe('StorageService', () => {
    let storageService;
    beforeEach(() => {
        // 重置单例
        StorageService.instance = null;
        // 创建服务实例
        storageService = StorageService.getInstance();
        // 模拟核心方法
        vi.spyOn(storageService, 'getDB').mockImplementation(() => {
            return {
                put: vi.fn().mockResolvedValue('mockId'),
                get: vi.fn().mockResolvedValue(null),
                getAll: vi.fn().mockResolvedValue([]),
                getAllFromIndex: vi.fn().mockResolvedValue([]),
                delete: vi.fn().mockResolvedValue(undefined),
                transaction: vi.fn().mockReturnValue({
                    store: {
                        put: vi.fn().mockResolvedValue(undefined),
                        get: vi.fn().mockResolvedValue(null),
                        getAll: vi.fn().mockResolvedValue([]),
                        getAllFromIndex: vi.fn().mockResolvedValue([]),
                        delete: vi.fn().mockResolvedValue(undefined),
                        clear: vi.fn().mockResolvedValue(undefined),
                        index: vi.fn().mockReturnValue({
                            openCursor: vi.fn().mockResolvedValue(null),
                            getAll: vi.fn().mockResolvedValue([])
                        })
                    },
                    done: Promise.resolve()
                })
            };
        });
    });
    afterEach(() => {
        vi.clearAllMocks();
    });
    describe('单例模式', () => {
        it('应该返回相同的实例', () => {
            const instance1 = StorageService.getInstance();
            const instance2 = StorageService.getInstance();
            expect(instance1).toBe(instance2);
        });
    });
    describe('消息存储', () => {
        it('应该实现添加消息方法', async () => {
            expect(typeof storageService.addMessage).toBe('function');
        });
        it('应该实现更新消息方法', async () => {
            expect(typeof storageService.updateMessage).toBe('function');
        });
        it('应该实现获取消息方法', async () => {
            expect(typeof storageService.getMessage).toBe('function');
            expect(typeof storageService.getMessagesByFeaturePaginated).toBe('function');
        });
    });
    describe('会话管理', () => {
        it('应该实现保存会话方法', async () => {
            expect(typeof storageService.saveConversation).toBe('function');
        });
        it('应该实现获取会话方法', async () => {
            expect(typeof storageService.getConversation).toBe('function');
            expect(typeof storageService.getConversationsByFeature).toBe('function');
        });
        it('应该实现删除会话方法', async () => {
            expect(typeof storageService.deleteConversation).toBe('function');
        });
    });
    describe('功能访问记录', () => {
        it('应该实现更新功能访问记录方法', async () => {
            expect(typeof storageService.updateFeatureAccess).toBe('function');
        });
        it('应该实现获取最近功能方法', async () => {
            expect(typeof storageService.getRecentFeatures).toBe('function');
        });
    });
    describe('数据操作', () => {
        it('应该实现同步消息方法', async () => {
            expect(typeof storageService.syncMessages).toBe('function');
        });
        it('应该实现数据导出方法', async () => {
            expect(typeof storageService.exportData).toBe('function');
        });
        it('应该实现数据导入方法', async () => {
            expect(typeof storageService.importData).toBe('function');
        });
    });
});
