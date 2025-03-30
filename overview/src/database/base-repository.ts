import { DatabaseConnectionPool } from './connection-pool';
import mysql from 'mysql2/promise';

export abstract class BaseRepository<T> {
  protected pool: DatabaseConnectionPool;
  protected tableName: string;

  constructor(tableName: string) {
    this.pool = DatabaseConnectionPool.getInstance();
    this.tableName = tableName;
  }

  /**
   * 根据ID查找记录
   */
  public async findById(id: number): Promise<T | null> {
    try {
      const results = await this.pool.query<T>(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return results[0] || null;
    } catch (error) {
      console.error(`查找记录失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 查找所有记录
   */
  public async findAll(): Promise<T[]> {
    try {
      return await this.pool.query<T>(`SELECT * FROM ${this.tableName}`);
    } catch (error) {
      console.error('查找所有记录失败:', error);
      throw error;
    }
  }

  /**
   * 创建新记录
   */
  public async create(data: Partial<T>): Promise<number> {
    try {
      const result = await this.pool.execute(
        `INSERT INTO ${this.tableName} SET ?`,
        [data]
      );
      return result.insertId;
    } catch (error) {
      console.error('创建记录失败:', error);
      throw error;
    }
  }

  /**
   * 更新记录
   */
  public async update(id: number, data: Partial<T>): Promise<boolean> {
    try {
      const result = await this.pool.execute(
        `UPDATE ${this.tableName} SET ? WHERE id = ?`,
        [data, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`更新记录失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 删除记录
   */
  public async delete(id: number): Promise<boolean> {
    try {
      const result = await this.pool.execute(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`删除记录失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 批量创建记录
   */
  public async createMany(dataList: Partial<T>[]): Promise<number[]> {
    return await this.pool.transaction(async (connection) => {
      const ids: number[] = [];
      for (const data of dataList) {
        const [result] = await connection.execute(
          `INSERT INTO ${this.tableName} SET ?`,
          [data]
        );
        ids.push((result as mysql.ResultSetHeader).insertId);
      }
      return ids;
    });
  }

  /**
   * 根据条件查找记录
   */
  public async findByCondition(condition: Partial<T>): Promise<T[]> {
    const entries = Object.entries(condition);
    if (entries.length === 0) {
      return this.findAll();
    }

    const whereClause = entries
      .map(([key]) => `${key} = ?`)
      .join(' AND ');
    const values = entries.map(([, value]) => value);

    try {
      return await this.pool.query<T>(
        `SELECT * FROM ${this.tableName} WHERE ${whereClause}`,
        values
      );
    } catch (error) {
      console.error('条件查询失败:', error);
      throw error;
    }
  }

  /**
   * 分页查询
   */
  public async findWithPagination(page: number, pageSize: number): Promise<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * pageSize;
      
      const [countResult] = await this.pool.query<{count: number}[]>(
        `SELECT COUNT(*) as count FROM ${this.tableName}`
      );
      const total = countResult[0].count;

      const data = await this.pool.query<T>(
        `SELECT * FROM ${this.tableName} LIMIT ? OFFSET ?`,
        [pageSize, offset]
      );

      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    } catch (error) {
      console.error('分页查询失败:', error);
      throw error;
    }
  }
} 