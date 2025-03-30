/**
 * 用户状态枚举
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

/**
 * 用户角色枚举
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  GUEST = 'guest'
}

/**
 * 用户数据接口
 */
export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string; // 仅用于创建/更新，不应从API返回
  displayName?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 登录凭证接口
 */
export interface UserCredentials {
  username: string;
  password: string;
}

/**
 * 登录响应接口
 */
export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
  expiresAt: number;
}

/**
 * 用户数据表结构（MySQL DDL）
 * 
 * ```sql
 * CREATE TABLE IF NOT EXISTS users (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   username VARCHAR(50) NOT NULL UNIQUE,
 *   email VARCHAR(100) NOT NULL UNIQUE,
 *   password VARCHAR(255) NOT NULL,
 *   display_name VARCHAR(100),
 *   avatar VARCHAR(255),
 *   role ENUM('user', 'admin', 'guest') NOT NULL DEFAULT 'user',
 *   status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
 *   last_login DATETIME,
 *   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 *   updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *   INDEX idx_username (username),
 *   INDEX idx_email (email),
 *   INDEX idx_role (role),
 *   INDEX idx_status (status)
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 * ```
 */ 