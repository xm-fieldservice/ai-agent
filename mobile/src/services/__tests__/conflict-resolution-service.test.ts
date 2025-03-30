import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConflictResolutionService, Conflict, ConflictType, ConflictResolutionStrategy } from '../conflict-resolution-service';
import { StorageService, Message, Conversation } from '../storage-service';
import { NetworkService } from '../network-service';

// 模拟依赖服务
vi.mock('../storage-service', () => {
  const mockStorageService = {
    getInstance: vi.fn(),
    getSetting: vi.fn().mockImplementation((key) => {
      if (key === 'pendingConflicts') return Promise.resolve([]);
      if (key === 'defaultConflictStrategy') return Promise.resolve(null);
      return Promise.resolve(null);
    }),
    saveSetting: vi.fn().mockResolvedValue(undefined),
    addMessage: vi.fn().mockImplementation((message) => Promise.resolve(message.id)),
    updateMessage: vi.fn().mockResolvedValue(undefined),
    deleteMessage: vi.fn().mockResolvedValue(undefined),
    getMessage: vi.fn().mockResolvedValue(null),
    saveConversation: vi.fn().mockImplementation((conversation) => Promise.resolve(conversation.id)),
    getConversation: vi.fn().mockResolvedValue(null),
    deleteConversation: vi.fn().mockResolvedValue(undefined)
  };

  return {
    StorageService: {
      getInstance: vi.fn().mockReturnValue(mockStorageService)
    },
    storageService: mockStorageService
  };
});

vi.mock('../network-service', () => {
  const mockNetworkService = {
    getInstance: vi.fn(),
    request: vi.fn().mockResolvedValue({ success: true })
  };

  return {
    NetworkService: {
      getInstance: vi.fn().mockReturnValue(mockNetworkService)
    },
    RequestPriority: {
      HIGH: 0,
      MEDIUM: 1,
      LOW: 2
    }
  };
});

