import { Router } from 'express';
import { LLMController } from '../controllers/llm-controller';
import { authMiddleware } from '../middleware/auth-middleware';
import { llmConfig } from '../config/llm';

export function createLLMRoutes(): Router {
  const router = Router();
  const llmController = LLMController.getInstance(llmConfig);

  // 创建新对话
  router.post(
    '/conversations',
    authMiddleware,
    llmController.createConversation
  );

  // 发送消息
  router.post(
    '/conversations/:conversationId/messages',
    authMiddleware,
    llmController.sendMessage
  );

  // 获取对话历史
  router.get(
    '/conversations/:conversationId',
    authMiddleware,
    llmController.getConversationHistory
  );

  // 清理对话
  router.delete(
    '/conversations/:conversationId',
    authMiddleware,
    llmController.clearConversation
  );

  return router;
} 