import { databaseService } from './database-service';
import { User, UserRole, UserStatus, UserCredentials, LoginResponse } from '../models/User';
import { ref, Ref } from 'vue';

/**
 * 用户服务 - 管理用户数据和认证
 */
export class UserService {
  private static instance: UserService;
  private currentUser: Ref<User | null> = ref(null);
  private isLoading: Ref<boolean> = ref(false);
  private error: Ref<string | null> = ref(null);

  private constructor() {
    // 尝试从本地存储恢复用户会话
    this.restoreSession();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * 从本地存储恢复会话
   */
  private async restoreSession(): Promise<void> {
    const userJson = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userJson && token) {
      try {
        const user = JSON.parse(userJson);
        // 验证令牌有效性
        const isValid = await this.validateToken(token);
        
        if (isValid) {
          this.currentUser.value = user;
          console.log('已恢复用户会话:', user.username);
        } else {
          this.clearSession();
          console.warn('令牌已过期或无效，已清除会话');
        }
      } catch (error) {
        this.clearSession();
        console.error('恢复会话失败:', error);
      }
    }
  }

  /**
   * 验证令牌有效性
   */
  private async validateToken(token: string): Promise<boolean> {
    try {
      // 向服务器验证令牌
      // 实际实现应发送请求到身份验证服务
      // 这里为简化，仅检查本地时间
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      return tokenData.exp > Math.floor(Date.now() / 1000);
    } catch (error) {
      console.error('令牌验证失败:', error);
      return false;
    }
  }

  /**
   * 清除会话
   */
  private clearSession(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.currentUser.value = null;
  }

  /**
   * 获取当前用户状态
   */
  public getUserState(): { user: Ref<User | null>, isLoading: Ref<boolean>, error: Ref<string | null> } {
    return {
      user: this.currentUser,
      isLoading: this.isLoading,
      error: this.error
    };
  }

  /**
   * 用户登录
   */
  public async login(credentials: UserCredentials): Promise<User | null> {
    this.isLoading.value = true;
    this.error.value = null;
    
    try {
      // 查询用户
      const users = await databaseService.query<User>(
        'SELECT id, username, email, display_name AS displayName, avatar, role, status, last_login AS lastLogin, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE username = ? OR email = ? LIMIT 1',
        [credentials.username, credentials.username]
      );
      
      if (users.length === 0) {
        throw new Error('用户名或密码不正确');
      }
      
      const user = users[0];
      
      // 在实际应用中，应该使用安全的密码验证
      // 这里仅作为演示，假设验证通过
      
      // 更新最后登录时间
      await databaseService.update(
        'users',
        { last_login: new Date() },
        'id = ?',
        [user.id]
      );
      
      // 生成令牌（实际应用中应该在服务器端完成）
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1小时后过期
      const tokenPayload = {
        sub: user.id,
        username: user.username,
        role: user.role,
        exp: expiresAt
      };
      
      const token = this.generateToken(tokenPayload);
      
      // 保存会话
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('token', token);
      
      this.currentUser.value = userWithoutPassword;
      
      return userWithoutPassword;
    } catch (error) {
      this.error.value = error instanceof Error ? error.message : '登录失败';
      console.error('登录失败:', this.error.value);
      return null;
    } finally {
      this.isLoading.value = false;
    }
  }

  /**
   * 用户注销
   */
  public logout(): void {
    this.clearSession();
  }

