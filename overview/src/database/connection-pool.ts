import mysql from 'mysql2/promise';
import { config } from '../../tests/config/database';

export class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool;
  private pool: mysql.Pool;

  private constructor() {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  public static getInstance(): DatabaseConnectionPool {
    if (!DatabaseConnectionPool.instance) {
      DatabaseConnectionPool.instance = new DatabaseConnectionPool();
    }
    return DatabaseConnectionPool.instance;
  }

  public async getConnection(): Promise<mysql.PoolConnection> {
    try {
      return await this.pool.getConnection();
    } catch (error) {
      console.error('获取数据库连接失败:', error);
      throw error;
    }
  }

  public async query<T>(sql: string, values?: any[]): Promise<T[]> {
    let connection: mysql.PoolConnection | null = null;
    try {
      connection = await this.getConnection();
      const [rows] = await connection.query(sql, values);
      return rows as T[];
    } catch (error) {
      console.error('执行查询失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  public async execute(sql: string, values?: any[]): Promise<mysql.ResultSetHeader> {
    let connection: mysql.PoolConnection | null = null;
    try {
      connection = await this.getConnection();
      const [result] = await connection.execute(sql, values);
      return result as mysql.ResultSetHeader;
    } catch (error) {
      console.error('执行更新失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  public async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    let connection: mysql.PoolConnection | null = null;
    try {
      connection = await this.getConnection();
      await connection.beginTransaction();
      
      const result = await callback(connection);
      
      await connection.commit();
      return result;
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('事务执行失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  public async end(): Promise<void> {
    await this.pool.end();
  }
} 