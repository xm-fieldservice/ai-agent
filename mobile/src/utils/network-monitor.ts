/**
 * 网络请求监控工具
 * 用于拦截和记录API请求
 */
import logger, { LogType } from './logger';

// 请求状态
export enum RequestStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error'
}

// 请求记录
export interface RequestRecord {
  id: string;
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  statusText?: string;
  requestSize?: number;
  responseSize?: number;
  requestBody?: any;
  responseBody?: any;
  requestStatus: RequestStatus;
  errorMessage?: string;
}

interface NetworkMonitorConfig {
  enabled: boolean;
  maxRequests: number;
  includeRequestBody: boolean;
  includeResponseBody: boolean;
  logRequests: boolean;
}

// 默认配置
const defaultConfig: NetworkMonitorConfig = {
  enabled: true,
  maxRequests: 50,
  includeRequestBody: false,
  includeResponseBody: false,
  logRequests: true
};

class NetworkMonitor {
  private config: NetworkMonitorConfig;
  private requests: RequestRecord[] = [];
  private originalFetch: typeof fetch;
  private requestCounter = 0;
  
  constructor(config: Partial<NetworkMonitorConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.originalFetch = window.fetch;
  }
  
  // 初始化网络监控
  public init() {
    if (!this.config.enabled) return;
    
    // 拦截fetch请求
    this.interceptFetch();
    
    logger.info('网络监控初始化完成', this.config, LogType.NETWORK);
  }
  
  // 拦截fetch请求
  private interceptFetch() {
    const self = this;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const requestId = `req_${Date.now()}_${self.requestCounter++}`;
      const startTime = Date.now();
      const method = init?.method || 'GET';
      const url = typeof input === 'string' ? input : input.url;
      
      // 创建请求记录
      const requestRecord: RequestRecord = {
        id: requestId,
        url,
        method,
        startTime,
        requestStatus: RequestStatus.PENDING
      };
      
      // 添加请求体
      if (self.config.includeRequestBody && init?.body) {
        try {
          requestRecord.requestBody = init.body instanceof FormData 
            ? '(FormData)'
            : typeof init.body === 'string' 
              ? JSON.parse(init.body) 
              : init.body;
        } catch {
          requestRecord.requestBody = '(unparsable body)';
        }
      }
      
      // 添加请求记录
      self.addRequest(requestRecord);
      
      return self.originalFetch.apply(window, [input, init])
        .then((response) => {
          // 克隆响应，以便可以多次读取body
          const clonedResponse = response.clone();
          const endTime = Date.now();
          
          // 更新请求记录
          requestRecord.endTime = endTime;
          requestRecord.duration = endTime - startTime;
          requestRecord.status = response.status;
          requestRecord.statusText = response.statusText;
          requestRecord.requestStatus = response.ok ? RequestStatus.SUCCESS : RequestStatus.ERROR;
          
          // 尝试获取响应大小
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            requestRecord.responseSize = parseInt(contentLength, 10);
          }
          
          // 读取响应体
          if (self.config.includeResponseBody) {
            clonedResponse.text().then(text => {
              try {
                requestRecord.responseBody = text ? JSON.parse(text) : null;
              } catch {
                requestRecord.responseBody = text || null;
              }
              self.updateRequest(requestRecord);
            }).catch(() => {
              // 无法读取响应体
              requestRecord.responseBody = '(unreadable body)';
              self.updateRequest(requestRecord);
            });
          }
          
          // 记录网络请求
          if (self.config.logRequests) {
            logger.logNetworkRequest(
              requestRecord.url,
              requestRecord.method,
              requestRecord.status || 0,
              requestRecord.duration || 0
            );
          }
          
          self.updateRequest(requestRecord);
          return response;
        })
        .catch((error) => {
          const endTime = Date.now();
          
          // 更新请求记录
          requestRecord.endTime = endTime;
          requestRecord.duration = endTime - startTime;
          requestRecord.requestStatus = RequestStatus.ERROR;
          requestRecord.errorMessage = error.message;
          
          // 记录错误
          logger.error(`请求失败: ${requestRecord.method} ${requestRecord.url}`, {
            error: error.message,
            request: requestRecord
          }, LogType.NETWORK);
          
          self.updateRequest(requestRecord);
          throw error;
        });
    };
  }
  
  // 添加请求记录
  private addRequest(request: RequestRecord) {
    this.requests.push(request);
    
    // 限制请求数量
    if (this.requests.length > this.config.maxRequests) {
      this.requests.shift();
    }
  }
  
  // 更新请求记录
  private updateRequest(updatedRequest: RequestRecord) {
    const index = this.requests.findIndex(req => req.id === updatedRequest.id);
    if (index !== -1) {
      this.requests[index] = updatedRequest;
    }
  }
  
  // 获取请求记录
  public getRequests(status?: RequestStatus): RequestRecord[] {
    if (status) {
      return this.requests.filter(req => req.requestStatus === status);
    }
    return [...this.requests];
  }
  
  // 清除请求记录
  public clearRequests() {
    this.requests = [];
    logger.info('请求记录已清除', null, LogType.NETWORK);
  }
  
  // 恢复原始fetch
  public restore() {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      logger.info('已恢复原始fetch', null, LogType.NETWORK);
    }
  }
  
  // 获取网络统计信息
  public getNetworkStats(): Record<string, any> {
    const totalRequests = this.requests.length;
    const successfulRequests = this.requests.filter(req => req.requestStatus === RequestStatus.SUCCESS).length;
    const failedRequests = this.requests.filter(req => req.requestStatus === RequestStatus.ERROR).length;
    const pendingRequests = this.requests.filter(req => req.requestStatus === RequestStatus.PENDING).length;
    
    const completedRequests = this.requests.filter(req => req.duration !== undefined);
    const totalDuration = completedRequests.reduce((sum, req) => sum + (req.duration || 0), 0);
    const avgDuration = completedRequests.length > 0 ? totalDuration / completedRequests.length : 0;
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      pendingRequests,
      avgResponseTime: avgDuration,
      timestamp: Date.now()
    };
  }
}

// 创建单例
export const networkMonitor = new NetworkMonitor();

// 默认导出
export default networkMonitor; 