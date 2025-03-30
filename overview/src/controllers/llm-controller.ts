import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth-middleware';
import { LLMService, ModelStatus } from '../services/llm-service';
import { LLMConfig } from '../llm/llm-client';
import WebSocket from 'ws';

export class LLMController {
  private llmService: LLMService;
  private static instance: LLMController;
  private wsClients: Map<string, WebSocket>;

  private constructor(config: LLMConfig) {
    this.llmService = LLMService.getInstance(config);
    this.wsClients = new Map();

    // 监听模型状态变化
    this.llmService.on('modelStatusChanged', ({ conversationId, status }) => {
      this.broadcastStatus(conversationId, status);
    });
  }

  public static getInstance(config?: LLMConfig): LLMController {
    if (!LLMController.instance) {
      if (!config) {
        throw new Error('LLM 配置未提供');
      }
      LLMController.instance = new LLMController(config);
    }
    return LLMController.instance;
  }

  /**
   * 处理 WebSocket 连接
   */
  public handleWebSocket = (ws: WebSocket, userId: string): void => {
    this.wsClients.set(userId, ws);

    ws.on('close', () => {
      this.wsClients.delete(userId);
    });
  };

  /**
   * 广播模型状态
   */
  private broadcastStatus(conversationId: string, status: ModelStatus): void {
    const message = JSON.stringify({
      type: 'modelStatus',
      data: {
        conversationId,
        status
      }
    });

    this.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * 创建新对话
   */
  public createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { systemPrompt } = req.body;
      const userId = req.user?.id.toString();
      const conversationId = `${userId}-${Date.now()}`;

      const context = this.llmService.createContext(conversationId, systemPrompt);
      
      res.status(201).json({
        conversationId: context.conversationId,
        messages: context.messages
      });
    } catch (error) {
      console.error('创建对话失败:', error);
      res.status(500).json({
        message: '创建对话失败',
        error: error instanceof Error ? error.message : undefined
      });
    }
  };

  /**
   * 发送消息
   */
  public sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { conversationId, message, useStream = true } = req.body;
      
      if (!conversationId || !message) {
        res.status(400).json({ message: '缺少必要参数' });
        return;
      }

      // 检查对话是否存在
      const context = this.llmService.getContext(conversationId);
      if (!context) {
        res.status(404).json({ message: '对话不存在' });
        return;
      }

      // 检查模型是否正在生成
      const status = this.llmService.getModelStatus(conversationId);
      if (status.isGenerating) {
        res.status(409).json({ message: '模型正在生成中' });
        return;
      }

      // 生成回复
      const response = await this.llmService.generateResponse(
        conversationId,
        message,
        useStream
      );

      res.json({
        conversationId,
        response,
        status: this.llmService.getModelStatus(conversationId)
      });
    } catch (error) {
      console.error('发送消息失败:', error);
      res.status(500).json({
        message: '发送消息失败',
        error: error instanceof Error ? error.message : undefined
      });
    }
  };

  /**
   * 获取对话历史
   */
  public getConversationHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        res.status(400).json({ message: '缺少对话ID' });
        return;
      }

      const context = this.llmService.getContext(conversationId);
      if (!context) {
        res.status(404).json({ message: '对话不存在' });
        return;
      }

      res.json({
        conversationId: context.conversationId,
        messages: context.messages,
        status: this.llmService.getModelStatus(conversationId)
      });
    } catch (error) {
      console.error('获取对话历史失败:', error);
      res.status(500).json({
        message: '获取对话历史失败',
        error: error instanceof Error ? error.message : undefined
      });
    }
  };

  /**
   * 清理对话
   */
  public clearConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        res.status(400).json({ message: '缺少对话ID' });
        return;
      }

      this.llmService.clearContext(conversationId);
      res.status(204).send();
    } catch (error) {
      console.error('清理对话失败:', error);
      res.status(500).json({
        message: '清理对话失败',
        error: error instanceof Error ? error.message : undefined
      });
    }
  };
} 