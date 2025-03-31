/**
 * 日志系统
 * 用于收集错误日志和性能指标
 */
// 日志级别
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
// 日志类型
export var LogType;
(function (LogType) {
    LogType["OPERATION"] = "operation";
    LogType["ERROR"] = "error";
    LogType["PERFORMANCE"] = "performance";
    LogType["NETWORK"] = "network"; // 网络日志
})(LogType || (LogType = {}));
// 默认配置
const defaultConfig = {
    maxLogItems: 100,
    enabled: true,
    remoteLogging: false,
    logLevel: LogLevel.INFO,
    includeDeviceInfo: true
};
class Logger {
    config;
    logs = [];
    logCounter = 0;
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
        this.setupGlobalErrorHandling();
    }
    // 初始化日志系统
    init(config = {}) {
        this.config = { ...this.config, ...config };
        console.log('日志系统初始化完成', this.config);
    }
    // 创建日志项
    createLogItem(level, type, message, details) {
        const id = `log_${Date.now()}_${this.logCounter++}`;
        const logItem = {
            id,
            timestamp: Date.now(),
            level,
            type,
            message,
            details
        };
        if (this.config.includeDeviceInfo) {
            logItem.deviceInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                screenSize: `${window.screen.width}x${window.screen.height}`,
                connection: 'connection' in navigator
                    ? navigator.connection?.effectiveType
                    : undefined
            };
        }
        return logItem;
    }
    // 日志记录方法
    debug(message, details, type = LogType.OPERATION) {
        if (!this.config.enabled || !this.isLevelEnabled(LogLevel.DEBUG))
            return;
        this.addLog(LogLevel.DEBUG, type, message, details);
    }
    info(message, details, type = LogType.OPERATION) {
        if (!this.config.enabled || !this.isLevelEnabled(LogLevel.INFO))
            return;
        this.addLog(LogLevel.INFO, type, message, details);
    }
    warn(message, details, type = LogType.OPERATION) {
        if (!this.config.enabled || !this.isLevelEnabled(LogLevel.WARN))
            return;
        this.addLog(LogLevel.WARN, type, message, details);
    }
    error(message, details, type = LogType.ERROR) {
        if (!this.config.enabled || !this.isLevelEnabled(LogLevel.ERROR))
            return;
        this.addLog(LogLevel.ERROR, type, message, details);
    }
    // 添加日志
    addLog(level, type, message, details) {
        const logItem = this.createLogItem(level, type, message, details);
        this.logs.push(logItem);
        // 限制日志数量
        if (this.logs.length > this.config.maxLogItems) {
            this.logs.shift();
        }
        // 控制台输出
        this.consoleOutput(logItem);
        // 远程日志
        if (this.config.remoteLogging && this.config.remoteEndpoint) {
            this.sendToRemote(logItem);
        }
    }
    // 控制台输出
    consoleOutput(logItem) {
        const { level, message, details } = logItem;
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(`[DEBUG] ${message}`, details || '');
                break;
            case LogLevel.INFO:
                console.info(`[INFO] ${message}`, details || '');
                break;
            case LogLevel.WARN:
                console.warn(`[WARN] ${message}`, details || '');
                break;
            case LogLevel.ERROR:
                console.error(`[ERROR] ${message}`, details || '');
                break;
        }
    }
    // 发送到远程
    async sendToRemote(logItem) {
        if (!this.config.remoteEndpoint)
            return;
        try {
            await fetch(this.config.remoteEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logItem),
                keepalive: true
            });
        }
        catch (err) {
            console.error('发送日志到远程服务器失败', err);
        }
    }
    // 获取日志
    getLogs(level, type) {
        let filtered = [...this.logs];
        if (level) {
            filtered = filtered.filter(log => log.level === level);
        }
        if (type) {
            filtered = filtered.filter(log => log.type === type);
        }
        return filtered;
    }
    // 清除日志
    clearLogs() {
        this.logs = [];
        console.log('日志已清除');
    }
    // 导出日志
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
    // 设置全局错误处理
    setupGlobalErrorHandling() {
        // 捕获未处理的Promise错误
        window.addEventListener('unhandledrejection', (event) => {
            this.error('未处理的Promise拒绝', {
                reason: event.reason,
                promise: event.promise
            }, LogType.ERROR);
        });
        // 捕获全局错误
        window.addEventListener('error', (event) => {
            this.error('全局错误', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            }, LogType.ERROR);
        });
    }
    // 检查日志级别是否启用
    isLevelEnabled(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        const configLevelIndex = levels.indexOf(this.config.logLevel);
        const currentLevelIndex = levels.indexOf(level);
        return currentLevelIndex >= configLevelIndex;
    }
    // 记录网络请求
    logNetworkRequest(url, method, status, duration) {
        this.info(`${method} ${url} - ${status} (${duration}ms)`, {
            url,
            method,
            status,
            duration
        }, LogType.NETWORK);
    }
    // 记录性能指标
    logPerformance(metricName, value, unit = 'ms') {
        this.info(`性能指标: ${metricName} = ${value}${unit}`, {
            name: metricName,
            value,
            unit
        }, LogType.PERFORMANCE);
    }
}
// 创建单例
export const logger = new Logger();
// 默认导出
export default logger;
