import express from 'express';
import { createFileRoutes } from './routes/file-routes';
import { createLLMRoutes } from './routes/llm-routes';
import { FileStorageService } from './services/file-storage-service';
import { FileController } from './controllers/file-controller';
import { LLMController } from './controllers/llm-controller';
import { Server as HttpServer } from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { llmConfig } from './config/llm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function createApp() {
  const app = express();
  
  // 初始化服务
  const fileService = FileStorageService.getInstance();
  await fileService.initialize();
  
  // 初始化控制器
  const llmController = LLMController.getInstance(llmConfig);

  // 配置中间件
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 注册路由
  app.use('/api/files', createFileRoutes());
  app.use('/api/llm', createLLMRoutes());

  // 错误处理中间件
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('应用程序错误:', err);
    res.status(500).json({
      message: '内部服务器错误',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  return app;
}

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server });
  const fileController = FileController.getInstance();
  const llmController = LLMController.getInstance(llmConfig);

  wss.on('connection', (ws, req) => {
    try {
      // 从 URL 查询参数中获取令牌
      const url = new URL(req.url || '', 'ws://localhost');
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, '未提供认证令牌');
        return;
      }

      // 验证令牌
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        username: string;
        email: string;
      };

      // 设置心跳检测
      const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        }
      }, 30000);

      // 处理连接关闭
      ws.on('close', () => {
        clearInterval(pingInterval);
      });

      // 处理 WebSocket 连接
      const userId = decoded.id.toString();
      fileController.handleWebSocket(ws, userId);
      llmController.handleWebSocket(ws, userId);
    } catch (error) {
      console.error('WebSocket 连接错误:', error);
      ws.close(1008, '认证失败');
    }
  });

  return wss;
}

// 启动服务器
if (require.main === module) {
  const port = process.env.PORT || 3000;
  createApp().then(app => {
    const server = app.listen(port, () => {
      console.log(`服务器正在运行，端口: ${port}`);
    });

    // 设置 WebSocket
    setupWebSocket(server);
  }).catch(error => {
    console.error('启动服务器失败:', error);
    process.exit(1);
  });
} 