  /**
   * 注册新用户
   */
  public async register(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User | null> {
    this.isLoading.value = true;
    this.error.value = null;
    
    try {
      // 检查用户名和邮箱是否已存在
      const existingUsers = await databaseService.query(
        'SELECT username, email FROM users WHERE username = ? OR email = ?',
        [userData.username, userData.email]
      );
      
      if (existingUsers.length > 0) {
        const existing = existingUsers[0] as { username: string, email: string };
        if (existing.username === userData.username) {
          throw new Error('用户名已被使用');
        } else {
          throw new Error('邮箱已被注册');
        }
      }
      
      // 在实际应用中，应该对密码进行哈希处理
      // 这里简化处理，直接使用原始密码（不安全！）
      
      // 转换字段名称以匹配数据库列名
      const dataForDb = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        display_name: userData.displayName,
        avatar: userData.avatar,
        role: userData.role,
        status: userData.status
      };
      
      // 插入新用户
      const userId = await databaseService.insert('users', dataForDb);
      
      // 查询新创建的用户
      const newUsers = await databaseService.query<User>(
        'SELECT id, username, email, display_name AS displayName, avatar, role, status, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?',
        [userId]
      );
      
      if (newUsers.length === 0) {
        throw new Error('创建用户失败');
      }
      
      const newUser = newUsers[0];
      return newUser;
    } catch (error) {
      this.error.value = error instanceof Error ? error.message : '注册失败';
      console.error('注册失败:', this.error.value);
      return null;
    } finally {
      this.isLoading.value = false;
    }
  }

  /**
   * 获取用户列表
   */
  public async getUsers(limit: number = 100, offset: number = 0): Promise<User[]> {
    this.isLoading.value = true;
    
    try {
      const users = await databaseService.query<User>(
        'SELECT id, username, email, display_name AS displayName, avatar, role, status, last_login AS lastLogin, created_at AS createdAt, updated_at AS updatedAt FROM users LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      return users;
    } catch (error) {
      this.error.value = error instanceof Error ? error.message : '获取用户列表失败';
      console.error('获取用户列表失败:', this.error.value);
      return [];
    } finally {
      this.isLoading.value = false;
    }
  }

  /**
   * 获取用户详情
   */
  public async getUserById(userId: number): Promise<User | null> {
    this.isLoading.value = true;
    
    try {
      const users = await databaseService.query<User>(
        'SELECT id, username, email, display_name AS displayName, avatar, role, status, last_login AS lastLogin, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        return null;
      }
      
      return users[0];
    } catch (error) {
      this.error.value = error instanceof Error ? error.message : '获取用户详情失败';
      console.error('获取用户详情失败:', this.error.value);
      return null;
    } finally {
      this.isLoading.value = false;
    }
  }

  /**
   * 更新用户信息
   */
  public async updateUser(userId: number, userData: Partial<User>): Promise<boolean> {
    this.isLoading.value = true;
    
    try {
      // 转换字段名称以匹配数据库列名
      const dataForDb: Record<string, any> = {};
      
      if (userData.username) dataForDb.username = userData.username;
      if (userData.email) dataForDb.email = userData.email;
      if (userData.password) dataForDb.password = userData.password;
      if (userData.displayName !== undefined) dataForDb.display_name = userData.displayName;
      if (userData.avatar !== undefined) dataForDb.avatar = userData.avatar;
      if (userData.role) dataForDb.role = userData.role;
      if (userData.status) dataForDb.status = userData.status;
      
      if (Object.keys(dataForDb).length === 0) {
        return false;
      }
      
      const affectedRows = await databaseService.update(
        'users',
        dataForDb,
        'id = ?',
        [userId]
      );
      
      return affectedRows > 0;
    } catch (error) {
      this.error.value = error instanceof Error ? error.message : '更新用户信息失败';
      console.error('更新用户信息失败:', this.error.value);
      return false;
    } finally {
      this.isLoading.value = false;
    }
  }

  /**
   * 删除用户
   */
  public async deleteUser(userId: number): Promise<boolean> {
    this.isLoading.value = true;
    
    try {
      const affectedRows = await databaseService.delete(
        'users',
        'id = ?',
        [userId]
      );
      
      return affectedRows > 0;
    } catch (error) {
      this.error.value = error instanceof Error ? error.message : '删除用户失败';
      console.error('删除用户失败:', this.error.value);
      return false;
    } finally {
      this.isLoading.value = false;
    }
  }

  /**
   * 生成简单的JWT令牌（仅用于演示）
   * 注意：在实际应用中，应该在服务器端生成令牌并使用适当的加密
   */
  private generateToken(payload: Record<string, any>): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    // 实际应用中应使用适当的加密算法生成签名
    // 这里仅用于演示
    const signature = btoa(`${encodedHeader}.${encodedPayload}`);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
}

// 导出单例实例
export const userService = UserService.getInstance(); 