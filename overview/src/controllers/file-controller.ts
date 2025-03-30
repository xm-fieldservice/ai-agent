import { Request, Response } from 'express';
import { FileStorageService, FileMetadata } from '../services/file-storage-service';
import multer from 'multer';
import { AuthRequest } from '../middleware/auth-middleware';
import WebSocket from 'ws';
import { UploadProgress } from '../storage/minio-client';

// 配置 multer 用于处理文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 增加限制到 100MB
  },
}).single('file');

export class FileController {
  private fileService: FileStorageService;
  private static instance: FileController;
  private wsClients: Map<string, WebSocket>;

  private constructor() {
    this.fileService = FileStorageService.getInstance();
    this.wsClients = new Map();

    // 监听上传进度事件
    this.fileService.on('uploadProgress', (progress: UploadProgress) => {
      this.broadcastProgress(progress);
    });
  }

  public static getInstance(): FileController {
    if (!FileController.instance) {
      FileController.instance = new FileController();
    }
    return FileController.instance;
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
   * 广播上传进度
   */
  private broadcastProgress(progress: UploadProgress): void {
    const message = JSON.stringify({
      type: 'uploadProgress',
      data: progress
    });

    this.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * 上传文件
   */
  public uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
    upload(req, res, async (err) => {
      try {
        if (err instanceof multer.MulterError) {
          res.status(400).json({ message: '文件上传错误', error: err.message });
          return;
        } else if (err) {
          res.status(500).json({ message: '服务器错误', error: err.message });
          return;
        }

        if (!req.file) {
          res.status(400).json({ message: '未提供文件' });
          return;
        }

        // 获取用户的 WebSocket 连接
        const userId = req.user?.id.toString() || '';
        const wsClient = this.wsClients.get(userId);

        const metadata = await this.fileService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          wsClient ? (progress) => {
            if (wsClient.readyState === WebSocket.OPEN) {
              wsClient.send(JSON.stringify({
                type: 'uploadProgress',
                data: progress
              }));
            }
          } : undefined
        );

        res.status(201).json(metadata);
      } catch (error) {
        console.error('文件上传失败:', error);
        res.status(500).json({ message: '文件上传失败', error });
      }
    });
  };

  /**
   * 下载文件
   */
  public downloadFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { fileName } = req.params;
      
      if (!fileName) {
        res.status(400).json({ message: '未提供文件名' });
        return;
      }

      const exists = await this.fileService.fileExists(fileName);
      if (!exists) {
        res.status(404).json({ message: '文件不存在' });
        return;
      }

      const fileBuffer = await this.fileService.downloadFile(fileName);
      res.send(fileBuffer);
    } catch (error) {
      console.error('文件下载失败:', error);
      res.status(500).json({ message: '文件下载失败', error });
    }
  };

  /**
   * 获取文件列表
   */
  public listFiles = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { prefix } = req.query;
      const files = await this.fileService.listFiles(prefix as string);
      res.json(files);
    } catch (error) {
      console.error('获取文件列表失败:', error);
      res.status(500).json({ message: '获取文件列表失败', error });
    }
  };

  /**
   * 删除文件
   */
  public deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { fileName } = req.params;
      
      if (!fileName) {
        res.status(400).json({ message: '未提供文件名' });
        return;
      }

      const exists = await this.fileService.fileExists(fileName);
      if (!exists) {
        res.status(404).json({ message: '文件不存在' });
        return;
      }

      await this.fileService.deleteFile(fileName);
      res.status(204).send();
    } catch (error) {
      console.error('文件删除失败:', error);
      res.status(500).json({ message: '文件删除失败', error });
    }
  };
} 