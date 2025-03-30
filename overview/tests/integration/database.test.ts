import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseConnectionPool } from '../../src/database/connection-pool';
import { UserRepository, User } from '../../src/database/user-repository';
import { MigrationManager } from '../../src/database/migration-manager';

describe('数据库集成测试', () => {
  let pool: DatabaseConnectionPool;
  let userRepo: UserRepository;

  beforeAll(async () => {
    // 初始化数据库
    const migrationManager = new MigrationManager();
    await migrationManager.reset();

    // 初始化连接池和仓储
    pool = DatabaseConnectionPool.getInstance();
    userRepo = new UserRepository();
  });

  afterAll(async () => {
    // 清理数据库
    await pool.end();
  });

  describe('用户仓储测试', () => {
    test('应该能够创建新用户', async () => {
      const userId = await userRepo.createUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      expect(userId).toBeGreaterThan(0);

      const user = await userRepo.findById(userId);
      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
      expect(user?.email).toBe('test@example.com');
    });

    test('应该能够更新用户信息', async () => {
      const userId = await userRepo.createUser({
        username: 'updateuser',
        email: 'update@example.com',
        password: 'password123'
      });

      const updated = await userRepo.updateUser(userId, {
        email: 'newemail@example.com'
      });

      expect(updated).toBe(true);

      const user = await userRepo.findById(userId);
      expect(user?.email).toBe('newemail@example.com');
    });

    test('应该能够删除用户', async () => {
      const userId = await userRepo.createUser({
        username: 'deleteuser',
        email: 'delete@example.com',
        password: 'password123'
      });

      const deleted = await userRepo.delete(userId);
      expect(deleted).toBe(true);

      const user = await userRepo.findById(userId);
      expect(user).toBeNull();
    });

    test('应该能够按用户名查找用户', async () => {
      await userRepo.createUser({
        username: 'finduser',
        email: 'find@example.com',
        password: 'password123'
      });

      const user = await userRepo.findByUsername('finduser');
      expect(user).toBeDefined();
      expect(user?.email).toBe('find@example.com');
    });

    test('应该能够批量创建用户', async () => {
      const users = [
        {
          username: 'batch1',
          email: 'batch1@example.com',
          password: 'password123'
        },
        {
          username: 'batch2',
          email: 'batch2@example.com',
          password: 'password123'
        }
      ];

      const userIds = await userRepo.createUsers(users);
      expect(userIds).toHaveLength(2);
      expect(userIds[0]).toBeGreaterThan(0);
      expect(userIds[1]).toBeGreaterThan(0);

      const createdUsers = await Promise.all(
        userIds.map(id => userRepo.findById(id))
      );
      expect(createdUsers[0]?.username).toBe('batch1');
      expect(createdUsers[1]?.username).toBe('batch2');
    });

    test('应该能够搜索用户', async () => {
      // 创建测试数据
      await userRepo.createUsers([
        {
          username: 'search1',
          email: 'search1@example.com',
          password: 'password123'
        },
        {
          username: 'search2',
          email: 'search2@example.com',
          password: 'password123'
        },
        {
          username: 'other',
          email: 'other@example.com',
          password: 'password123'
        }
      ]);

      const result = await userRepo.searchUsers('search');
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0].username).toMatch(/search/);
      expect(result.data[1].username).toMatch(/search/);
    });

    test('应该正确处理事务', async () => {
      // 期望在创建重复用户时抛出错误
      await expect(userRepo.createUsers([
        {
          username: 'tx1',
          email: 'tx1@example.com',
          password: 'password123'
        },
        {
          // 重复的用户名应该触发错误
          username: 'tx1',
          email: 'tx2@example.com',
          password: 'password123'
        }
      ])).rejects.toThrow();

      // 验证事务回滚
      const user = await userRepo.findByUsername('tx1');
      expect(user).toBeNull();
    });

    test('应该能够处理并发查询', async () => {
      // 创建测试数据
      const userIds = await userRepo.createUsers([
        {
          username: 'concurrent1',
          email: 'concurrent1@example.com',
          password: 'password123'
        },
        {
          username: 'concurrent2',
          email: 'concurrent2@example.com',
          password: 'password123'
        }
      ]);

      // 并发执行多个查询
      const results = await Promise.all([
        userRepo.findById(userIds[0]),
        userRepo.findById(userIds[1]),
        userRepo.findByUsername('concurrent1'),
        userRepo.findByEmail('concurrent2@example.com')
      ]);

      expect(results[0]?.username).toBe('concurrent1');
      expect(results[1]?.username).toBe('concurrent2');
      expect(results[2]?.email).toBe('concurrent1@example.com');
      expect(results[3]?.email).toBe('concurrent2@example.com');
    });
  });
}); 