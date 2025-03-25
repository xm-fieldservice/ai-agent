/**
 * 日志系统
 * 用于收集错误日志和性能指标
 */

// 日志级别
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// 日志类型
export enum LogType {
  OPERATION = 'operation', // 操作日志
  ERROR = 'error',         // 错误日志
  PERFORMANCE = 'performance', // 性能日志
  NETWORK = 'network'      // 网络日志
}

// 日志项结构
export interface LogItem {
  id: string;
  timestamp: number;
  level: LogLevel;
  type: LogType;
  message: string;
  details?: any;
  userId?: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    screenSize: string;
    connection?: string;
  };
  appInfo?: {
    version: string;
    environment: string;
  };
}

// 日志配置
interface LoggerConfig {
  maxLogItems: number;
  enabled: boolean;
  remoteLogging: boolean;
  remoteEndpoint?: string;
  logLevel: LogLevel;
  includeDeviceInfo: boolean;
}

// 默认配置
const defaultConfig: LoggerConfig = {
  maxLogItems: 100,
  enabled: true,
  remoteLogging: false,
  logLevel: LogLevel.INFO,
  includeDeviceInfo: true
};

class Logger {
  private config: LoggerConfig;
  private logs: LogItem[] = [];
  private logCounter = 0;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.setupGlobalErrorHandling();
  }

  // 初始化日志系统
  public init(config: Partial<LoggerConfig> = {}) {
    this.config = { ...this.config, ...config };
    console.log('日志系统初始化完成', this.config);
  }

  // 创建日志项
  private createLogItem(level: LogLevel, type: LogType, message: string, details?: any): LogItem {
    const id = `log_${Date.now()}_${this.logCounter++}`;
    const logItem: LogItem = {
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
          ? (navigator as any).connection?.effectiveType 
          : undefined
      };
    }

    return logItem;
  }

  // 日志记录方法
  public debug(message: string, details?: any, type: LogType = LogType.OPERATION) {
    if (!this.config.enabled || !this.isLevelEnabled(LogLevel.DEBUG)) return;
    this.addLog(LogLevel.DEBUG, type, message, details);
  }

  public info(message: string, details?: any, type: LogType = LogType.OPERATION) {
    if (!this.config.enabled || !this.isLevelEnabled(LogLevel.INFO)) return;
    this.addLog(LogLevel.INFO, type, message, details);
  }

  public warn(message: string, details?: any, type: LogType = LogType.OPERATION) {
    if (!this.config.enabled || !this.isLevelEnabled(LogLevel.WARN)) return;
    this.addLog(LogLevel.WARN, type, message, details);
  }

  public error(message: string, details?: any, type: LogType = LogType.ERROR) {
    if (!this.config.enabled || !this.isLevelEnabled(LogLevel.ERROR)) return;
    this.addLog(LogLevel.ERROR, type, message, details);
  }

  // 添加日志
  private addLog(level: LogLevel, type: LogType, message: string, details?: any) {
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
  private consoleOutput(logItem: LogItem) {
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
  private async sendToRemote(logItem: LogItem) {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logItem),
        keepalive: true
      });
    } catch (err) {
      console.error('发送日志到远程服务器失败', err);
    }
  }

  // 获取日志
  public getLogs(level?: LogLevel, type?: LogType): LogItem[] {
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
  public clearLogs() {
    this.logs = [];
    console.log('日志已清除');
  }

  // 导出日志
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // 设置全局错误处理
  private setupGlobalErrorHandling() {
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
  private isLevelEnabled(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= configLevelIndex;
  }

  // 记录网络请求
  public logNetworkRequest(url: string, method: string, status: number, duration: number) {
    this.info(`${method} ${url} - ${status} (${duration}ms)`, {
      url,
      method,
      status,
      duration
    }, LogType.NETWORK);
  }

  // 记录性能指标
  public logPerformance(metricName: string, value: number, unit: string = 'ms') {
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