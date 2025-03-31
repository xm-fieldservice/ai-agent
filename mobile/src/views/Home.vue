<template>
  <div class="home">
    <h1 class="title">AI-Agent 系统监控</h1>
    
    <!-- 服务状态卡片 -->
    <div class="status-card">
      <h2>服务状态</h2>
      <p :class="['status', systemStatus.isHealthy ? 'healthy' : 'unhealthy']">
        {{ systemStatus.message }}
      </p>
      <p class="time">当前时间: {{ currentTime }}</p>
      <p class="uptime">运行时长: {{ uptime }}</p>
    </div>

    <!-- 资源使用卡片 -->
    <div class="resource-section">
      <div class="resource-card">
        <h2>CPU 使用率</h2>
        <div class="resource-value">{{ resources.cpu }}%</div>
        <div class="loading" v-if="loading">加载中...</div>
      </div>

      <div class="resource-card">
        <h2>内存使用率</h2>
        <div class="resource-value">{{ resources.memory }}%</div>
        <div class="loading" v-if="loading">加载中...</div>
      </div>

      <div class="resource-card">
        <h2>磁盘使用率</h2>
        <div class="resource-value">{{ resources.disk }}%</div>
        <div class="loading" v-if="loading">加载中...</div>
      </div>
    </div>

    <!-- API 状态 -->
    <div class="metrics-section">
      <h2>API 监控</h2>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">总请求数</span>
          <span class="metric-value">{{ metrics.totalRequests || '-' }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">错误率</span>
          <span class="metric-value">{{ metrics.errorRate || '-' }}%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">平均响应时间</span>
          <span class="metric-value">{{ metrics.avgResponseTime || '-' }}ms</span>
        </div>
      </div>
    </div>

    <!-- 服务健康状态 -->
    <div class="metrics-section">
      <h2>服务健康状态</h2>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">数据库连接</span>
          <span class="metric-value" :class="health.database ? 'healthy' : 'unhealthy'">
            {{ health.database ? '正常' : '异常' }}
          </span>
        </div>
        <div class="metric-item">
          <span class="metric-label">缓存服务</span>
          <span class="metric-value" :class="health.cache ? 'healthy' : 'unhealthy'">
            {{ health.cache ? '正常' : '异常' }}
          </span>
        </div>
        <div class="metric-item">
          <span class="metric-label">文件存储</span>
          <span class="metric-value" :class="health.storage ? 'healthy' : 'unhealthy'">
            {{ health.storage ? '正常' : '异常' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 系统信息 -->
    <div class="metrics-section">
      <h2>系统信息</h2>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">Node版本</span>
          <span class="metric-value">{{ systemInfo.nodeVersion || '-' }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">系统平台</span>
          <span class="metric-value">{{ systemInfo.platform || '-' }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">系统架构</span>
          <span class="metric-value">{{ systemInfo.arch || '-' }}</span>
        </div>
      </div>
    </div>

    <!-- 用户信息卡片 -->
    <van-card
      :desc="userInfo.department"
      :title="userInfo.name"
      :thumb="userInfo.avatar"
    >
      <template #tags>
        <van-tag type="primary">{{ userInfo.role }}</van-tag>
      </template>
    </van-card>

    <!-- 快捷功能区 -->
    <div class="quick-actions">
      <h3 class="section-title">快捷功能</h3>
      <van-grid :column-num="4" :border="false">
        <van-grid-item
          v-for="action in quickActions"
          :key="action.id"
          :icon="action.icon"
          :text="action.text"
          @click="onActionClick(action)"
        />
      </van-grid>
    </div>

    <!-- 待办任务 -->
    <div class="todo-list">
      <div class="section-header">
        <h3 class="section-title">待办任务</h3>
        <van-button size="small" type="primary" @click="onViewAllTasks">查看全部</van-button>
      </div>
      <van-cell-group inset>
        <van-cell
          v-for="task in todoTasks"
          :key="task.id"
          :title="task.title"
          :label="task.deadline"
          :value="task.status"
          is-link
          @click="onTaskClick(task)"
        />
      </van-cell-group>
    </div>

    <!-- 最近消息 -->
    <div class="recent-messages">
      <div class="section-header">
        <h3 class="section-title">最近消息</h3>
        <van-button size="small" type="primary" @click="onViewAllMessages">查看全部</van-button>
      </div>
      <van-cell-group inset>
        <van-cell
          v-for="message in recentMessages"
          :key="message.id"
          :title="message.title"
          :label="message.time"
          is-link
          @click="onMessageClick(message)"
        >
          <template #right-icon>
            <van-badge :content="message.unread" v-if="message.unread" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { getSystemStatus, getSystemResources } from '@/api/config'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'Home',
  setup() {
    const router = useRouter()
    const loading = ref(true)
    const systemStatus = ref({
      isHealthy: true,
      message: 'API 服务运行正常',
      startTime: new Date()
    })
    const resources = ref({
      cpu: '--',
      memory: '--',
      disk: '--'
    })
    const metrics = ref({
      totalRequests: 0,
      errorRate: 0,
      avgResponseTime: 0
    })
    const health = ref({
      database: true,
      cache: true,
      storage: true
    })
    const systemInfo = ref({
      nodeVersion: '',
      platform: '',
      arch: ''
    })
    const currentTime = ref(new Date().toLocaleString())
    const uptime = ref('0天 0小时 0分钟 0秒')
    let timer: number | null = null

    // 用户信息
    const userInfo = ref({
      name: '张三',
      department: '技术部',
      role: '工程师',
      avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
    })

    // 快捷功能
    const quickActions = ref([
      { id: 1, icon: 'todo-list-o', text: '发起任务' },
      { id: 2, icon: 'chat-o', text: '发送消息' },
      { id: 3, icon: 'clock-o', text: '考勤打卡' },
      { id: 4, icon: 'notes-o', text: '工作报告' },
      { id: 5, icon: 'calendar-o', text: '日程安排' },
      { id: 6, icon: 'friends-o', text: '通讯录' },
      { id: 7, icon: 'chart-trending-o', text: '数据统计' },
      { id: 8, icon: 'setting-o', text: '系统设置' }
    ])

    // 待办任务
    const todoTasks = ref([
      { id: 1, title: '完成项目文档', deadline: '今天 14:00', status: '进行中' },
      { id: 2, title: '代码评审', deadline: '明天 10:00', status: '待处理' },
      { id: 3, title: '团队会议', deadline: '周五 15:00', status: '待处理' }
    ])

    // 最近消息
    const recentMessages = ref([
      { id: 1, title: '项目进度讨论', time: '10分钟前', unread: 2 },
      { id: 2, title: '新任务通知', time: '1小时前', unread: 0 },
      { id: 3, title: '系统更新提醒', time: '昨天', unread: 1 }
    ])

    const updateTime = () => {
      currentTime.value = new Date().toLocaleString()
      const start = new Date(systemStatus.value.startTime)
      const now = new Date()
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000)
      
      const days = Math.floor(diff / (24 * 60 * 60))
      const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60))
      const minutes = Math.floor((diff % (60 * 60)) / 60)
      const seconds = diff % 60
      
      uptime.value = `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`
    }

    const fetchData = async () => {
      try {
        loading.value = true
        const [statusData, resourceData] = await Promise.all([
          getSystemStatus(),
          getSystemResources()
        ])
        
        systemStatus.value = {
          isHealthy: statusData.status === 'healthy',
          message: statusData.status === 'healthy' ? 'API 服务运行正常' : 'API 服务异常',
          startTime: statusData.startTime
        }
        
        resources.value = {
          cpu: resourceData.cpu?.toFixed(1) || '--',
          memory: resourceData.memory?.toFixed(1) || '--',
          disk: resourceData.disk?.toFixed(1) || '--'
        }

        // 更新其他指标
        if (statusData.metrics) {
          metrics.value = statusData.metrics
        }
        if (statusData.health) {
          health.value = statusData.health
        }
        if (statusData.systemInfo) {
          systemInfo.value = statusData.systemInfo
        }
      } catch (error) {
        console.error('获取数据失败:', error)
        systemStatus.value.isHealthy = false
        systemStatus.value.message = 'API 服务异常'
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchData()
      timer = window.setInterval(() => {
        fetchData()
        updateTime()
      }, 1000)
    })

    onUnmounted(() => {
      if (timer) {
        clearInterval(timer)
      }
    })

    // 事件处理
    const onActionClick = (action: any) => {
      switch (action.id) {
        case 1:
          router.push('/tasks/create')
          break
        case 2:
          router.push('/messages/new')
          break
        case 3:
          router.push('/attendance')
          break
        default:
          console.log('Action clicked:', action)
      }
    }

    const onTaskClick = (task: any) => {
      router.push(`/tasks/${task.id}`)
    }

    const onMessageClick = (message: any) => {
      router.push(`/messages/${message.id}`)
    }

    const onViewAllTasks = () => {
      router.push('/tasks')
    }

    const onViewAllMessages = () => {
      router.push('/messages')
    }

    return {
      loading,
      systemStatus,
      resources,
      metrics,
      health,
      systemInfo,
      currentTime,
      uptime,
      userInfo,
      quickActions,
      todoTasks,
      recentMessages,
      onActionClick,
      onTaskClick,
      onMessageClick,
      onViewAllTasks,
      onViewAllMessages
    }
  }
})
</script>

