import OSS from 'ali-oss';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

export interface FileMetadata {
  name: string;
  size: number;
  mimeType: string;
  uploadDate: Date;
  url: string;
}

export class FileStorageService extends EventEmitter {
  private client: OSS;
  private static instance: FileStorageService;
  private initialized: boolean = false;

  private constructor() {
    super();
    this.client = new OSS({
      region: process.env.OSS_REGION || 'oss-cn-hangzhou',
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.OSS_BUCKET || '',
      endpoint: process.env.OSS_ENDPOINT || ''
    });
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): FileStorageService {
    if (!FileStorageService.instance) {
      FileStorageService.instance = new FileStorageService();
    }
    return FileStorageService.instance;
  }

  /**
   * 初始化存储服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 验证OSS连接
      await this.client.getBucketInfo();
      this.initialized = true;
      console.info('文件存储服务初始化成功');
    } catch (error) {
      console.error('文件存储服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 上传文件
   */
  public async uploadFile(
    file: Buffer | Readable,
    fileName: string,
    mimeType: string,
    onProgress?: (progress: number) => void
  ): Promise<FileMetadata> {
    try {
      const key = `${Date.now()}-${fileName}`;
      
      // 上传文件
      const result = await this.client.put(key, file, {
        mime: mimeType,
        progress: (percentage: number) => {
          if (onProgress) {
            onProgress(Math.floor(percentage * 100));
          }
          this.emit('uploadProgress', {
            fileName,
            progress: Math.floor(percentage * 100)
          });
        }
      });

      // 生成访问URL（默认1小时有效）
      const url = await this.client.signatureUrl(key, {
        expires: 3600
      });

      const metadata: FileMetadata = {
        name: fileName,
        size: result.res.size,
        mimeType,
        uploadDate: new Date(),
        url
      };

      return metadata;
    } catch (error) {
      console.error('上传文件失败:', error);
      throw error;
    }
  }

  /**
   * 下载文件
   */
  public async downloadFile(fileName: string): Promise<Buffer> {
    try {
      const result = await this.client.get(fileName);
      return result.content;
    } catch (error) {
      console.error('下载文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件列表
   */
  public async listFiles(prefix?: string): Promise<string[]> {
    try {
      const result = await this.client.list({
        prefix,
        'max-keys': 1000
      });

      return result.objects?.map(obj => obj.name) || [];
    } catch (error) {
      console.error('获取文件列表失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件
   */
  public async deleteFile(fileName: string): Promise<void> {
    try {
      await this.client.delete(fileName);
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }

  /**
   * 生成文件访问URL
   */
  public async generateFileUrl(
    fileName: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      return await this.client.signatureUrl(fileName, {
        expires: expiresIn
      });
    } catch (error) {
      console.error('生成文件访问URL失败:', error);
      throw error;
    }
  }
} 