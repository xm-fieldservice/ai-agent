import { ref } from 'vue';
// 请求优先级枚举
export var RequestPriority;
(function (RequestPriority) {
    RequestPriority[RequestPriority["HIGH"] = 0] = "HIGH";
    RequestPriority[RequestPriority["MEDIUM"] = 1] = "MEDIUM";
    RequestPriority[RequestPriority["LOW"] = 2] = "LOW";
})(RequestPriority || (RequestPriority = {}));
// 请求状态枚举
export var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "pending";
    RequestStatus["PROCESSING"] = "processing";
    RequestStatus["COMPLETED"] = "completed";
    RequestStatus["FAILED"] = "failed";
})(RequestStatus || (RequestStatus = {}));
// 网络错误类型
export class NetworkError extends Error {
    status;
    code;
    data;
    constructor(message, status, code, data) {
        super(message);
        this.status = status;
        this.code = code;
        this.data = data;
        this.name = 'NetworkError';
    }
}
// 网络服务类
export class NetworkService {
    static instance;
    requestQueue = [];
    processingQueue = [];
    batchTimeout = 100; // 批处理时间窗口（毫秒）
    maxConcurrent = 3; // 最大并发请求数
    isProcessing = false;
    networkStatus = ref('online');
    constructor() {
        this.initNetworkStatus();
    }
    // 单例模式获取实例
    static getInstance() {
        if (!NetworkService.instance) {
            NetworkService.instance = new NetworkService();
        }
        return NetworkService.instance;
    }
    // 初始化网络状态监听
    initNetworkStatus() {
        window.addEventListener('online', () => {
            this.networkStatus.value = 'online';
            this.processQueue();
        });
        window.addEventListener('offline', () => {
            this.networkStatus.value = 'offline';
        });
    }
    // 添加请求到队列
    async request(config) {
        const task = {
            id: this.generateTaskId(),
            config: {
                ...config,
                priority: config.priority ?? RequestPriority.MEDIUM,
                timeout: config.timeout ?? 30000,
                retryCount: config.retryCount ?? 3,
                retryDelay: config.retryDelay ?? 1000
            },
            status: RequestStatus.PENDING,
            timestamp: Date.now(),
            retries: 0
        };
        this.requestQueue.push(task);
        this.sortQueue();
        this.processQueue();
        return this.waitForResult(task);
    }
    // 生成任务ID
    generateTaskId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    // 对队列进行优先级排序
    sortQueue() {
        this.requestQueue.sort((a, b) => {
            // 首先按优先级排序
            if (a.config.priority !== b.config.priority) {
                return a.config.priority - b.config.priority;
            }
            // 同优先级按时间戳排序
            return a.timestamp - b.timestamp;
        });
    }
    // 处理请求队列
    async processQueue() {
        if (this.isProcessing || this.networkStatus.value === 'offline') {
            return;
        }
        this.isProcessing = true;
        try {
            // 处理高优先级请求
            while (this.processingQueue.length < this.maxConcurrent && this.requestQueue.length > 0) {
                const task = this.requestQueue.shift();
                if (task.config.priority === RequestPriority.HIGH) {
                    await this.processTask(task);
                }
                else {
                    // 将非高优先级请求放回队列
                    this.requestQueue.unshift(task);
                    break;
                }
            }
            // 批量处理中低优先级请求
            if (this.requestQueue.length > 0) {
                await this.processBatch();
            }
        }
        finally {
            this.isProcessing = false;
        }
    }
    // 处理单个请求任务
    async processTask(task) {
        task.status = RequestStatus.PROCESSING;
        this.processingQueue.push(task);
        try {
            const response = await this.executeRequest(task);
            task.status = RequestStatus.COMPLETED;
            task.result = response;
        }
        catch (error) {
            if (task.retries < task.config.retryCount) {
                task.retries++;
                await new Promise(resolve => setTimeout(resolve, task.config.retryDelay));
                this.requestQueue.push(task);
            }
            else {
                task.status = RequestStatus.FAILED;
                task.error = error;
            }
        }
        finally {
            const index = this.processingQueue.indexOf(task);
            if (index > -1) {
                this.processingQueue.splice(index, 1);
            }
        }
    }
    // 批量处理请求
    async processBatch() {
        const batchTasks = this.requestQueue.splice(0, this.maxConcurrent);
        const batchPromises = batchTasks.map(task => this.processTask(task));
        await Promise.all(batchPromises);
    }
    // 执行实际的网络请求
    async executeRequest(task) {
        const { url, method = 'GET', data, headers = {}, timeout } = task.config;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: data ? JSON.stringify(data) : undefined,
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    // 等待请求结果
    waitForResult(task) {
        return new Promise((resolve, reject) => {
            const checkStatus = () => {
                if (task.status === RequestStatus.COMPLETED) {
                    resolve(task.result);
                }
                else if (task.status === RequestStatus.FAILED) {
                    reject(task.error);
                }
                else {
                    setTimeout(checkStatus, 100);
                }
            };
            checkStatus();
        });
    }
    // 获取网络状态
    getNetworkStatus() {
        return this.networkStatus;
    }
    // 获取队列状态
    getQueueStatus() {
        return {
            pending: this.requestQueue.length,
            processing: this.processingQueue.length
        };
    }
    // 清除所有请求
    clearQueue() {
        this.requestQueue = [];
        this.processingQueue = [];
    }
}
