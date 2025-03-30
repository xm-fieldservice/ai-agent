import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../database/user-repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
  file?: Express.Multer.File;
}

export class AuthMiddleware {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  /**
   * 生成JWT令牌
   */
  public generateToken(userId: number, username: string, email: string): string {
    return jwt.sign(
      { id: userId, username, email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  /**
   * 验证JWT令牌
   */
  public verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: '未提供认证令牌' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        username: string;
        email: string;
      };

      // 验证用户是否存在
      const user = await this.userRepo.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: '用户不存在' });
      }

      // 将用户信息添加到请求对象
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ message: '令牌已过期' });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: '无效的令牌' });
      }
      console.error('验证令牌失败:', error);
      return res.status(500).json({ message: '内部服务器错误' });
    }
  };

  /**
   * 登录中间件
   */
  public login = async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: '用户名和密码不能为空' });
      }

      const user = await this.userRepo.validateCredentials(username, password);
      if (!user) {
        return res.status(401).json({ message: '用户名或密码错误' });
      }

      const token = this.generateToken(user.id, user.username, user.email);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({ message: '内部服务器错误' });
    }
  };

  /**
   * 注册中间件
   */
  public register = async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ message: '用户名、邮箱和密码不能为空' });
      }

      // 检查用户名是否已存在
      const existingUser = await this.userRepo.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: '用户名已存在' });
      }

      // 检查邮箱是否已存在
      const existingEmail = await this.userRepo.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: '邮箱已被使用' });
      }

      // 创建新用户
      const userId = await this.userRepo.createUser({
        username,
        email,
        password
      });

      const token = this.generateToken(userId, username, email);
      res.status(201).json({
        token,
        user: {
          id: userId,
          username,
          email
        }
      });
    } catch (error) {
      console.error('注册失败:', error);
      res.status(500).json({ message: '内部服务器错误' });
    }
  };
} 