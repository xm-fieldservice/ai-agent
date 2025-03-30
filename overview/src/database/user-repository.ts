import { BaseRepository } from './base-repository';
import { PasswordUtils } from '../utils/password-utils';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  /**
   * 根据用户名查找用户
   */
  public async findByUsername(username: string): Promise<User | null> {
    const users = await this.findByCondition({ username });
    return users[0] || null;
  }

  /**
   * 根据邮箱查找用户
   */
  public async findByEmail(email: string): Promise<User | null> {
    const users = await this.findByCondition({ email });
    return users[0] || null;
  }

  /**
   * 创建新用户
   */
  public async createUser(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const now = new Date();
    const hashedPassword = await PasswordUtils.hashPassword(data.password);
    return await this.create({
      ...data,
      password: hashedPassword,
      created_at: now,
      updated_at: now
    });
  }

  /**
   * 更新用户信息
   */
  public async updateUser(id: number, data: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const updateData = { ...data };
    if (data.password) {
      updateData.password = await PasswordUtils.hashPassword(data.password);
    }
    return await this.update(id, {
      ...updateData,
      updated_at: new Date()
    });
  }

  /**
   * 验证用户凭据
   */
  public async validateCredentials(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByUsername(username);
      if (!user) {
        return null;
      }

      const isValid = await PasswordUtils.verifyPassword(password, user.password);
      return isValid ? user : null;
    } catch (error) {
      console.error('验证用户凭据失败:', error);
      throw error;
    }
  }

  /**
   * 批量创建用户
   */
  public async createUsers(users: Array<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<number[]> {
    const now = new Date();
    const usersWithHashedPasswords = await Promise.all(
      users.map(async user => ({
        ...user,
        password: await PasswordUtils.hashPassword(user.password),
        created_at: now,
        updated_at: now
      }))
    );
    return await this.createMany(usersWithHashedPasswords);
  }

  /**
   * 搜索用户
   */
  public async searchUsers(query: string, page: number = 1, pageSize: number = 10): Promise<{
    data: User[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * pageSize;
      
      const [countResult] = await this.pool.query<{count: number}[]>(
        'SELECT COUNT(*) as count FROM users WHERE username LIKE ? OR email LIKE ?',
        [`%${query}%`, `%${query}%`]
      );
      const total = countResult[0].count;

      const data = await this.pool.query<User>(
        'SELECT * FROM users WHERE username LIKE ? OR email LIKE ? LIMIT ? OFFSET ?',
        [`%${query}%`, `%${query}%`, pageSize, offset]
      );

      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    } catch (error) {
      console.error('搜索用户失败:', error);
      throw error;
    }
  }
} 