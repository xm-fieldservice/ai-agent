import * as argon2 from 'argon2';

export class PasswordUtils {
  /**
   * 加密密码
   */
  public static async hashPassword(plainPassword: string): Promise<string> {
    return await argon2.hash(plainPassword);
  }

  /**
   * 验证密码
   */
  public static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await argon2.verify(hashedPassword, plainPassword);
  }

  /**
   * 生成随机密码
   */
  public static generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }
} 