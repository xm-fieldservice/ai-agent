import { EventEmitter } from 'events';
import { LLMClient, Message, GenerationProgress, LLMConfig } from '../llm/llm-client';

export interface DialogueContext {
  conversationId: string;
  messages: Message[];
  lastUpdated: Date;
}

export interface ModelStatus {
  isGenerating: boolean;
  currentProgress?: GenerationProgress;
  error?: string;
}

export class LLMService extends EventEmitter {
  private llmClient: LLMClient;
  private static instance: LLMService;
  private contexts: Map<string, DialogueContext>;
  private modelStatus: Map<string, ModelStatus>;
  private readonly MAX_CONTEXT_SIZE = 20;
  private readonly CONTEXT_EXPIRY_TIME = 30 * 60 * 1000; // 30分钟

  private constructor(config: LLMConfig) {
    super();
    this.llmClient = LLMClient.getInstance(config);
    this.contexts = new Map();
    this.modelStatus = new Map();

    // 定期清理过期的上下文
    setInterval(() => this.cleanExpiredContexts(), this.CONTEXT_EXPIRY_TIME);
  }

  /**
   * 获取单例实例
   */
  public static getInstance(config?: LLMConfig): LLMService {
    if (!LLMService.instance) {
      if (!config) {
        throw new Error('LLM 配置未提供');
      }
      LLMService.instance = new LLMService(config);
    }
    return LLMService.instance;
  }

  /**
   * 创建新的对话上下文
   */
  public createContext(conversationId: string, systemPrompt?: string): DialogueContext {
    const context: DialogueContext = {
      conversationId,
      messages: systemPrompt ? [{ role: 'system', content: systemPrompt }] : [],
      lastUpdated: new Date()
    };
    this.contexts.set(conversationId, context);
    return context;
  }

  /**
   * 获取对话上下文
   */
  public getContext(conversationId: string): DialogueContext | undefined {
    return this.contexts.get(conversationId);
  }

  /**
   * 更新对话上下文
   */
  private updateContext(conversationId: string, message: Message): void {
    let context = this.contexts.get(conversationId);
    if (!context) {
      context = this.createContext(conversationId);
    }

    context.messages.push(message);
    context.lastUpdated = new Date();

    // 如果上下文过大，移除最早的消息（保留系统消息）
    if (context.messages.length > this.MAX_CONTEXT_SIZE) {
      const systemMessages = context.messages.filter(m => m.role === 'system');
      const nonSystemMessages = context.messages.filter(m => m.role !== 'system')
        .slice(-this.MAX_CONTEXT_SIZE + systemMessages.length);
      context.messages = [...systemMessages, ...nonSystemMessages];
    }
  }

  /**
   * 清理过期的上下文
   */
  private cleanExpiredContexts(): void {
    const now = Date.now();
    for (const [conversationId, context] of this.contexts.entries()) {
      if (now - context.lastUpdated.getTime() > this.CONTEXT_EXPIRY_TIME) {
        this.contexts.delete(conversationId);
      }
    }
  }

  /**
   * 获取模型状态
   */
  public getModelStatus(conversationId: string): ModelStatus {
    return (
      this.modelStatus.get(conversationId) || {
        isGenerating: false
      }
    );
  }

  /**
   * 更新模型状态
   */
  private updateModelStatus(
    conversationId: string,
    status: Partial<ModelStatus>
  ): void {
    const currentStatus = this.getModelStatus(conversationId);
    const newStatus = { ...currentStatus, ...status };
    this.modelStatus.set(conversationId, newStatus);
    this.emit('modelStatusChanged', { conversationId, status: newStatus });
  }

  /**
   * 生成回复
   */
  public async generateResponse(
    conversationId: string,
    userMessage: string,
    useStream: boolean = true
  ): Promise<string> {
    try {
      // 更新用户消息到上下文
      const userMessageObj: Message = { role: 'user', content: userMessage };
      this.updateContext(conversationId, userMessageObj);

      // 获取当前上下文的所有消息
      const context = this.getContext(conversationId);
      if (!context) {
        throw new Error('对话上下文不存在');
      }

      // 更新模型状态为生成中
      this.updateModelStatus(conversationId, {
        isGenerating: true,
        error: undefined
      });

      let response: string;
      if (useStream) {
        // 使用流式生成
        response = await this.llmClient.generateStreamResponse(
          context.messages,
          (progress) => {
            this.updateModelStatus(conversationId, {
              isGenerating: !progress.isComplete,
              currentProgress: progress
            });
          }
        );
      } else {
        // 使用非流式生成
        const result = await this.llmClient.generateResponse(context.messages);
        response = result.choices[0].message.content;
      }

      // 更新助手回复到上下文
      const assistantMessage: Message = {
        role: 'assistant',
        content: response
      };
      this.updateContext(conversationId, assistantMessage);

      // 更新模型状态为完成
      this.updateModelStatus(conversationId, {
        isGenerating: false,
        currentProgress: undefined
      });

      return response;
    } catch (error) {
      // 更新模型状态为错误
      this.updateModelStatus(conversationId, {
        isGenerating: false,
        error: error instanceof Error ? error.message : '生成回复失败'
      });
      throw error;
    }
  }

  /**
   * 清理对话上下文
   */
  public clearContext(conversationId: string): void {
    this.contexts.delete(conversationId);
    this.modelStatus.delete(conversationId);
  }
} 