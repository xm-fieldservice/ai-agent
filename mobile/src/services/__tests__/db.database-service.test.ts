/**
 * 数据库服务集成测试
 * 测试与MySQL数据库的连接和操作
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from '../database-service';

// 模拟mysql2
vi.mock('mysql2/promise', () => {
  // 模拟连接池
  const mockPool = {
    getConnection: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        query: vi.fn().mockImplementation((sql, params) => {
          if (sql.includes('SELECT')) {
            // 模拟查询结果
            if (sql.includes('FROM users')) {
              return Promise.resolve([[
                { id: 1, username: 'test_user', email: 'test@example.com' }
              ]]);
            } else if (sql.includes('FROM messages')) {
              return Promise.resolve([[
                { id: 1, user_id: 1, content: 'Test message', created_at: new Date() }
              ]]);
            }
            return Promise.resolve([[]]);
          } else if (sql.includes('INSERT')) {
            // 模拟插入结果
            return Promise.resolve([{
              insertId: 123,
              affectedRows: 1
            }]);
          } else if (sql.includes('UPDATE')) {
            // 模拟更新结果
            return Promise.resolve([{
              affectedRows: 1
            }]);
          } else if (sql.includes('DELETE')) {
            // 模拟删除结果
            return Promise.resolve([{
              affectedRows: 1
            }]);
          }
          return Promise.resolve([]);
        }),
        release: vi.fn()
      });
    }),
    query: vi.fn().mockImplementation((sql, params) => {
      if (sql.includes('SELECT')) {
        // 模拟查询结果
        if (sql.includes('FROM users')) {
          return Promise.resolve([[
            { id: 1, username: 'test_user', email: 'test@example.com' }
          ]]);
        } else if (sql.includes('FROM messages')) {
          return Promise.resolve([[
            { id: 1, user_id: 1, content: 'Test message', created_at: new Date() }
          ]]);
        }
        return Promise.resolve([[]]);
      } else if (sql.includes('INSERT')) {
        // 模拟插入结果
        return Promise.resolve([{
          insertId: 123,
          affectedRows: 1
        }]);
      } else if (sql.includes('UPDATE')) {
        // 模拟更新结果
        return Promise.resolve([{
          affectedRows: 1
        }]);
      } else if (sql.includes('DELETE')) {
        // 模拟删除结果
        return Promise.resolve([{
          affectedRows: 1
        }]);
      }
      return Promise.resolve([]);
    }),
    end: vi.fn().mockResolvedValue(undefined)
  };

  return {
    createPool: vi.fn().mockReturnValue(mockPool)
  };
});

describe('数据库服务集成测试', () => {
  let dbService: DatabaseService;
  
  beforeEach(async () => {
    // 创建数据库服务实例
    dbService = new DatabaseService({
      host: 'localhost',
      port: 3306,
      user: 'test_user',
      password: 'test_password',
      database: 'test_db'
    });
    
    // 初始化数据库服务
    await dbService.initialize();
  });
  
  afterEach(async () => {
    // 关闭数据库连接
    await dbService.close();
    vi.clearAllMocks();
  });
  
  it('应该成功初始化数据库连接', () => {
    expect(dbService.isInitialized()).toBe(true);
  });
  
  it('应该能够执行查询操作', async () => {
    const result = await dbService.query('SELECT * FROM users WHERE id = ?', [1]);
    expect(result).toEqual([
      { id: 1, username: 'test_user', email: 'test@example.com' }
    ]);
  });
  
  it('应该能够执行插入操作', async () => {
    const user = {
      username: 'new_user',
      email: 'new@example.com',
      password: 'hashed_password'
    };
    
    const result = await dbService.insert('users', user);
    expect(result).toEqual({
      id: 123,
      affectedRows: 1
    });
  });
  
  it('应该能够执行更新操作', async () => {
    const updates = {
      email: 'updated@example.com'
    };
    
    const result = await dbService.update('users', updates, 'id = ?', [1]);
    expect(result).toEqual({
      affectedRows: 1
    });
  });
  
  it('应该能够执行删除操作', async () => {
    const result = await dbService.delete('users', 'id = ?', [1]);
    expect(result).toEqual({
      affectedRows: 1
    });
  });
  
  it('应该能够获取单条记录', async () => {
    const user = await dbService.getOne('SELECT * FROM users WHERE id = ?', [1]);
    expect(user).toEqual(
      { id: 1, username: 'test_user', email: 'test@example.com' }
    );
  });
  
  it('在查询失败时应该抛出异常', async () => {
    // 修改mock以模拟错误
    const mysql = await import('mysql2/promise');
    const mockPool = mysql.createPool();
    mockPool.query = vi.fn().mockRejectedValueOnce(new Error('数据库查询失败'));
    
    await expect(
      dbService.query('SELECT * FROM non_existent_table')
    ).rejects.toThrow('数据库查询失败');
  });
  
  it('应该支持事务操作', async () => {
    await dbService.transaction(async (connection) => {
      await connection.query('INSERT INTO users (username, email) VALUES (?, ?)', ['tx_user', 'tx@example.com']);
      await connection.query('INSERT INTO messages (user_id, content) VALUES (?, ?)', [1, 'Transaction message']);
    });
    
    // 验证事务操作成功完成
    const mysql = await import('mysql2/promise');
    const mockPool = mysql.createPool();
    expect(mockPool.getConnection).toHaveBeenCalled();
    
    // 事务中应该至少有两次查询
    const connection = await mockPool.getConnection();
    expect(connection.query).toHaveBeenCalledTimes(2);
    expect(connection.release).toHaveBeenCalled();
  });
}); 