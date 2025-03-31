import { ref } from 'vue';
import { StorageService } from './storage-service';
import { NetworkService, RequestPriority } from './network-service';
/**
 * 冲突解决策略枚举
 */
export var ConflictResolutionStrategy;
(function (ConflictResolutionStrategy) {
    // 客户端数据优先
    ConflictResolutionStrategy["CLIENT_WINS"] = "client_wins";
    // 服务器数据优先
    ConflictResolutionStrategy["SERVER_WINS"] = "server_wins";
    // 保留两者（同时保存服务器和客户端版本）
    ConflictResolutionStrategy["KEEP_BOTH"] = "keep_both";
    // 根据时间戳决定（较新的胜出）
    ConflictResolutionStrategy["TIMESTAMP_WINS"] = "timestamp_wins";
    // 人工决定（提示用户选择）
    ConflictResolutionStrategy["MANUAL_RESOLUTION"] = "manual_resolution";
})(ConflictResolutionStrategy || (ConflictResolutionStrategy = {}));
/**
 * 冲突类型枚举
 */
export var ConflictType;
(function (ConflictType) {
    // 消息内容冲突
    ConflictType["MESSAGE_CONTENT"] = "message_content";
    // 消息状态冲突
    ConflictType["MESSAGE_STATUS"] = "message_status";
    // 会话数据冲突
    ConflictType["CONVERSATION_DATA"] = "conversation_data";
    // 删除冲突（一端删除，一端修改）
    ConflictType["DELETION_CONFLICT"] = "deletion_conflict";
})(ConflictType || (ConflictType = {}));
/**
 * 冲突解决服务 - 处理数据同步冲突
 */
