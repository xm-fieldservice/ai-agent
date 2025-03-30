import { DatabaseConnectionPool } from './connection-pool';
import * as fs from 'fs';
import * as path from 'path';

export class MigrationManager {
  private pool: DatabaseConnectionPool;

  constructor() {
    this.pool = DatabaseConnectionPool.getInstance();
  }

  /**
   * 创建迁移表（如果不存在）
   */
  private async createMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
      await this.pool.execute(sql);
      console.log('迁移表创建成功或已存在');
    } catch (error) {
      console.error('创建迁移表失败:', error);
      throw error;
    }
  }

  /**
   * 获取已执行的迁移
   */
  private async getExecutedMigrations(): Promise<string[]> {
    try {
      const migrations = await this.pool.query<{ name: string }[]>(
        'SELECT name FROM migrations ORDER BY id'
      );
      return migrations.map(m => m.name);
    } catch (error) {
      console.error('获取已执行的迁移失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有迁移文件
   */
  private async getMigrationFiles(): Promise<string[]> {
    const migrationsDir = path.join(__dirname, 'migrations');
    try {
      const files = await fs.promises.readdir(migrationsDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch (error) {
      console.error('读取迁移文件失败:', error);
      throw error;
    }
  }

  /**
   * 执行迁移
   */
  public async migrate(): Promise<void> {
    await this.createMigrationsTable();

    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();

    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        try {
          const filePath = path.join(__dirname, 'migrations', file);
          const sql = await fs.promises.readFile(filePath, 'utf8');

          await this.pool.transaction(async (connection) => {
            await connection.execute(sql);
            await connection.execute(
              'INSERT INTO migrations (name) VALUES (?)',
              [file]
            );
          });

          console.log(`迁移 ${file} 执行成功`);
        } catch (error) {
          console.error(`迁移 ${file} 执行失败:`, error);
          throw error;
        }
      }
    }

    console.log('所有迁移执行完成');
  }

  /**
   * 回滚最后一次迁移
   */
  public async rollback(): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();
    if (executedMigrations.length === 0) {
      console.log('没有可回滚的迁移');
      return;
    }

    const lastMigration = executedMigrations[executedMigrations.length - 1];
    const rollbackFile = lastMigration.replace('.sql', '_rollback.sql');
    const rollbackPath = path.join(__dirname, 'migrations', rollbackFile);

    try {
      if (fs.existsSync(rollbackPath)) {
        const sql = await fs.promises.readFile(rollbackPath, 'utf8');

        await this.pool.transaction(async (connection) => {
          await connection.execute(sql);
          await connection.execute(
            'DELETE FROM migrations WHERE name = ?',
            [lastMigration]
          );
        });

        console.log(`迁移 ${lastMigration} 回滚成功`);
      } else {
        console.error(`找不到回滚文件: ${rollbackFile}`);
      }
    } catch (error) {
      console.error(`回滚迁移 ${lastMigration} 失败:`, error);
      throw error;
    }
  }

  /**
   * 重置数据库
   */
  public async reset(): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();
    for (let i = executedMigrations.length - 1; i >= 0; i--) {
      await this.rollback();
    }
    await this.migrate();
    console.log('数据库重置完成');
  }
} 