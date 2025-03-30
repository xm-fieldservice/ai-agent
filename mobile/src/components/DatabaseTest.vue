<template>
  <div class="database-test-container">
    <h2>数据库连接测试</h2>
    
    <!-- 数据库连接状态 -->
    <div class="status-panel">
      <div class="status-item">
        <span class="status-label">连接状态:</span>
        <span :class="['status-value', statusClass]">{{ statusText }}</span>
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="button-group">
      <van-button type="primary" @click="connectDatabase" :loading="connecting" :disabled="isConnected">
        {{ isConnected ? '已连接' : '连接数据库' }}
      </van-button>
      
      <van-button type="danger" @click="disconnectDatabase" :disabled="!isConnected">
        断开连接
      </van-button>
    </div>
    
    <!-- 数据库初始化 -->
    <div class="init-panel" v-if="isConnected">
      <h3>数据库初始化</h3>
      <van-button type="primary" @click="initDatabase" :loading="initializing" :disabled="initialized">
        {{ initialized ? '已初始化' : '初始化数据库' }}
      </van-button>
      
      <div v-if="initError" class="error-message">
        {{ initError }}
      </div>
      
      <div v-if="initialized" class="success-message">
        数据库初始化成功
      </div>
    </div>
    
    <!-- 测试用户数据面板 -->
    <div class="test-panel" v-if="initialized">
      <h3>测试用户数据操作</h3>
      
      <!-- 创建测试用户 -->
      <div class="test-action">
        <van-button type="primary" @click="createTestUser" :loading="creatingUser">
          创建测试用户
        </van-button>
        <div v-if="testUser" class="success-message">
          创建成功: {{ testUser.username }} (ID: {{ testUser.id }})
        </div>
      </div>
      
      <!-- 查询用户列表 -->
      <div class="test-action">
        <van-button type="info" @click="fetchUsers" :loading="fetchingUsers">
          获取用户列表
        </van-button>
        
        <div v-if="users.length > 0" class="result-container">
          <h4>用户列表 ({{ users.length }})</h4>
          <div class="user-list">
            <div v-for="user in users" :key="user.id" class="user-item">
              <div class="user-name">{{ user.username }}</div>
              <div class="user-email">{{ user.email }}</div>
              <div class="user-role">{{ user.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Button as VanButton } from 'vant';
import { databaseService, DatabaseStatus } from '../services/database-service';
import { userService } from '../services/user-service';
import { UserRole, UserStatus } from '../models/User';

// 状态变量
const connecting = ref(false);
const initializing = ref(false);
const initialized = ref(false);
const initError = ref(null);
const creatingUser = ref(false);
const fetchingUsers = ref(false);
const testUser = ref(null);
const users = ref([]);

// 获取数据库状态
const dbStatus = databaseService.getStatus();

// 计算属性
const statusText = computed(() => {
  switch (dbStatus.status.value) {
    case DatabaseStatus.CONNECTED:
      return '已连接';
    case DatabaseStatus.CONNECTING:
      return '连接中...';
    case DatabaseStatus.DISCONNECTED:
      return '未连接';
    case DatabaseStatus.ERROR:
      return '连接错误';
    default:
      return '未知状态';
  }
});

const statusClass = computed(() => {
  switch (dbStatus.status.value) {
    case DatabaseStatus.CONNECTED:
      return 'status-connected';
    case DatabaseStatus.CONNECTING:
      return 'status-connecting';
    case DatabaseStatus.DISCONNECTED:
      return 'status-disconnected';
    case DatabaseStatus.ERROR:
      return 'status-error';
    default:
      return '';
  }
});

const errorMessage = computed(() => dbStatus.error.value);

const isConnected = computed(() => dbStatus.status.value === DatabaseStatus.CONNECTED);

// 方法
const connectDatabase = async () => {
  if (isConnected.value) return;
  
  connecting.value = true;
  try {
    await databaseService.connect();
  } catch (error) {
    console.error('连接数据库失败:', error);
  } finally {
    connecting.value = false;
  }
};

const disconnectDatabase = async () => {
  try {
    await databaseService.disconnect();
    initialized.value = false;
    initError.value = null;
    testUser.value = null;
    users.value = [];
  } catch (error) {
    console.error('断开数据库连接失败:', error);
  }
};

const initDatabase = async () => {
  initializing.value = true;
  initError.value = null;
  
  try {
    // 创建用户表
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        avatar VARCHAR(255),
        role ENUM('user', 'admin', 'guest') NOT NULL DEFAULT 'user',
        status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
        last_login DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await databaseService.query(createTableSql);
    console.log('用户表创建/验证成功');
    
    initialized.value = true;
  } catch (error) {
    console.error('初始化数据库失败:', error);
    initError.value = error instanceof Error ? error.message : '初始化数据库失败';
  } finally {
    initializing.value = false;
  }
};

const createTestUser = async () => {
  if (creatingUser.value) return;
  
  creatingUser.value = true;
  try {
    // 生成随机用户名以避免冲突
    const randomSuffix = Math.floor(Math.random() * 10000);
    const username = `test_user_${randomSuffix}`;
    
    const newUser = await userService.register({
      username,
      email: `${username}@example.com`,
      password: 'password123',
      displayName: `测试用户 ${randomSuffix}`,
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    });
    
    if (newUser) {
      testUser.value = newUser;
      await fetchUsers(); // 刷新用户列表
    }
  } catch (error) {
    console.error('创建测试用户失败:', error);
  } finally {
    creatingUser.value = false;
  }
};

const fetchUsers = async () => {
  if (fetchingUsers.value) return;
  
  fetchingUsers.value = true;
  try {
    users.value = await userService.getUsers(10, 0);
  } catch (error) {
    console.error('获取用户列表失败:', error);
  } finally {
    fetchingUsers.value = false;
  }
};

// 组件挂载时自动尝试连接
onMounted(async () => {
  // 只在开发模式下自动连接
  if (import.meta.env.DEV) {
    await connectDatabase();
  }
});
</script>

<style scoped>
.database-test-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.status-panel {
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.status-label {
  font-weight: bold;
  margin-right: 10px;
}

.status-value {
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: 500;
}

.status-connected {
  background-color: #e1f7e1;
  color: #2e7d32;
}

.status-connecting {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-disconnected {
  background-color: #f5f5f5;
  color: #757575;
}

.status-error {
  background-color: #fdecea;
  color: #d32f2f;
}

.error-message {
  color: #d32f2f;
  margin-top: 10px;
  padding: 8px;
  background-color: #fdecea;
  border-radius: 4px;
}

.success-message {
  color: #2e7d32;
  margin-top: 10px;
  padding: 8px;
  background-color: #e8f5e9;
  border-radius: 4px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.init-panel, .test-panel {
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.test-action {
  margin-bottom: 15px;
}

.result-container {
  margin-top: 15px;
  background: white;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #eee;
}

.user-list {
  max-height: 300px;
  overflow-y: auto;
}

.user-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
}

.user-item:last-child {
  border-bottom: none;
}

.user-name {
  font-weight: bold;
}

.user-email {
  color: #666;
}

.user-role {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
}
</style> 