describe('ConflictResolutionService', () => {
  let conflictResolutionService: ConflictResolutionService;
  let mockStorageService: any;
  let mockNetworkService: any;
  
  beforeEach(() => {
    // 清除模拟
    vi.clearAllMocks();
    
    // 重置单例
    (ConflictResolutionService as any).instance = null;
    
    // 获取模拟的服务
    mockStorageService = StorageService.getInstance();
    mockNetworkService = NetworkService.getInstance();
    
    // 创建服务实例
    conflictResolutionService = ConflictResolutionService.getInstance();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('单例模式', () => {
    it('应该返回相同的实例', () => {
      const instance1 = ConflictResolutionService.getInstance();
      const instance2 = ConflictResolutionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('冲突管理', () => {
    it('应该成功添加冲突', async () => {
      const conflict: Omit<Conflict<Message>, 'timestamp' | 'resolved'> = {
        id: 'test-conflict',
        type: ConflictType.MESSAGE_CONTENT,
        clientVersion: { id: 'msg1', content: 'client version', featureId: 'test', timestamp: 100 } as Message,
        serverVersion: { id: 'msg1', content: 'server version', featureId: 'test', timestamp: 200 } as Message
      };
      
      await conflictResolutionService.addConflict(conflict);
      
      // 验证冲突被保存
      expect(mockStorageService.saveSetting).toHaveBeenCalled();
      
      // 检查冲突列表
      const pendingConflicts = conflictResolutionService.getPendingConflicts();
      expect(pendingConflicts.length).toBeGreaterThan(0);
      expect(pendingConflicts[0].id).toBe('test-conflict');
    });
    
    it('应该根据类型获取冲突', async () => {
      // 添加不同类型的冲突
      await conflictResolutionService.addConflict({
        id: 'conflict1',
        type: ConflictType.MESSAGE_CONTENT,
        clientVersion: {} as Message,
        serverVersion: {} as Message
      });
      
      await conflictResolutionService.addConflict({
        id: 'conflict2',
        type: ConflictType.CONVERSATION_DATA,
        clientVersion: {} as Conversation,
        serverVersion: {} as Conversation
      });
      
      // 检索特定类型的冲突
      const messageConflicts = conflictResolutionService.getPendingConflicts(ConflictType.MESSAGE_CONTENT);
      expect(messageConflicts.length).toBe(1);
      expect(messageConflicts[0].id).toBe('conflict1');
      
      const conversationConflicts = conflictResolutionService.getPendingConflicts(ConflictType.CONVERSATION_DATA);
      expect(conversationConflicts.length).toBe(1);
      expect(conversationConflicts[0].id).toBe('conflict2');
    });
  });
  
  describe('冲突解决策略', () => {
    it('应该设置默认解决策略', async () => {
      await conflictResolutionService.setDefaultStrategy(ConflictResolutionStrategy.CLIENT_WINS);
      
      expect(mockStorageService.saveSetting).toHaveBeenCalledWith(
        'defaultConflictStrategy', 
        ConflictResolutionStrategy.CLIENT_WINS
      );
      
      // 检查冲突状态
      const status = conflictResolutionService.getConflictStatus();
      expect(status.defaultStrategy.value).toBe(ConflictResolutionStrategy.CLIENT_WINS);
    });
    
    it('应该能解决消息冲突（客户端优先）', async () => {
      // 模拟本地消息
      const localMessage: Message = {
        id: 'msg1',
        featureId: 'test',
        content: 'local content',
        type: 'text',
        source: 'mobile',
        status: 'sent',
        timestamp: 200
      } as Message;
      
      // 模拟服务器消息
      const serverMessage: Message = {
        id: 'msg1',
        featureId: 'test',
        content: 'server content',
        type: 'text',
        source: 'server',
        status: 'received',
        timestamp: 100
      } as Message;
      
      // 添加冲突
      await conflictResolutionService.addConflict({
        id: 'msg1',
        type: ConflictType.MESSAGE_CONTENT,
        clientVersion: localMessage,
        serverVersion: serverMessage
      });
      
      // 设置客户端优先策略
      await conflictResolutionService.setDefaultStrategy(ConflictResolutionStrategy.CLIENT_WINS);
      
      // 获取冲突
      const pendingConflicts = conflictResolutionService.getPendingConflicts();
      const conflictId = pendingConflicts[0].id;
      
      // 解决冲突
      await conflictResolutionService.resolveConflict(conflictId);
      
      // 验证：客户端优先 = 更新服务器数据
      expect(mockNetworkService.request).toHaveBeenCalledWith(expect.objectContaining({
        url: `/api/messages/${conflictId}`,
        method: 'PUT',
        data: localMessage
      }));
      
      // 检查冲突已标记为已解决
      const resolvedConflicts = conflictResolutionService.getPendingConflicts();
      expect(resolvedConflicts.length).toBe(0); // 应该没有未解决的冲突
    });
    
    it('应该能解决会话冲突（服务器优先）', async () => {
      // 模拟本地会话
      const localConversation: Conversation = {
        id: 'conv1',
        title: 'local title',
        timestamp: 200,
        featureId: 'test'
      };
      
      // 模拟服务器会话
      const serverConversation: Conversation = {
        id: 'conv1',
        title: 'server title',
        timestamp: 300,
        featureId: 'test'
      };
      
      // 添加冲突
      await conflictResolutionService.addConflict({
        id: 'conv1',
        type: ConflictType.CONVERSATION_DATA,
        clientVersion: localConversation,
        serverVersion: serverConversation
      });
      
      // 设置服务器优先策略
      await conflictResolutionService.setDefaultStrategy(ConflictResolutionStrategy.SERVER_WINS);
      
      // 获取冲突
      const pendingConflicts = conflictResolutionService.getPendingConflicts();
      const conflictId = pendingConflicts[0].id;
      
      // 解决冲突
      await conflictResolutionService.resolveConflict(conflictId);
      
      // 验证：服务器优先 = 更新本地数据
      expect(mockStorageService.saveConversation).toHaveBeenCalledWith(serverConversation);
    });
  });
  
  describe('自动冲突检测', () => {
    it('应该检测消息冲突', async () => {
      // 模拟本地和服务器消息
      const localMessage = { id: 'msg1', content: 'local', status: 'sent', featureId: 'test' } as Message;
      const serverMessage = { id: 'msg1', content: 'server', status: 'received', featureId: 'test' } as Message;
      
      // 模拟服务器响应
      (mockNetworkService.request as any).mockResolvedValueOnce({
        msg1: serverMessage
      });
      
      // 模拟本地数据获取
      (mockStorageService.getMessage as any).mockResolvedValueOnce(localMessage);
      
      // 检测冲突
      const result = await conflictResolutionService.detectConflicts({
        messageIds: ['msg1'],
        autoResolve: false
      });
      
      // 验证结果
      expect(result.detected).toBe(1);
      expect(mockNetworkService.request).toHaveBeenCalledWith(expect.objectContaining({
        url: '/api/messages/batch',
        method: 'POST',
        data: { ids: ['msg1'] }
      }));
      
      // 检查冲突是否被添加
      const pendingConflicts = conflictResolutionService.getPendingConflicts();
      expect(pendingConflicts.length).toBe(1);
      expect(pendingConflicts[0].type).toBe(ConflictType.MESSAGE_CONTENT);
    });
  });
  
  describe('自动冲突解决', () => {
    it('应该自动解决所有冲突', async () => {
      // 添加两个冲突
      await conflictResolutionService.addConflict({
        id: 'conflict1',
        type: ConflictType.MESSAGE_CONTENT,
        clientVersion: { id: 'msg1' } as Message,
        serverVersion: { id: 'msg1' } as Message
      });
      
      await conflictResolutionService.addConflict({
        id: 'conflict2',
        type: ConflictType.CONVERSATION_DATA,
        clientVersion: { id: 'conv1' } as Conversation,
        serverVersion: { id: 'conv1' } as Conversation
      });
      
      // 设置时间戳优先策略
      await conflictResolutionService.setDefaultStrategy(ConflictResolutionStrategy.TIMESTAMP_WINS);
      
      // 自动解决所有冲突
      const result = await conflictResolutionService.autoResolveAllConflicts();
      
      // 验证结果
      expect(result.resolved).toBe(2);
      expect(result.failed).toBe(0);
      
      // 检查冲突列表应该为空
      const pendingConflicts = conflictResolutionService.getPendingConflicts();
      expect(pendingConflicts.length).toBe(0);
    });
  });
}); 