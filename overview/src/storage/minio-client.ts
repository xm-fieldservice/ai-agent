import { Client } from 'minio';
import { Readable } from 'stream';
import { promisify } from 'util';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';

export interface MinioConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percentage: number;
}

export class MinioClient extends EventEmitter {
  private client: Client;
  private bucket: string;
  private static instance: MinioClient;
  private readonly CHUNK_SIZE = 5 * 1024 * 1024; // 5MB 分片大小

  private constructor(config: MinioConfig) {
    super();
    this.client = new Client({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey
    });
    this.bucket = config.bucket;
  }

  /**
   * 获取单例实例
   */
  public static getInstance(config?: MinioConfig): MinioClient {
    if (!MinioClient.instance) {
      if (!config) {
        throw new Error('MinIO 配置未提供');
      }
      MinioClient.instance = new MinioClient(config);
    }
    return MinioClient.instance;
  }

  /**
   * 初始化存储桶
   */
  public async initialize(): Promise<void> {
    const bucketExists = await this.client.bucketExists(this.bucket);
    if (!bucketExists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
    }
  }

  /**
   * 分片上传文件
   */
  public async uploadLargeFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const uniqueFileName = await this.generateUniqueFileName(fileName);
    const totalSize = file.length;
    let uploadedSize = 0;

    try {
      // 初始化分片上传
      const uploadId = await this.client.initiateNewMultipartUpload(
        this.bucket,
        uniqueFileName,
        { 'Content-Type': mimeType }
      );

      // 计算分片数量
      const chunks: Buffer[] = [];
      for (let i = 0; i < file.length; i += this.CHUNK_SIZE) {
        chunks.push(file.slice(i, i + this.CHUNK_SIZE));
      }

      // 上传分片
      const uploadPromises = chunks.map(async (chunk, index) => {
        const result = await this.client.putObject(
          this.bucket,
          `${uniqueFileName}.part${index + 1}`,
          chunk
        );

        uploadedSize += chunk.length;
        if (onProgress) {
          onProgress({
            fileName: uniqueFileName,
            loaded: uploadedSize,
            total: totalSize,
            percentage: Math.round((uploadedSize / totalSize) * 100)
          });
        }

        return {
          part: index + 1,
          etag: result.etag
        };
      });

      // 等待所有分片上传完成
      const uploadedParts = await Promise.all(uploadPromises);

      // 完成分片上传
      await this.client.completeMultipartUpload(
        this.bucket,
        uniqueFileName,
        uploadId,
        uploadedParts
      );

      // 删除临时分片文件
      await Promise.all(
        chunks.map((_, index) =>
          this.client.removeObject(this.bucket, `${uniqueFileName}.part${index + 1}`)
        )
      );

      return uniqueFileName;
    } catch (error) {
      // 清理临时分片文件
      try {
        await Promise.all(
          Array.from({ length: Math.ceil(totalSize / this.CHUNK_SIZE) }).map((_, index) =>
            this.client.removeObject(this.bucket, `${uniqueFileName}.part${index + 1}`)
          )
        );
      } catch (cleanupError) {
        console.error('清理临时分片文件失败:', cleanupError);
      }

      throw error;
    }
  }

  /**
   * 上传文件（支持进度监控）
   */
  public async uploadFile(
    file: Buffer | Readable,
    fileName: string,
    mimeType: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // 对于大文件使用分片上传
    if (file instanceof Buffer && file.length > this.CHUNK_SIZE) {
      return this.uploadLargeFile(file, fileName, mimeType, onProgress);
    }

    // 生成唯一的文件名
    const uniqueFileName = await this.generateUniqueFileName(fileName);
    
    if (file instanceof Buffer) {
      // 上传 Buffer
      await this.client.putObject(
        this.bucket,
        uniqueFileName,
        file,
        file.length,
        { 'Content-Type': mimeType }
      );

      if (onProgress) {
        onProgress({
          fileName: uniqueFileName,
          loaded: file.length,
          total: file.length,
          percentage: 100
        });
      }
    } else {
      // 上传流
      let uploadedSize = 0;
      const chunks: Buffer[] = [];

      await new Promise<void>((resolve, reject) => {
        const stream = file as Readable;
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
          uploadedSize += chunk.length;
          if (onProgress) {
            onProgress({
              fileName: uniqueFileName,
              loaded: uploadedSize,
              total: -1, // 流的总大小未知
              percentage: -1
            });
          }
        });

        stream.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            await this.client.putObject(
              this.bucket,
              uniqueFileName,
              buffer,
              buffer.length,
              { 'Content-Type': mimeType }
            );

            if (onProgress) {
              onProgress({
                fileName: uniqueFileName,
                loaded: buffer.length,
                total: buffer.length,
                percentage: 100
              });
            }

            resolve();
          } catch (error) {
            reject(error);
          }
        });

        stream.on('error', reject);
      });
    }

    return uniqueFileName;
  }

  /**
   * 下载文件
   */
  public async downloadFile(fileName: string): Promise<Buffer> {
    try {
      const dataStream = await this.client.getObject(this.bucket, fileName);
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        dataStream.on('data', (chunk) => chunks.push(chunk));
        dataStream.on('end', () => resolve(Buffer.concat(chunks)));
        dataStream.on('error', reject);
      });
    } catch (error) {
      console.error('下载文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件访问URL
   */
  public async getFileUrl(fileName: string, expiryInSeconds: number = 7200): Promise<string> {
    return await this.client.presignedGetObject(this.bucket, fileName, expiryInSeconds);
  }

  /**
   * 删除文件
   */
  public async deleteFile(fileName: string): Promise<void> {
    await this.client.removeObject(this.bucket, fileName);
  }

  /**
   * 检查文件是否存在
   */
  public async fileExists(fileName: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, fileName);
      return true;
    } catch (error) {
      if ((error as any).code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * 生成唯一文件名
   */
  private async generateUniqueFileName(originalName: string): Promise<string> {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop() || '';
    const hash = createHash('md5')
      .update(`${timestamp}${randomString}${originalName}`)
      .digest('hex')
      .substring(0, 8);

    return `${timestamp}-${hash}.${extension}`;
  }

  /**
   * 列出文件
   */
  public async listFiles(prefix: string = '', recursive: boolean = true): Promise<string[]> {
    const fileNames: string[] = [];
    const stream = this.client.listObjects(this.bucket, prefix, recursive);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) {
          fileNames.push(obj.name);
        }
      });
      stream.on('end', () => resolve(fileNames));
      stream.on('error', reject);
    });
  }
} 