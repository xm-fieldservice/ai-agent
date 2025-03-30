import { EventEmitter } from 'events';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import rateLimit from 'axios-rate-limit';
import axiosRetry from 'axios-retry';

export interface LLMConfig {
  apiEndpoint: string;
  apiKey: string;
  modelName: string;
  maxTokens?: number;
  temperature?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: Message[];
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResponse {
  id: string;
  choices: {
    message: Message;
    finishReason: string | null;
  }[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  id: string;
  choices: {
    delta: Partial<Message>;
    finishReason: string | null;
  }[];
}

export interface GenerationProgress {
  messageId: string;
  content: string;
  isComplete: boolean;
  error?: string;
}

export class LLMClient extends EventEmitter {
  private client: AxiosInstance;
  private config: LLMConfig;
  private static instance: LLMClient;

  private constructor(config: LLMConfig) {
    super();
    this.config = config;
    
    // 创建基础客户端
    this.client = axios.create({
      baseURL: config.apiEndpoint,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000, // 30秒超时
    });

    // 添加速率限制
    this.client = rateLimit(this.client, {
      maxRequests: 10, // 每秒最多10个请求
      perMilliseconds: 1000
    });

    // 添加重试机制
    axiosRetry(this.client, {
      retries: 3, // 最多重试3次
      retryDelay: axiosRetry.exponentialDelay, // 指数退避
      retryCondition: (error) => {
        // 只重试网络错误和5xx错误
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ?? 0) >= 500;
      }
    });
  }

  /**
   * 获取单例实例
   */
  public static getInstance(config?: LLMConfig): LLMClient {
    if (!LLMClient.instance) {
      if (!config) {
        throw new Error('LLM 配置未提供');
      }
      LLMClient.instance = new LLMClient(config);
    }
    return LLMClient.instance;
  }

  /**
   * 生成回复（流式）
   */
  public async generateStreamResponse(
    messages: Message[],
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<string> {
    const request: CompletionRequest = {
      messages,
      stream: true,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature
    };

    try {
      const response = await this.client.post('/v1/chat/completions', request, {
        responseType: 'stream',
        timeout: 60000 // 流式请求使用更长的超时时间
      });

      return new Promise((resolve, reject) => {
        let messageId = '';
        let content = '';
        let lastProgressTime = Date.now();

        const checkProgress = setInterval(() => {
          // 如果30秒没有新的进度，认为连接已断开
          if (Date.now() - lastProgressTime > 30000) {
            clearInterval(checkProgress);
            reject(new Error('生成响应超时'));
          }
        }, 1000);

        response.data.on('data', (chunk: Buffer) => {
          lastProgressTime = Date.now();
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.trim() === 'data: [DONE]') {
              if (onProgress) {
                onProgress({
                  messageId,
                  content,
                  isComplete: true
                });
              }
              resolve(content);
              return;
            }

            try {
              const data = JSON.parse(line.replace('data: ', '')) as StreamChunk;
              if (!messageId) messageId = data.id;

              const delta = data.choices[0].delta.content || '';
              content += delta;

              if (onProgress) {
                onProgress({
                  messageId,
                  content,
                  isComplete: false
                });
              }
            } catch (error) {
              console.error('解析流数据失败:', error);
            }
          }
        });

        response.data.on('end', () => {
          clearInterval(checkProgress);
          if (onProgress) {
            onProgress({
              messageId,
              content,
              isComplete: true
            });
          }
          resolve(content);
        });

        response.data.on('error', (error: Error) => {
          clearInterval(checkProgress);
          if (onProgress) {
            onProgress({
              messageId,
              content,
              isComplete: true,
              error: error.message
            });
          }
          reject(error);
        });
      });
    } catch (error) {
      console.error('生成回复失败:', error);
      throw error;
    }
  }

  /**
   * 生成回复（非流式）
   */
  public async generateResponse(messages: Message[]): Promise<CompletionResponse> {
    const request: CompletionRequest = {
      messages,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature
    };

    try {
      const response = await this.client.post('/v1/chat/completions', request);
      return response.data;
    } catch (error) {
      console.error('生成回复失败:', error);
      throw error;
    }
  }

  /**
   * 计算令牌数量
   */
  public async countTokens(messages: Message[]): Promise<number> {
    try {
      const response = await this.client.post('/v1/chat/tokens', { messages });
      return response.data.totalTokens;
    } catch (error) {
      console.error('计算令牌数量失败:', error);
      throw error;
    }
  }
} 