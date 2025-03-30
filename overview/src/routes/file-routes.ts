import { Router } from 'express';
import { FileController } from '../controllers/file-controller';
import { AuthMiddleware } from '../middleware/auth-middleware';

export function createFileRoutes(): Router {
  const router = Router();
  const fileController = FileController.getInstance();
  const authMiddleware = new AuthMiddleware();

  // 文件上传
  router.post('/upload', authMiddleware.verifyToken, fileController.uploadFile);

  // 文件下载
  router.get('/download/:fileName', authMiddleware.verifyToken, fileController.downloadFile);

  // 获取文件列表
  router.get('/list', authMiddleware.verifyToken, fileController.listFiles);

  // 删除文件
  router.delete('/:fileName', authMiddleware.verifyToken, fileController.deleteFile);

  return router;
} 