export class ConflictResolutionService {
    static instance;
    storageService;
    networkService;
    // 当前待解决的冲突
    pendingConflicts = ref([]);
    // 全局冲突解决策略
    defaultStrategy = ref(ConflictResolutionStrategy.TIMESTAMP_WINS);
    // 是否正在解决冲突
    isResolving = ref(false);
    constructor() {
        this.storageService = StorageService.getInstance();
        this.networkService = NetworkService.getInstance();
        // 加载保存的冲突
        this.loadPendingConflicts();
        // 加载默认策略
        this.loadDefaultStrategy();
    }
    /**
     * 获取单例实例
     */
    static getInstance() {
        if (!ConflictResolutionService.instance) {
            ConflictResolutionService.instance = new ConflictResolutionService();
        }
        return ConflictResolutionService.instance;
    }
    /**
     * 加载保存的冲突
     */
    async loadPendingConflicts() {
        try {
            const conflicts = await this.storageService.getSetting('pendingConflicts');
            if (conflicts) {
                this.pendingConflicts.value = conflicts;
            }
        }
        catch (error) {
            console.error('加载冲突数据失败:', error);
        }
    }
    /**
     * 加载默认冲突解决策略
     */
    async loadDefaultStrategy() {
        try {
            const strategy = await this.storageService.getSetting('defaultConflictStrategy');
            if (strategy) {
                this.defaultStrategy.value = strategy;
            }
        }
        catch (error) {
            console.error('加载默认冲突解决策略失败:', error);
        }
    }
    /**
     * 保存当前冲突列表
     */
    async savePendingConflicts() {
        try {
            await this.storageService.saveSetting('pendingConflicts', this.pendingConflicts.value);
        }
        catch (error) {
            console.error('保存冲突数据失败:', error);
        }
    }
    /**
     * 保存默认冲突解决策略
     */
    async saveDefaultStrategy() {
        try {
            await this.storageService.saveSetting('defaultConflictStrategy', this.defaultStrategy.value);
        }
        catch (error) {
            console.error('保存默认冲突解决策略失败:', error);
        }
    }
    /**
     * 添加新冲突
     */
    async addConflict(conflict) {
        const fullConflict = {
            ...conflict,
            timestamp: Date.now(),
            resolved: false
        };
        this.pendingConflicts.value.push(fullConflict);
        await this.savePendingConflicts();
        return fullConflict.id;
    }
    /**
     * 获取待解决的冲突
     */
    getPendingConflicts(type) {
        if (!type) {
            return this.pendingConflicts.value.filter(conflict => !conflict.resolved);
        }
        return this.pendingConflicts.value.filter(conflict => !conflict.resolved && conflict.type === type);
    }
    /**
     * 获取冲突状态
     */
    getConflictStatus() {
        return {
            pendingCount: ref(() => this.pendingConflicts.value.filter(c => !c.resolved).length),
            isResolving: this.isResolving,
            defaultStrategy: this.defaultStrategy
        };
    }
    /**
     * 设置默认冲突解决策略
     */
    async setDefaultStrategy(strategy) {
        this.defaultStrategy.value = strategy;
        await this.saveDefaultStrategy();
    }
    /**
     * 解决单个冲突
     */
    async resolveConflict(conflictId, strategy = this.defaultStrategy.value) {
        const conflictIndex = this.pendingConflicts.value.findIndex(c => c.id === conflictId);
        if (conflictIndex === -1) {
            throw new Error(`未找到ID为 ${conflictId} 的冲突`);
        }
        const conflict = this.pendingConflicts.value[conflictIndex];
        // 根据策略应用解决方案
        await this.applyResolutionStrategy(conflict, strategy);
        // 标记为已解决
        conflict.resolved = true;
        conflict.resolutionStrategy = strategy;
        // 更新冲突列表
        this.pendingConflicts.value[conflictIndex] = conflict;
        await this.savePendingConflicts();
    }
    /**
     * 应用冲突解决策略
     */
    async applyResolutionStrategy(conflict, strategy) {
        switch (conflict.type) {
            case ConflictType.MESSAGE_CONTENT:
            case ConflictType.MESSAGE_STATUS:
                await this.resolveMessageConflict(conflict, strategy);
                break;
            case ConflictType.CONVERSATION_DATA:
                await this.resolveConversationConflict(conflict, strategy);
                break;
            case ConflictType.DELETION_CONFLICT:
                await this.resolveDeletionConflict(conflict, strategy);
                break;
            default:
                throw new Error(`未知的冲突类型: ${conflict.type}`);
        }
    }
    /**
     * 解决消息冲突
     */
    async resolveMessageConflict(conflict, strategy) {
        const { id, clientVersion, serverVersion } = conflict;
        switch (strategy) {
            case ConflictResolutionStrategy.CLIENT_WINS:
                // 客户端版本胜出，更新服务器版本
                await this.networkService.request({
                    url: `/api/messages/${id}`,
                    method: 'PUT',
                    data: clientVersion,
                    priority: RequestPriority.LOW
                });
                break;
            case ConflictResolutionStrategy.SERVER_WINS:
                // 服务器版本胜出，更新本地版本
                await this.storageService.updateMessage(id, serverVersion);
                break;
            case ConflictResolutionStrategy.KEEP_BOTH:
                // 保留两个版本，创建副本
                const copyId = `${id}_server_copy`;
                const serverCopy = { ...serverVersion, id: copyId };
                await this.storageService.addMessage(serverCopy);
                break;
            case ConflictResolutionStrategy.TIMESTAMP_WINS:
                // 根据时间戳决定
                if (clientVersion.timestamp > serverVersion.timestamp) {
                    // 客户端版本较新
                    await this.networkService.request({
                        url: `/api/messages/${id}`,
                        method: 'PUT',
                        data: clientVersion,
                        priority: RequestPriority.LOW
                    });
                }
                else {
                    // 服务器版本较新
                    await this.storageService.updateMessage(id, serverVersion);
                }
                break;
            case ConflictResolutionStrategy.MANUAL_RESOLUTION:
                // 人工解决，不自动处理，等待用户选择
                // 这里为保持函数流程一致而留空
                break;
            default:
                throw new Error(`未支持的冲突解决策略: ${strategy}`);
        }
    }
    /**
     * 解决会话冲突
     */
    async resolveConversationConflict(conflict, strategy) {
        const { id, clientVersion, serverVersion } = conflict;
        switch (strategy) {
            case ConflictResolutionStrategy.CLIENT_WINS:
                // 客户端版本胜出，更新服务器版本
                await this.networkService.request({
                    url: `/api/conversations/${id}`,
                    method: 'PUT',
                    data: clientVersion,
                    priority: RequestPriority.LOW
                });
                break;
            case ConflictResolutionStrategy.SERVER_WINS:
                // 服务器版本胜出，更新本地版本
                await this.storageService.saveConversation(serverVersion);
                break;
            case ConflictResolutionStrategy.KEEP_BOTH:
                // 保留两个版本，创建副本
                const copyId = `${id}_server_copy`;
                const serverCopy = { ...serverVersion, id: copyId };
                await this.storageService.saveConversation(serverCopy);
                break;
            case ConflictResolutionStrategy.TIMESTAMP_WINS:
                // 根据时间戳决定
                if (clientVersion.timestamp > serverVersion.timestamp) {
                    // 客户端版本较新
                    await this.networkService.request({
                        url: `/api/conversations/${id}`,
                        method: 'PUT',
                        data: clientVersion,
                        priority: RequestPriority.LOW
                    });
                }
                else {
                    // 服务器版本较新
                    await this.storageService.saveConversation(serverVersion);
                }
                break;
            case ConflictResolutionStrategy.MANUAL_RESOLUTION:
                // 人工解决，不自动处理
                break;
            default:
                throw new Error(`未支持的冲突解决策略: ${strategy}`);
        }
    }
    /**
     * 解决删除冲突
     */
    async resolveDeletionConflict(conflict, strategy) {
        const { id, type, clientVersion, serverVersion } = conflict;
        // 判断是消息还是会话
        const isMessage = type.includes('MESSAGE');
        const apiPath = isMessage ? 'messages' : 'conversations';
        switch (strategy) {
            case ConflictResolutionStrategy.CLIENT_WINS:
                // 如果客户端删除，则在服务器上也删除
                if (!clientVersion) {
                    await this.networkService.request({
                        url: `/api/${apiPath}/${id}`,
                        method: 'DELETE',
                        priority: RequestPriority.LOW
                    });
                }
                else {
                    // 如果服务器删除，客户端保留，则恢复到服务器
                    await this.networkService.request({
                        url: `/api/${apiPath}/${id}`,
                        method: 'PUT',
                        data: clientVersion,
                        priority: RequestPriority.LOW
                    });
                }
                break;
            case ConflictResolutionStrategy.SERVER_WINS:
                if (!serverVersion) {
                    // 如果服务器删除，则本地也删除
                    if (isMessage) {
                        await this.storageService.deleteMessage(id);
                    }
                    else {
                        await this.storageService.deleteConversation(id);
                    }
                }
                else {
                    // 如果本地删除，服务器保留，则恢复到本地
                    if (isMessage) {
                        await this.storageService.addMessage(serverVersion);
                    }
                    else {
                        await this.storageService.saveConversation(serverVersion);
                    }
                }
                break;
            case ConflictResolutionStrategy.KEEP_BOTH:
                // 对于删除冲突，保留两者意味着保留未删除的版本
                if (clientVersion && !serverVersion) {
                    // 客户端保留，服务器删除
                    // 将客户端版本备份为新对象
                    const copyId = `${id}_client_copy`;
                    if (isMessage) {
                        const clientCopy = { ...clientVersion, id: copyId };
                        await this.storageService.addMessage(clientCopy);
                    }
                    else {
                        const clientCopy = { ...clientVersion, id: copyId };
                        await this.storageService.saveConversation(clientCopy);
                    }
                }
                else if (!clientVersion && serverVersion) {
                    // 服务器保留，客户端删除
                    // 将服务器版本恢复为新对象
                    const copyId = `${id}_server_copy`;
                    if (isMessage) {
                        const serverCopy = { ...serverVersion, id: copyId };
                        await this.storageService.addMessage(serverCopy);
                    }
                    else {
                        const serverCopy = { ...serverVersion, id: copyId };
                        await this.storageService.saveConversation(serverCopy);
                    }
                }
                break;
            case ConflictResolutionStrategy.TIMESTAMP_WINS:
                // 比较最后修改时间
                const clientTimestamp = clientVersion ? clientVersion.timestamp : 0;
                const serverTimestamp = serverVersion ? serverVersion.timestamp : 0;
                if (clientTimestamp > serverTimestamp) {
                    // 客户端操作较新
                    if (!clientVersion) {
                        // 客户端删除较新
                        if (isMessage) {
                            await this.storageService.deleteMessage(id);
                        }
                        else {
                            await this.storageService.deleteConversation(id);
                        }
                        await this.networkService.request({
                            url: `/api/${apiPath}/${id}`,
                            method: 'DELETE',
                            priority: RequestPriority.LOW
                        });
                    }
                    else {
                        // 客户端保留较新
                        if (isMessage) {
                            await this.storageService.addMessage(clientVersion);
                        }
                        else {
                            await this.storageService.saveConversation(clientVersion);
                        }
                        await this.networkService.request({
                            url: `/api/${apiPath}/${id}`,
                            method: 'PUT',
                            data: clientVersion,
                            priority: RequestPriority.LOW
                        });
                    }
                }
                else {
                    // 服务器操作较新
                    if (!serverVersion) {
                        // 服务器删除较新
                        if (isMessage) {
                            await this.storageService.deleteMessage(id);
                        }
                        else {
                            await this.storageService.deleteConversation(id);
                        }
                    }
                    else {
                        // 服务器保留较新
                        if (isMessage) {
                            await this.storageService.addMessage(serverVersion);
                        }
                        else {
                            await this.storageService.saveConversation(serverVersion);
                        }
                    }
                }
                break;
            case ConflictResolutionStrategy.MANUAL_RESOLUTION:
                // 人工解决，不自动处理
                break;
            default:
                throw new Error(`未支持的冲突解决策略: ${strategy}`);
        }
    }
    /**
     * 自动解决所有冲突
     */
    async autoResolveAllConflicts() {
        if (this.isResolving.value) {
            return { resolved: 0, failed: 0, manual: 0 };
        }
        this.isResolving.value = true;
        let resolved = 0;
        let failed = 0;
        let manual = 0;
        try {
            const pendingConflicts = this.getPendingConflicts();
            for (const conflict of pendingConflicts) {
                try {
                    // 如果是手动解决，则跳过自动处理
                    if (this.defaultStrategy.value === ConflictResolutionStrategy.MANUAL_RESOLUTION) {
                        manual++;
                        continue;
                    }
                    await this.resolveConflict(conflict.id);
                    resolved++;
                }
                catch (error) {
                    console.error(`解决冲突 ${conflict.id} 失败:`, error);
                    failed++;
                }
            }
            return { resolved, failed, manual };
        }
        catch (error) {
            console.error('自动解决冲突失败:', error);
            return { resolved, failed, manual };
        }
        finally {
            this.isResolving.value = false;
        }
    }
    /**
     * 对比远程和本地数据，检测数据冲突
     */
    async detectConflicts(options = {}) {
        const { messageIds, conversationIds, autoResolve = false } = options;
        if (this.isResolving.value) {
            return { detected: 0, resolved: 0, failed: 0, manual: 0 };
        }
        this.isResolving.value = true;
        let detected = 0;
        let resolved = 0;
        let failed = 0;
        let manual = 0;
        try {
            // 检测消息冲突
            if (messageIds && messageIds.length > 0) {
                const messagesResponse = await this.networkService.request({
                    url: '/api/messages/batch',
                    method: 'POST',
                    data: { ids: messageIds },
                    priority: RequestPriority.LOW
                });
                if (messagesResponse) {
                    for (const id of messageIds) {
                        try {
                            const localMessage = await this.storageService.getMessage(id);
                            const serverMessage = messagesResponse[id];
                            if (this.hasMessageConflict(localMessage, serverMessage)) {
                                // 检测到冲突
                                const conflictId = await this.addConflict({
                                    id,
                                    type: ConflictType.MESSAGE_CONTENT,
                                    clientVersion: localMessage,
                                    serverVersion: serverMessage
                                });
                                detected++;
                                // 自动解决冲突
                                if (autoResolve && this.defaultStrategy.value !== ConflictResolutionStrategy.MANUAL_RESOLUTION) {
                                    await this.resolveConflict(conflictId);
                                    resolved++;
                                }
                                else if (this.defaultStrategy.value === ConflictResolutionStrategy.MANUAL_RESOLUTION) {
                                    manual++;
                                }
                            }
                        }
                        catch (error) {
                            console.error(`检测消息冲突失败 ${id}:`, error);
                            failed++;
                        }
                    }
                }
            }
            // 检测会话冲突
            if (conversationIds && conversationIds.length > 0) {
                const conversationsResponse = await this.networkService.request({
                    url: '/api/conversations/batch',
                    method: 'POST',
                    data: { ids: conversationIds },
                    priority: RequestPriority.LOW
                });
                if (conversationsResponse) {
                    for (const id of conversationIds) {
                        try {
                            const localConversation = await this.storageService.getConversation(id);
                            const serverConversation = conversationsResponse[id];
                            if (this.hasConversationConflict(localConversation, serverConversation)) {
                                // 检测到冲突
                                const conflictId = await this.addConflict({
                                    id,
                                    type: ConflictType.CONVERSATION_DATA,
                                    clientVersion: localConversation,
                                    serverVersion: serverConversation
                                });
                                detected++;
                                // 自动解决冲突
                                if (autoResolve && this.defaultStrategy.value !== ConflictResolutionStrategy.MANUAL_RESOLUTION) {
                                    await this.resolveConflict(conflictId);
                                    resolved++;
                                }
                                else if (this.defaultStrategy.value === ConflictResolutionStrategy.MANUAL_RESOLUTION) {
                                    manual++;
                                }
                            }
                        }
                        catch (error) {
                            console.error(`检测会话冲突失败 ${id}:`, error);
                            failed++;
                        }
                    }
                }
            }
            return { detected, resolved, failed, manual };
        }
        catch (error) {
            console.error('检测冲突失败:', error);
            return { detected, resolved, failed, manual };
        }
        finally {
            this.isResolving.value = false;
        }
    }
    /**
     * 检测消息是否有冲突
     */
    hasMessageConflict(localMessage, serverMessage) {
        // 如果一方有数据，一方没有，则为删除冲突
        if (!localMessage && serverMessage) {
            return true; // 客户端删除，服务器保留
        }
        if (localMessage && !serverMessage) {
            return true; // 客户端保留，服务器删除
        }
        if (!localMessage || !serverMessage) {
            return false; // 两边都没有，不冲突
        }
        // 检查关键字段是否不同
        if (localMessage.content !== serverMessage.content) {
            return true;
        }
        if (localMessage.status !== serverMessage.status) {
            return true;
        }
        // 其他字段可根据需要检查
        return false;
    }
    /**
     * 检测会话是否有冲突
     */
    hasConversationConflict(localConversation, serverConversation) {
        // 如果一方有数据，一方没有，则为删除冲突
        if (!localConversation && serverConversation) {
            return true; // 客户端删除，服务器保留
        }
        if (localConversation && !serverConversation) {
            return true; // 客户端保留，服务器删除
        }
        if (!localConversation || !serverConversation) {
            return false; // 两边都没有，不冲突
        }
        // 检查关键字段是否不同
        if (localConversation.title !== serverConversation.title) {
            return true;
        }
        if (localConversation.lastMessage !== serverConversation.lastMessage) {
            return true;
        }
        // 其他字段可根据需要检查
        return false;
    }
}
// 导出单例实例
export const conflictResolutionService = ConflictResolutionService.getInstance();
