import { ref, Ref } from 'vue';
import * as mysql from 'mysql2/promise';

/**
 * 数据库状态
 */
enum DatabaseStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

/**
 * 数据库配置接口
 */
interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
}

/**
 * 数据库服务 - 处理MySQL数据库连接和操作
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private pool: mysql.Pool | null = null;
  private config: DatabaseConfig | null = null;
  private status: Ref<DatabaseStatus> = ref(DatabaseStatus.DISCONNECTED);
  private error: Ref<string | null> = ref(null);
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_INTERVAL = 5000; // 5秒

  private constructor() {
    // 从环境变量获取配置
    this.loadConfig();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * 从环境变量加载数据库配置
   */
  private loadConfig(): void {
    // 从环境变量获取或使用默认配置
    // 实际应用中应从安全的配置源获取
    const env = import.meta.env;
    
    this.config = {
      host: env.VITE_DB_HOST || 'localhost',
      port: Number(env.VITE_DB_PORT) || 3306,
      user: env.VITE_DB_USER || 'ai_user',
      password: env.VITE_DB_PASSWORD || 'ai123',
      database: env.VITE_DB_NAME || 'ai_agent_db',
      connectionLimit: Number(env.VITE_DB_CONNECTION_LIMIT) || 10
    };
  }

  /**
   * 连接到数据库
   */
  public async connect(): Promise<boolean> {
    if (this.status.value === DatabaseStatus.CONNECTING) {
      return false;
    }

    this.status.value = DatabaseStatus.CONNECTING;
    this.error.value = null;

    try {
      if (!this.config) {
        throw new Error('数据库配置未加载');
      }

      // 创建连接池
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        waitForConnections: true,
        connectionLimit: this.config.connectionLimit,
        queueLimit: 0
      });

      // 测试连接
      const connection = await this.pool.getConnection();
      connection.release();
      
      this.status.value = DatabaseStatus.CONNECTED;
      this.reconnectAttempts = 0;
      console.log('数据库连接成功');
      return true;
    } catch (error) {
      this.status.value = DatabaseStatus.ERROR;
      this.error.value = error instanceof Error ? error.message : '未知错误';
      console.error('数据库连接失败:', this.error.value);
      
      // 尝试重连
      this.scheduleReconnect();
      return false;
    }
  }

  /**
   * 断开数据库连接
   */
  public async disconnect(): Promise<void> {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    
    this.status.value = DatabaseStatus.DISCONNECTED;
    console.log('数据库连接已断开');
  }

  /**
   * 获取数据库连接状态
   */
  public getStatus(): { status: Ref<DatabaseStatus>, error: Ref<string | null> } {
    return {
      status: this.status,
      error: this.error
    };
  }

  /**
   * 安排重新连接
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      console.log(`计划在 ${this.RECONNECT_INTERVAL}ms 后进行第 ${this.reconnectAttempts} 次重连`);
      
      this.reconnectTimer = window.setTimeout(() => {
        this.connect();
      }, this.RECONNECT_INTERVAL);
    } else {
      console.error(`达到最大重连尝试次数 (${this.MAX_RECONNECT_ATTEMPTS})，停止重连`);
    }
  }

  /**
   * 执行查询
   */
  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.pool) {
      await this.connect();
      if (!this.pool) {
        throw new Error('无法连接到数据库');
      }
    }

    try {
      const [results] = await this.pool.query(sql, params);
      return results as T[];
    } catch (error) {
      console.error('查询执行失败:', error);
      throw error;
    }
  }

  /**
   * 执行单行插入
   */
  public async insert(table: string, data: Record<string, any>): Promise<number> {
    if (!this.pool) {
      await this.connect();
      if (!this.pool) {
        throw new Error('无法连接到数据库');
      }
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    try {
      const [result] = await this.pool.query(sql, values);
      return (result as mysql.ResultSetHeader).insertId;
    } catch (error) {
      console.error('插入操作失败:', error);
      throw error;
    }
  }

  /**
   * 执行批量插入
   */
  public async batchInsert(table: string, data: Record<string, any>[]): Promise<number[]> {
    if (data.length === 0) {
      return [];
    }

    if (!this.pool) {
      await this.connect();
      if (!this.pool) {
        throw new Error('无法连接到数据库');
      }
    }

    // 假设所有对象具有相同的键
    const keys = Object.keys(data[0]);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    try {
      const insertIds: number[] = [];
      // 使用事务确保批量插入的原子性
      const connection = await this.pool.getConnection();
      await connection.beginTransaction();
      
      try {
        for (const item of data) {
          const values = keys.map(key => item[key]);
          const [result] = await connection.query(sql, values);
          insertIds.push((result as mysql.ResultSetHeader).insertId);
        }
        
        await connection.commit();
        connection.release();
        return insertIds;
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('批量插入操作失败:', error);
      throw error;
    }
  }

  /**
   * 执行更新操作
   */
  public async update(
    table: string, 
    data: Record<string, any>, 
    whereClause: string, 
    whereParams: any[] = []
  ): Promise<number> {
    if (!this.pool) {
      await this.connect();
      if (!this.pool) {
        throw new Error('无法连接到数据库');
      }
    }

    const setStatements = Object.entries(data)
      .map(([key]) => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(data), ...whereParams];
    const sql = `UPDATE ${table} SET ${setStatements} WHERE ${whereClause}`;
    
    try {
      const [result] = await this.pool.query(sql, values);
      return (result as mysql.ResultSetHeader).affectedRows;
    } catch (error) {
      console.error('更新操作失败:', error);
      throw error;
    }
  }

  /**
   * 执行删除操作
   */
  public async delete(table: string, whereClause: string, whereParams: any[] = []): Promise<number> {
    if (!this.pool) {
      await this.connect();
      if (!this.pool) {
        throw new Error('无法连接到数据库');
      }
    }

    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    try {
      const [result] = await this.pool.query(sql, whereParams);
      return (result as mysql.ResultSetHeader).affectedRows;
    } catch (error) {
      console.error('删除操作失败:', error);
      throw error;
    }
  }

  /**
   * 执行事务
   */
  public async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    if (!this.pool) {
      await this.connect();
      if (!this.pool) {
        throw new Error('无法连接到数据库');
      }
    }

    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

// 导出单例实例
export const databaseService = DatabaseService.getInstance();

// 导出枚举供外部使用
export { DatabaseStatus }; 