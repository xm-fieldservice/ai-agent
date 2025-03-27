import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ref } from 'vue';
import { NetworkService, RequestPriority } from './network-service'

// 数据库版本
const DB_VERSION = 1;
const DB_NAME = 'mobile_app_db';

// 定义数据库模式
interface MobileAppDB extends DBSchema {
  messages: {
    key: string;
    value: Message;
    indexes: {
      'by-feature': string;
      'by-timestamp': number;
      'by-status': string;
    };
  };
  conversations: {
    key: string;
    value: Conversation;
    indexes: {
      'by-timestamp': number;
    };
  };
  featureAccess: {
    key: string;
    value: FeatureAccess;
    indexes: {
      'by-lastAccess': number;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

// 消息类型定义
export interface Message {
  id: string;
  featureId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  source: 'mobile' | 'server';
  status: 'pending' | 'sent' | 'received' | 'failed';
  timestamp: number; // Unix 时间戳（毫秒）
  error?: string;
  media?: {
    url: string;
    thumbnailUrl?: string;
    type?: string;
    width?: number;
    height?: number;
  };
  file?: {
    name: string;
    size: number;
    url: string;
  };
  conversationId?: string; // 新增会话ID关联
  synced?: boolean; // 标记是否已同步到服务器
}

// 会话类型
export interface Conversation {
  id: string;
  title: string;
  timestamp: number; // 创建或最后更新时间
  lastMessage?: string;
  lastMessageTimestamp?: number;
  featureId: string;
  metadata?: Record<string, any>;
}

// 功能访问记录类型
export interface FeatureAccess {
  featureId: string;
  featureName: string;
  lastAccess: number; // Unix 时间戳（毫秒）
  accessCount: number;
}

// 存储服务类
export class StorageService {
  private static instance: StorageService;
  private networkService: NetworkService;
  private db: IDBPDatabase<MobileAppDB> | null = null;
  private dbPromise: Promise<IDBPDatabase<MobileAppDB>> | null = null;
  private isInitialized = ref(false);
  private initError = ref<Error | null>(null);
  
  private constructor() {
    this.networkService = NetworkService.getInstance();
    this.initDatabase();
  }
  
  // 单例模式获取实例
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
  
  // 初始化数据库
  private async initDatabase(): Promise<void> {
    try {
      this.dbPromise = openDB<MobileAppDB>(DB_NAME, DB_VERSION, {
        upgrade: (db, oldVersion, newVersion) => {
          // 创建存储对象
          if (oldVersion < 1) {
            // 消息存储
            const messageStore = db.createObjectStore('messages', {
              keyPath: 'id',
            });
            messageStore.createIndex('by-feature', 'featureId');
            messageStore.createIndex('by-timestamp', 'timestamp');
            messageStore.createIndex('by-status', 'status');

            // 会话存储
            const conversationStore = db.createObjectStore('conversations', {
              keyPath: 'id',
            });
            conversationStore.createIndex('by-timestamp', 'timestamp');

            // 功能访问记录存储
            const accessStore = db.createObjectStore('featureAccess', {
              keyPath: 'featureId',
            });
            accessStore.createIndex('by-lastAccess', 'lastAccess');

            // 设置存储
            db.createObjectStore('settings', {
              keyPath: 'key',
            });
          }
        },
      });

      this.db = await this.dbPromise;
      this.isInitialized.value = true;
      console.log('存储服务初始化成功');
    } catch (error) {
      console.error('初始化存储服务失败:', error);
      this.initError.value = error as Error;
    }
  }
  
  // 获取数据库实例（确保已初始化）
  private async getDB(): Promise<IDBPDatabase<MobileAppDB>> {
    if (!this.db) {
      if (!this.dbPromise) {
        await this.initDatabase();
      }
      this.db = await this.dbPromise;
    }
    return this.db as IDBPDatabase<MobileAppDB>;
  }
  
  // 获取初始化状态
  public getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      error: this.initError,
    };
  }
  
  // 添加消息
  public async addMessage(message: Message): Promise<string> {
    const db = await this.getDB();
    // 确保时间戳是数字类型
    const updatedMessage = { ...message };
    // 转换时间戳，支持可能的Date对象
    if (updatedMessage.timestamp && typeof updatedMessage.timestamp !== 'number') {
      updatedMessage.timestamp = Number(updatedMessage.timestamp) || Date.now();
    }
    await db.put('messages', updatedMessage);
    return updatedMessage.id;
  }
  
  // 更新消息
  public async updateMessage(messageId: string, updates: Partial<Message>): Promise<void> {
    const db = await this.getDB();
    const message = await db.get('messages', messageId);
    
    if (message) {
      const updatedMessage = { ...message, ...updates };
      // 转换时间戳，支持可能的Date对象
      if (updates.timestamp && typeof updatedMessage.timestamp !== 'number') {
        updatedMessage.timestamp = Number(updatedMessage.timestamp) || Date.now();
      }
      await db.put('messages', updatedMessage);
    }
  }
  
  // 批量添加或更新消息
  public async saveMessages(messages: Message[]): Promise<string[]> {
    const db = await this.getDB();
    const tx = db.transaction('messages', 'readwrite');
    
    const updatedMessages = messages.map(message => {
      const updatedMessage = { ...message };
      // 转换时间戳，支持可能的Date对象
      if (updatedMessage.timestamp && typeof updatedMessage.timestamp !== 'number') {
        updatedMessage.timestamp = Number(updatedMessage.timestamp) || Date.now();
      }
      return updatedMessage;
    });
    
    const promises = updatedMessages.map(message => tx.store.put(message));
    await Promise.all([...promises, tx.done]);
    return updatedMessages.map(message => message.id);
  }
  
  // 获取消息
  public async getMessage(id: string): Promise<Message | undefined> {
    const db = await this.getDB();
    return db.get('messages', id);
  }
  
  // 获取功能的消息（分页）
  public async getMessagesByFeaturePaginated(
    featureId: string,
    limit: number,
    offset: number
  ): Promise<Message[]> {
    const db = await this.getDB();
    const messages = await db.getAllFromIndex('messages', 'by-feature', featureId);
    
    // 按时间戳排序（从新到旧）
    messages.sort((a, b) => b.timestamp - a.timestamp);
    
    // 返回分页结果
    return messages.slice(offset, offset + limit);
  }
  
  // 获取待同步的消息
  public async getPendingMessages(): Promise<Message[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('messages', 'by-status', 'pending');
  }
  
  // 删除消息
  public async deleteMessage(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('messages', id);
  }
  
  // 添加或更新会话
  public async saveConversation(conversation: Conversation): Promise<string> {
    const db = await this.getDB();
    const updatedConversation = { ...conversation };
    
    // 转换时间戳，支持可能的Date对象
    if (updatedConversation.timestamp && typeof updatedConversation.timestamp !== 'number') {
      updatedConversation.timestamp = Number(updatedConversation.timestamp) || Date.now();
    }
    
    if (updatedConversation.lastMessageTimestamp && 
        typeof updatedConversation.lastMessageTimestamp !== 'number') {
      updatedConversation.lastMessageTimestamp = 
        Number(updatedConversation.lastMessageTimestamp) || Date.now();
    }
    
    await db.put('conversations', updatedConversation);
    return updatedConversation.id;
  }
  
  // 获取会话
  public async getConversation(id: string): Promise<Conversation | undefined> {
    const db = await this.getDB();
    return db.get('conversations', id);
  }
  
  // 获取功能的所有会话
  public async getConversationsByFeature(featureId: string): Promise<Conversation[]> {
    const db = await this.getDB();
    const allConversations = await db.getAll('conversations');
    return allConversations.filter(conv => conv.featureId === featureId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  // 删除会话及其消息
  public async deleteConversation(id: string): Promise<void> {
    const db = await this.getDB();
    
    // 删除所有相关消息
    const tx = db.transaction('messages', 'readwrite');
    const messages = await tx.store.getAll();
    
    for (const message of messages) {
      if (message.conversationId === id) {
        await tx.store.delete(message.id);
      }
    }
    await tx.done;
    
    // 删除会话
    await db.delete('conversations', id);
  }
  
  // 更新功能访问记录
  public async updateFeatureAccess(featureId: string, featureName: string): Promise<void> {
    const db = await this.getDB();
    const existingAccess = await db.get('featureAccess', featureId);
    
    const access: FeatureAccess = existingAccess 
      ? {
          ...existingAccess,
          lastAccess: Date.now(),
          accessCount: (existingAccess.accessCount || 0) + 1
        }
      : {
          featureId,
          featureName,
          lastAccess: Date.now(),
          accessCount: 1
        };
    
    await db.put('featureAccess', access);
  }
  
  // 获取最近访问的功能
  public async getRecentFeatures(limit: number = 5): Promise<FeatureAccess[]> {
    const db = await this.getDB();
    const index = db.transaction('featureAccess').store.index('by-lastAccess');
    
    // 使用游标从最新到最旧获取功能访问记录
    const features: FeatureAccess[] = [];
    let cursor = await index.openCursor(null, 'prev');
    
    while (cursor && features.length < limit) {
      features.push(cursor.value);
      cursor = await cursor.continue();
    }
    
    return features;
  }
  
  // 保存设置
  public async saveSetting(key: string, value: any): Promise<void> {
    const db = await this.getDB();
    await db.put('settings', { key, value });
  }
  
  // 获取设置
  public async getSetting(key: string): Promise<any> {
    const db = await this.getDB();
    const result = await db.get('settings', key);
    return result ? result.value : undefined;
  }
  
  // 获取所有设置
  public async getAllSettings(): Promise<Record<string, any>> {
    const db = await this.getDB();
    const settings = await db.getAll('settings');
    
    return settings.reduce((obj, setting) => {
      obj[setting.key] = setting.value;
      return obj;
    }, {} as Record<string, any>);
  }
  
  // 同步消息到服务器
  public async syncMessages(): Promise<{ success: number; failed: number }> {
    const pendingMessages = await this.getPendingMessages();
    
    if (pendingMessages.length === 0) {
      return { success: 0, failed: 0 };
    }
    
    let successCount = 0;
    let failedCount = 0;
    
    try {
      // 批量同步消息
      const response = await this.networkService.request<{ success: string[] }>({
        url: '/api/messages/sync',
        method: 'POST',
        data: { messages: pendingMessages },
        priority: RequestPriority.LOW,
        timeout: 30000
      });
      
      // 处理成功和失败的消息
      if (response && response.success) {
        const successIds = new Set(response.success);
        
        for (const message of pendingMessages) {
          if (successIds.has(message.id)) {
            await this.updateMessage(message.id, { 
              status: 'sent',
              synced: true
            });
            successCount++;
          } else {
            failedCount++;
          }
        }
      }
      
      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('同步消息失败:', error);
      return { success: 0, failed: pendingMessages.length };
    }
  }
  
  // 清理过期数据
  public async cleanupOldData(daysToKeep: number = 30): Promise<number> {
    const db = await this.getDB();
    const cutoffTimestamp = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const tx = db.transaction('messages', 'readwrite');
    const index = tx.store.index('by-timestamp');
    let cursor = await index.openCursor();
    
    let deletedCount = 0;
    
    while (cursor) {
      const message = cursor.value;
      if (message.timestamp < cutoffTimestamp) {
        await cursor.delete();
        deletedCount++;
      }
      cursor = await cursor.continue();
    }
    
    await tx.done;
    return deletedCount;
  }
  
  // 导出数据（备份）
  public async exportData(): Promise<{
    messages: Message[];
    conversations: Conversation[];
    featureAccess: FeatureAccess[];
    settings: Record<string, any>;
  }> {
    const db = await this.getDB();
    
    const [messages, conversations, featureAccess] = await Promise.all([
      db.getAll('messages'),
      db.getAll('conversations'),
      db.getAll('featureAccess')
    ]);
    
    const settingsRecords = await db.getAll('settings');
    const settings = settingsRecords.reduce((obj, setting) => {
      obj[setting.key] = setting.value;
      return obj;
    }, {} as Record<string, any>);
    
    return {
      messages,
      conversations,
      featureAccess,
      settings
    };
  }
  
  // 导入数据（恢复）
  public async importData(data: {
    messages?: Message[];
    conversations?: Conversation[];
    featureAccess?: FeatureAccess[];
    settings?: Record<string, any>;
  }): Promise<void> {
    const db = await this.getDB();
    
    if (data.messages && data.messages.length > 0) {
      const tx = db.transaction('messages', 'readwrite');
      for (const message of data.messages) {
        await tx.store.put(message);
      }
      await tx.done;
    }
    
    if (data.conversations && data.conversations.length > 0) {
      const tx = db.transaction('conversations', 'readwrite');
      for (const conversation of data.conversations) {
        await tx.store.put(conversation);
      }
      await tx.done;
    }
    
    if (data.featureAccess && data.featureAccess.length > 0) {
      const tx = db.transaction('featureAccess', 'readwrite');
      for (const access of data.featureAccess) {
        await tx.store.put(access);
      }
      await tx.done;
    }
    
    if (data.settings) {
      const tx = db.transaction('settings', 'readwrite');
      for (const [key, value] of Object.entries(data.settings)) {
        await tx.store.put({ key, value });
      }
      await tx.done;
    }
  }
  
  // 清除数据库（谨慎使用）
  public async clearDatabase(): Promise<void> {
    const db = await this.getDB();
    
    const stores = ['messages', 'conversations', 'featureAccess', 'settings'];
    
    for (const store of stores) {
      const tx = db.transaction(store as any, 'readwrite');
      await tx.store.clear();
      await tx.done;
    }
  }
}

// 导出单例实例
export const storageService = StorageService.getInstance(); 