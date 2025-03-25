/**
 * 测试环境入口文件
 * 包含日志、性能和网络监控的初始化
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Vant from 'vant'
import 'vant/lib/index.css'

import { initMobileAdapter } from './utils/mobileAdapter'
import { registerServiceWorker } from './pwa/register-service-worker'
import { initMonitoring, Environment, generateTestData } from './utils/monitor'

// 创建应用实例
const app = createApp(App)

// 注册路由和UI组件
app.use(router)
app.use(Vant)

// 初始化移动端适配
initMobileAdapter()

// 初始化监控系统
const monitoring = initMonitoring({
  environment: Environment.DEVELOPMENT,
  appVersion: '1.0.0-test',
  logger: {
    enabled: true,
    remoteLogging: false,
    logLevel: 'debug'
  },
  performance: {
    enabled: true,
    remoteReporting: false
  },
  network: {
    enabled: true,
    includeRequestBody: true,
    includeResponseBody: true
  }
})

// 暴露给全局，方便调试
window.monitoring = monitoring
window.generateTestData = generateTestData

// 注册Service Worker
registerServiceWorker()

// 挂载应用
app.mount('#app')

// 生成一些测试数据
setTimeout(() => {
  generateTestData()
}, 1000) 