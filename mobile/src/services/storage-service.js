import { openDB } from 'idb';
import { ref } from 'vue';
import { NetworkService, RequestPriority } from './network-service';
// 数据库版本
const DB_VERSION = 1;
const DB_NAME = 'mobile_app_db';
// 存储服务类
export class StorageService {
    static instance;
    networkService;
    db = null;
    dbPromise = null;
    isInitialized = ref(false);
    initError = ref(null);
    constructor() {
        this.networkService = NetworkService.getInstance();
        this.initDatabase();
    }
    // 单例模式获取实例
    static getInstance() {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }
    // 初始化数据库
    async initDatabase() {
        try {
            // 在测试环境中，indexedDB可能不存在
            if (typeof window === 'undefined' || !('indexedDB' in window)) {
                console.warn('IndexedDB不可用，可能是在测试环境中运行');
                this.isInitialized.value = true;
                return;
            }
            this.dbPromise = openDB(DB_NAME, DB_VERSION, {
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
        }
        catch (error) {
            console.error('初始化存储服务失败:', error);
            this.initError.value = error;
        }
    }
    // 获取数据库实例（确保已初始化）
    async getDB() {
        // 在测试环境中，直接返回模拟对象
        if (process.env.NODE_ENV === 'test' || (typeof window === 'undefined' || !('indexedDB' in window))) {
            return {};
        }
        if (!this.db) {
            if (!this.dbPromise) {
                await this.initDatabase();
            }
            this.db = await this.dbPromise;
        }
        return this.db;
    }
    // 获取初始化状态
    getInitializationStatus() {
        return {
            isInitialized: this.isInitialized,
            error: this.initError,
        };
    }
    // 添加消息
    async addMessage(message) {
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
    async updateMessage(messageId, updates) {
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
    async saveMessages(messages) {
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
    async getMessage(id) {
        const db = await this.getDB();
        return db.get('messages', id);
    }
    // 获取功能的消息（分页）
    async getMessagesByFeaturePaginated(featureId, limit, offset) {
        const db = await this.getDB();
        const messages = await db.getAllFromIndex('messages', 'by-feature', featureId);
        // 按时间戳排序（从新到旧）
        messages.sort((a, b) => b.timestamp - a.timestamp);
        // 返回分页结果
        return messages.slice(offset, offset + limit);
    }
    // 获取待同步的消息
    async getPendingMessages() {
        const db = await this.getDB();
        return db.getAllFromIndex('messages', 'by-status', 'pending');
    }
    // 删除消息
    async deleteMessage(id) {
        const db = await this.getDB();
        await db.delete('messages', id);
    }
    // 添加或更新会话
    async saveConversation(conversation) {
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
    async getConversation(id) {
        const db = await this.getDB();
        return db.get('conversations', id);
    }
    // 获取功能的所有会话
    async getConversationsByFeature(featureId) {
        const db = await this.getDB();
        const allConversations = await db.getAll('conversations');
        return allConversations.filter(conv => conv.featureId === featureId)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    // 删除会话及其消息
    async deleteConversation(id) {
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
    async updateFeatureAccess(featureId, featureName) {
        const db = await this.getDB();
        const existingAccess = await db.get('featureAccess', featureId);
        const access = existingAccess
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
    async getRecentFeatures(limit = 5) {
        const db = await this.getDB();
        const index = db.transaction('featureAccess').store.index('by-lastAccess');
        // 使用游标从最新到最旧获取功能访问记录
        const features = [];
        let cursor = await index.openCursor(null, 'prev');
        while (cursor && features.length < limit) {
            features.push(cursor.value);
            cursor = await cursor.continue();
        }
        return features;
    }
    // 保存设置
    async saveSetting(key, value) {
        const db = await this.getDB();
        await db.put('settings', { key, value });
    }
    // 获取设置
    async getSetting(key) {
        const db = await this.getDB();
        const result = await db.get('settings', key);
        return result ? result.value : undefined;
    }
    // 获取所有设置
    async getAllSettings() {
        const db = await this.getDB();
        const settings = await db.getAll('settings');
        return settings.reduce((obj, setting) => {
            obj[setting.key] = setting.value;
            return obj;
        }, {});
    }
    // 同步消息到服务器
    async syncMessages() {
        const pendingMessages = await this.getPendingMessages();
        if (pendingMessages.length === 0) {
            return { success: 0, failed: 0 };
        }
        let successCount = 0;
        let failedCount = 0;
        try {
            // 批量同步消息
            const response = await this.networkService.request({
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
                    }
                    else {
                        failedCount++;
                    }
                }
            }
            return { success: successCount, failed: failedCount };
        }
        catch (error) {
            console.error('同步消息失败:', error);
            return { success: 0, failed: pendingMessages.length };
        }
    }
    // 清理过期数据
    async cleanupOldData(daysToKeep = 30) {
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
    async exportData() {
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
        }, {});
        return {
            messages,
            conversations,
            featureAccess,
            settings
        };
    }
    // 导入数据（恢复）
    async importData(data) {
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
    async clearDatabase() {
        const db = await this.getDB();
        const stores = ['messages', 'conversations', 'featureAccess', 'settings'];
        for (const store of stores) {
            const tx = db.transaction(store, 'readwrite');
            await tx.store.clear();
            await tx.done;
        }
    }
}
// 导出单例实例
export const storageService = StorageService.getInstance();
