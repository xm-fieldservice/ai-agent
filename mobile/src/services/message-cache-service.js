import { ref, computed, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage-service';
import { NetworkService, RequestPriority } from './network-service';
import { ConflictResolutionService } from './conflict-resolution-service';
// 测试模式标志
const isTestMode = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';
// 调试日志函数
function debugLog(...args) {
    if (isTestMode) {
        console.log('[MessageCacheService Debug]', ...args);
    }
}
/**
 * 消息缓存服务
 * 负责消息的本地缓存和离线队列管理
 */
export class MessageCacheService {
    static instance;
    storageService;
    networkService;
    conflictService;
    // 离线消息队列状态
    offlineQueue = ref([]);
    isSyncing = ref(false);
    syncInterval = null;
    /**
     * 初始化标志，用于测试
     * @private
     */
    initialized = false;
    constructor(skipInit = false) {
        debugLog('Constructor called with skipInit:', skipInit);
        // 初始化服务引用
        this.initServices();
        // 如果跳过初始化（测试模式使用）
        if (skipInit) {
            debugLog('Skipping initialization due to skipInit flag');
            return;
        }
        this.initialized = true;
        // 测试模式下不进行网络订阅和定时同步
        if (!isTestMode) {
            this.initNetworkWatcher();
            this.startPeriodicSync();
        }
        // 初始化加载离线队列
        this.loadOfflineQueue();
    }
    /**
     * 初始化服务引用
     * @private
     */
    initServices() {
        debugLog('Initializing services');
        this.storageService = StorageService.getInstance();
        this.networkService = NetworkService.getInstance();
        this.conflictService = ConflictResolutionService.getInstance();
        debugLog('Services initialized:', 'storageService:', !!this.storageService, 'networkService:', !!this.networkService, 'conflictService:', !!this.conflictService);
    }
    /**
     * 初始化网络状态监听
     * @private
     */
    initNetworkWatcher() {
        debugLog('Initializing network watcher');
        // 监听网络状态变化
        const networkStatus = this.networkService.getNetworkStatus();
        // 当网络恢复在线状态时尝试同步
        watch(() => networkStatus.value, (newStatus) => {
            if (newStatus === 'online' && this.offlineQueue.value.length > 0) {
                this.syncOfflineMessages();
            }
        });
    }
    /**
     * 单例模式获取实例
     */
    static getInstance() {
        if (!MessageCacheService.instance) {
            debugLog('Creating new instance via getInstance()');
            MessageCacheService.instance = new MessageCacheService();
        }
        return MessageCacheService.instance;
    }
    /**
     * 获取测试用实例（跳过初始化）
     * 仅在测试环境使用
     */
    static getTestInstance() {
        debugLog('getTestInstance called');
        if (isTestMode) {
            const instance = new MessageCacheService(true);
            debugLog('Created test instance:', instance);
            return instance;
        }
        return MessageCacheService.getInstance();
    }
    /**
     * 重置单例（仅用于测试）
     */
    static resetInstance() {
        if (isTestMode) {
            debugLog('Resetting singleton instance');
            MessageCacheService.instance = undefined;
        }
    }
    /**
     * 加载离线消息队列
     */
    async loadOfflineQueue() {
        debugLog('loadOfflineQueue called, initialized:', this.initialized);
        if (!this.initialized) {
            debugLog('Skipping loadOfflineQueue due to not initialized');
            return;
        }
        try {
            debugLog('Calling storageService.getPendingMessages');
            const pendingMessages = await this.storageService.getPendingMessages();
            debugLog('Got pending messages:', pendingMessages?.length || 0);
            this.offlineQueue.value = pendingMessages;
        }
        catch (error) {
            console.error('加载离线消息队列失败:', error);
        }
    }
    /**
     * 开始定期同步
     */
    startPeriodicSync(intervalMs = 60000) {
        debugLog('startPeriodicSync called');
        // 如果已经存在同步间隔，先清除
        if (this.syncInterval !== null) {
            window.clearInterval(this.syncInterval);
        }
        // 测试模式下不设置定时器
        if (isTestMode) {
            debugLog('Skipping timer setup in test mode');
            return;
        }
        // 设置新的同步间隔
        this.syncInterval = window.setInterval(() => {
            const networkStatus = this.networkService.getNetworkStatus();
            if (networkStatus.value === 'online' && this.offlineQueue.value.length > 0) {
                this.syncOfflineMessages();
            }
        }, intervalMs);
    }
    /**
     * 停止定期同步
     */
    stopPeriodicSync() {
        debugLog('stopPeriodicSync called, syncInterval:', !!this.syncInterval);
        if (this.syncInterval !== null) {
            window.clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    /**
     * 获取离线队列状态
     */
    getOfflineQueueStatus() {
        debugLog('getOfflineQueueStatus called');
        return {
            count: computed(() => this.offlineQueue.value.length),
            isSyncing: computed(() => this.isSyncing.value)
        };
    }
    /**
     * 获取冲突状态
     */
    getConflictStatus() {
        debugLog('getConflictStatus called, conflictService:', !!this.conflictService);
        if (!this.conflictService) {
            console.error('conflictService is undefined in getConflictStatus');
            return { count: { value: 0 }, pending: { value: false } };
        }
        return this.conflictService.getConflictStatus();
    }
    /**
     * 添加消息到缓存
     * @param message 要添加的消息（如果没有id将自动生成）
     * @param isOffline 是否强制离线处理（即使在线也加入队列）
     */
    async addMessage(message, isOffline = false) {
        debugLog('addMessage called, storageService:', !!this.storageService);
        if (!this.storageService) {
            console.error('storageService is undefined in addMessage');
            return 'error-no-storage-service';
        }
        // 生成完整消息对象，处理可选ID
        const messageId = message.id || uuidv4();
        const { id, ...messageWithoutId } = message;
        // 构建消息对象，确保不重复属性
        const fullMessage = {
            id: messageId,
            ...messageWithoutId,
            status: message.status || 'pending',
            timestamp: message.timestamp || Date.now()
        };
        // 保存到本地存储
        await this.storageService.addMessage(fullMessage);
        // 检查是否需要离线处理
        const networkStatus = this.networkService.getNetworkStatus();
        debugLog('Network status:', networkStatus?.value);
        if (isTestMode || isOffline || networkStatus.value === 'offline') {
            // 添加到离线队列
            this.offlineQueue.value.push(fullMessage);
            return fullMessage.id;
        }
        // 在线情况下直接发送
        try {
            await this.sendMessage(fullMessage);
            return fullMessage.id;
        }
        catch (error) {
            // 发送失败，加入离线队列
            console.error('发送消息失败，添加到离线队列:', error);
            this.offlineQueue.value.push(fullMessage);
            return fullMessage.id;
        }
    }
    /**
     * 发送单条消息到服务器
     */
    async sendMessage(message) {
        debugLog('sendMessage called');
        try {
            const response = await this.networkService.request({
                url: '/api/messages',
                method: 'POST',
                data: message,
                priority: RequestPriority.HIGH
            });
            // 更新消息状态
            await this.storageService.updateMessage(message.id, {
                status: 'sent',
                synced: true
            });
        }
        catch (error) {
            console.error('发送消息失败:', error);
            throw error;
        }
    }
    /**
     * 同步离线消息队列
     */
    async syncOfflineMessages() {
        debugLog('syncOfflineMessages called');
        if (!this.storageService || !this.conflictService) {
            debugLog('Missing services in syncOfflineMessages:', 'storageService:', !!this.storageService, 'conflictService:', !!this.conflictService);
            return { success: 0, failed: 0, conflicts: 0 };
        }
        // 如果没有离线消息或已经在同步，则返回
        if (this.offlineQueue.value.length === 0 || this.isSyncing.value) {
            return { success: 0, failed: 0, conflicts: 0 };
        }
        this.isSyncing.value = true;
        try {
            // 使用存储服务的同步功能
            const syncResult = await this.storageService.syncMessages();
            // 更新离线队列
            await this.loadOfflineQueue();
            // 在同步后检测冲突
            const messageIds = this.offlineQueue.value.map(msg => msg.id);
            const conflictResult = await this.conflictService.detectConflicts({
                messageIds,
                autoResolve: true
            });
            return {
                success: syncResult.success,
                failed: syncResult.failed,
                conflicts: conflictResult.detected
            };
        }
        catch (error) {
            console.error('同步离线消息失败:', error);
            return { success: 0, failed: this.offlineQueue.value.length, conflicts: 0 };
        }
        finally {
            this.isSyncing.value = false;
        }
    }
    /**
     * 获取功能的消息缓存（分页）
     */
    async getMessagesByFeature(featureId, limit = 20, offset = 0) {
        debugLog('getMessagesByFeature called');
        if (!this.storageService) {
            debugLog('Missing storageService in getMessagesByFeature');
            return [];
        }
        return this.storageService.getMessagesByFeaturePaginated(featureId, limit, offset);
    }
    /**
     * 清除过期消息
     */
    async cleanupOldMessages(daysToKeep = 30) {
        debugLog('cleanupOldMessages called');
        if (!this.storageService) {
            debugLog('Missing storageService in cleanupOldMessages');
            return 0;
        }
        return this.storageService.cleanupOldData(daysToKeep);
    }
    /**
     * 检测并解决功能的消息冲突
     */
    async checkAndResolveConflicts(featureId) {
        debugLog('checkAndResolveConflicts called');
        if (!this.storageService || !this.conflictService) {
            debugLog('Missing services in checkAndResolveConflicts:', 'storageService:', !!this.storageService, 'conflictService:', !!this.conflictService);
            return { detected: 0, resolved: 0, failed: 0, manual: 0 };
        }
        // 获取功能相关的所有消息
        const messages = await this.storageService.getMessagesByFeaturePaginated(featureId, 1000, 0);
        const messageIds = messages.map(msg => msg.id);
        // 使用冲突解决服务检测和解决冲突
        return this.conflictService.detectConflicts({
            messageIds,
            autoResolve: true
        });
    }
    /**
     * 手动解决冲突
     */
    async resolveConflict(conflictId) {
        debugLog('resolveConflict called');
        if (!this.conflictService) {
            debugLog('Missing conflictService in resolveConflict');
            return;
        }
        await this.conflictService.resolveConflict(conflictId);
    }
    /**
     * 自动解决所有冲突
     */
    async resolveAllConflicts() {
        debugLog('resolveAllConflicts called');
        if (!this.conflictService) {
            debugLog('Missing conflictService in resolveAllConflicts');
            return { resolved: 0, failed: 0, manual: 0 };
        }
        return this.conflictService.autoResolveAllConflicts();
    }
}
// 导出单例实例
export const messageCacheService = MessageCacheService.getInstance();