<style lang="scss" scoped>
.home {
  padding: var(--spacing-base);
  max-width: 800px;
  margin: 0 auto;
  
  .title {
    text-align: center;
    color: var(--primary-color);
    margin-bottom: var(--spacing-lg);
  }
  
  .status-card,
  .resource-card {
    background: var(--card-background);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-base);
    margin-bottom: var(--spacing-base);
    box-shadow: var(--shadow-sm);
    
    h2 {
      margin: 0 0 var(--spacing-sm);
      color: var(--text-color);
      font-size: var(--font-size-lg);
    }
  }
  
  .resource-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-base);
    margin-bottom: var(--spacing-lg);
  }
  
  .metrics-section {
    background: var(--card-background);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-base);
    margin-bottom: var(--spacing-base);
    box-shadow: var(--shadow-sm);
    
    h2 {
      margin: 0 0 var(--spacing-base);
      color: var(--text-color);
      font-size: var(--font-size-lg);
    }
  }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-base);
  }
  
  .metric-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    
    .metric-label {
      color: var(--text-color-secondary);
      font-size: var(--font-size-sm);
      margin-bottom: var(--spacing-xs);
    }
    
    .metric-value {
      font-size: var(--font-size-lg);
      font-weight: bold;
      color: var(--text-color);
      
      &.healthy {
        color: var(--success-color);
      }
      
      &.unhealthy {
        color: var(--error-color);
      }
    }
  }
  
  .status {
    font-size: var(--font-size-xl);
    font-weight: bold;
    margin: var(--spacing-sm) 0;
    
    &.healthy {
      color: var(--success-color);
    }
    
    &.unhealthy {
      color: var(--error-color);
    }
  }
  
  .time,
  .uptime {
    color: var(--text-color-secondary);
    margin: var(--spacing-xs) 0;
  }
  
  .resource-value {
    font-size: var(--font-size-xl);
    font-weight: bold;
    color: var(--primary-color);
  }
  
  .loading {
    color: var(--text-color-secondary);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-xs);
  }

  .section-title {
    margin: 0;
    font-size: 16px;
    font-weight: bold;
    color: var(--van-text-color);
  }

  .quick-actions {
    margin: 16px 0;
    padding: 16px;
    background-color: #fff;
    border-radius: 8px;

    .section-title {
      margin-bottom: 16px;
    }
  }

  .todo-list,
  .recent-messages {
    margin: 16px 0;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding: 0 16px;
    }
  }
}
</style> 