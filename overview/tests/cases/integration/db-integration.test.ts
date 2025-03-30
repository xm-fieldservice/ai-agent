import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql from 'mysql2/promise';
import { config } from '../../config/database';

interface TestUser {
  id?: number;
  username: string;
  email: string;
  created_at?: Date;
}

describe('数据库集成测试', () => {
  let connection: mysql.Connection;

  beforeAll(async () => {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database
    });

    // 创建测试表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS test_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  afterAll(async () => {
    // 清理测试表
    await connection.execute('DROP TABLE IF EXISTS test_users');
    // 关闭连接
    await connection.end();
  });

  // 基本CRUD操作测试
  it('应该能够执行基本的CRUD操作', async () => {
    // 创建测试数据
    const testUser: TestUser = {
      username: 'testuser',
      email: 'test@example.com'
    };

    // 插入数据
    const [insertResult] = await connection.execute(
      'INSERT INTO test_users (username, email) VALUES (?, ?)',
      [testUser.username, testUser.email]
    );
    expect(insertResult['insertId']).toBeDefined();

    // 读取数据
    const [rows] = await connection.execute(
      'SELECT * FROM test_users WHERE id = ?',
      [insertResult['insertId']]
    );
    expect(Array.isArray(rows)).toBe(true);
    expect(rows[0]['username']).toBe(testUser.username);

    // 更新数据
    const newEmail = 'updated@example.com';
    await connection.execute(
      'UPDATE test_users SET email = ? WHERE id = ?',
      [newEmail, insertResult['insertId']]
    );

    // 验证更新
    const [updatedRows] = await connection.execute(
      'SELECT * FROM test_users WHERE id = ?',
      [insertResult['insertId']]
    );
    expect(updatedRows[0]['email']).toBe(newEmail);

    // 删除数据
    await connection.execute(
      'DELETE FROM test_users WHERE id = ?',
      [insertResult['insertId']]
    );

    // 验证删除
    const [deletedRows] = await connection.execute(
      'SELECT * FROM test_users WHERE id = ?',
      [insertResult['insertId']]
    );
    expect(Array.isArray(deletedRows)).toBe(true);
    expect(deletedRows.length).toBe(0);
  });

  // 事务测试
  it('应该能够正确处理事务', async () => {
    // 开始事务
    await connection.beginTransaction();

    try {
      // 插入多条数据
      const users: TestUser[] = [
        { username: 'user1', email: 'user1@example.com' },
        { username: 'user2', email: 'user2@example.com' }
      ];

      for (const user of users) {
        await connection.execute(
          'INSERT INTO test_users (username, email) VALUES (?, ?)',
          [user.username, user.email]
        );
      }

      // 故意制造错误
      await connection.execute(
        'INSERT INTO test_users (username, email) VALUES (?, ?)',
        ['user3', null] // email 不能为 null
      );

      await connection.commit();
    } catch (error) {
      // 回滚事务
      await connection.rollback();
    }

    // 验证事务回滚
    const [rows] = await connection.execute('SELECT * FROM test_users');
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(0); // 所有插入都应该被回滚
  });

  // 并发查询测试
  it('应该能够处理并发查询', async () => {
    // 插入测试数据
    const users: TestUser[] = Array.from({ length: 10 }, (_, i) => ({
      username: `user${i}`,
      email: `user${i}@example.com`
    }));

    for (const user of users) {
      await connection.execute(
        'INSERT INTO test_users (username, email) VALUES (?, ?)',
        [user.username, user.email]
      );
    }

    // 执行并发查询
    const queries = Array.from({ length: 5 }, () => 
      connection.execute('SELECT * FROM test_users')
    );

    const results = await Promise.all(queries);
    
    // 验证每个查询都返回了正确的结果
    results.forEach(([rows]) => {
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBe(10);
    });

    // 清理测试数据
    await connection.execute('DELETE FROM test_users');
  });

  // 连接错误恢复测试
  it('应该能够从连接错误中恢复', async () => {
    // 模拟连接断开
    await connection.end();

    // 重新连接
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database
    });

    // 验证连接是否恢复
    const [rows] = await connection.execute('SELECT 1');
    expect(rows[0]['1']).toBe(1);
  });
}); 